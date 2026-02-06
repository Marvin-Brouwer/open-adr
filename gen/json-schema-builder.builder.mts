// json-schema-builder.builder.mts
import path from 'node:path'

import type { SchemaBuilder } from './json-schema-builder.mts'

/**
 * Represents a JSON Schema AST structure conforming to JSON Schema Draft 2020-12.
 * This type is used for the final emitted schema output.
 */
export type JSONSchemaAST = {
	$schema?: string
	$id?: string
	title?: string
	type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
	properties?: Record<string, JSONSchemaAST>
	items?: JSONSchemaAST | false
	prefixItems?: JSONSchemaAST[]
	required?: string[]
	additionalProperties?: boolean | JSONSchemaAST
	const?: unknown
	enum?: unknown[]
	oneOf?: JSONSchemaAST[]
	allOf?: JSONSchemaAST[]
	anyOf?: JSONSchemaAST[]
	not?: JSONSchemaAST
	$ref?: string
	order?: number
	[key: string]: unknown
}

export interface SchemaNode {
	file: string
	schema: BuiltNode
	emitted?: boolean
	orderMode?: 'strict' | 'loose'
}

/**
 * Represents a built schema node that can be composed into larger schemas.
 * This is the internal representation used during schema construction.
 */
export type BuiltNode = {
	type?: string
	properties?: Record<string, BuiltNode>
	items?: BuiltNode | BuiltNode[]
	prefixItems?: BuiltNode[]
	required?: string[]
	additionalProperties?: boolean
	const?: unknown
	enum?: unknown[]
	oneOf?: BuiltNode[]
	allOf?: BuiltNode[]
	anyOf?: BuiltNode[]
	not?: BuiltNode
	$ref?: string
	order?: number
	[key: string]: unknown
}

/**
 * Resolves a reference target to a JSON Schema $ref path
 */
function resolveReferencePath(target: unknown, currentFile: string): string {
	if (typeof target === 'string') {
		return target
	}

	if (typeof target === 'object' && target !== undefined && target !== null && 'file' in target) {
		const targetFile = (target as SchemaNode).file
		const currentDirectory = path.dirname(currentFile)
		let referencePath = path.relative(currentDirectory, targetFile).replaceAll(path.sep, '/')

		// Ensure relative paths start with ./
		if (!referencePath.startsWith('.')) {
			referencePath = './' + referencePath
		}
		return referencePath
	}

	// Fallback for unknown types
	return `#/$defs/${String(target)}`
}

/**
 * Creates a reference node that lazily resolves to the target schema
 */
export function createReferenceNode(node: () => BuiltNode | string | SchemaBuilder): BuiltNode {
	const referenceNode: BuiltNode = {}
	Object.defineProperty(referenceNode, '__ref__', {
		get() {
			const result = node()
			// If it's a SchemaBuilder with __schemaNode, return the SchemaNode
			if (typeof result === 'object' && result !== undefined && '__schemaNode' in result) {
				return (result as SchemaBuilder).__schemaNode as SchemaNode | string | BuiltNode
			}
			return result
		},
	})
	return referenceNode
}

/**
 * Assigns order numbers to children (properties or items) for strict ordering
 */
export function assignOrderToChildren<T extends BuiltNode[] | Record<string, BuiltNode>>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item, index) => ({ ...item, order: index })) as T
	}
	// It's a Record<string, BuiltNode>
	let order = 0
	const result: Record<string, BuiltNode> = {}
	for (const [key, node] of Object.entries(value)) {
		result[key] = { ...node, order: order++ }
	}
	return result as T
}

/**
 * Processes a schema value during emission
 */
function processSchemaValue(
	value: unknown,
	file: string,
	seen: Set<BuiltNode>,
	orderMode: 'strict' | 'loose',
): unknown {
	if (!value || typeof value !== 'object') {
		return value
	}

	if (Array.isArray(value)) {
		return value.map(item => emitSchema(item as BuiltNode, file, seen, orderMode))
	}

	if ('__ref__' in value) {
		const target = (value as BuiltNode).__ref__
		return { $ref: resolveReferencePath(target, file) }
	}

	return emitSchema(value as BuiltNode, file, seen, orderMode)
}

/**
 * Sorts object properties by their order values
 */
function sortObjectPropertiesByOrder(
	properties: Record<string, JSONSchemaAST>,
	schemaProperties: Record<string, BuiltNode>,
): Record<string, JSONSchemaAST> {
	const entries = Object.entries(properties)
		.map(([propertyKey, propertyValue]) => ({
			key: propertyKey,
			value: propertyValue,
			order: schemaProperties[propertyKey]?.order ?? Infinity,
		}))
		.toSorted((a, b) => a.order - b.order)

	const orderedProperties: Record<string, JSONSchemaAST> = {}
	for (const { key, value } of entries) {
		orderedProperties[key] = value
	}
	return orderedProperties
}

/**
 * Sorts array prefix items by their order values
 */
function sortPrefixItemsByOrder(
	prefixItems: JSONSchemaAST[],
	schemaPrefixItems: BuiltNode[],
): JSONSchemaAST[] {
	return prefixItems
		.map((item, index) => ({
			item,
			order: schemaPrefixItems[index]?.order ?? Infinity,
		}))
		.toSorted((a, b) => a.order - b.order)
		.map(({ item }) => item)
}

/**
 * Applies implicit schema restrictions based on schema type
 */
function applyImplicitRestrictions(output: JSONSchemaAST, schema: BuiltNode): void {
	if (schema.type === 'object') {
		if (!('additionalProperties' in schema)) {
			output.additionalProperties = false
		}
		if (!('unevaluatedProperties' in schema)) {
			output.unevaluatedProperties = false
		}
	}

	if (schema.type === 'array') {
		if (schema.prefixItems && !('items' in schema)) {
			output.items = false
		}
		if (schema.items && !('additionalItems' in schema)) {
			output.additionalItems = false
		}
		if (!('unevaluatedItems' in schema)) {
			output.unevaluatedItems = false
		}
	}
}

/**
 * Emits a BuiltNode as a JSON Schema AST, resolving references and applying ordering
 */
export function emitSchema(
	schema: BuiltNode,
	file: string,
	seen: Set<BuiltNode>,
	orderMode: 'strict' | 'loose' = 'strict',
): JSONSchemaAST {
	// Handle ref nodes first before processing as regular objects
	if ('__ref__' in schema) {
		return { $ref: resolveReferencePath(schema.__ref__, file) }
	}

	if (seen.has(schema)) {
		return {}
	}
	seen.add(schema)

	const output: JSONSchemaAST = {}
	for (const [key, value] of Object.entries(schema)) {
		// Skip internal properties
		if (key === '__ref__' || key === '__schemaNode') {
			continue
		}

		// Skip order property in loose mode
		if (key === 'order' && orderMode === 'loose') {
			continue
		}

		// Skip recursive processing for primitive arrays like 'required' and 'enum'
		if (key === 'required') {
			output.required = value as string[]
			continue
		}
		if (key === 'enum') {
			output.enum = value as unknown[]
			continue
		}

		output[key] = processSchemaValue(value, file, seen, orderMode)
	}

	// Apply strict ordering if enabled
	if (orderMode === 'strict') {
		if (schema.type === 'object' && schema.properties) {
			output.properties = sortObjectPropertiesByOrder(
				output.properties as Record<string, JSONSchemaAST>,
				schema.properties,
			)
		}

		if (schema.type === 'array' && schema.prefixItems) {
			output.prefixItems = sortPrefixItemsByOrder(
				output.prefixItems as JSONSchemaAST[],
				schema.prefixItems,
			)
		}
	}

	applyImplicitRestrictions(output, schema)

	return output
}

/**
 * Creates a SchemaBuilder instance that provides a fluent API for building schemas
 */
export function createSchemaBuilder(schemaNode: SchemaNode): SchemaBuilder {
	const builder = {
		// Expose the schema node for ref resolution
		__schemaNode: schemaNode,

		object(properties: Record<string, BuiltNode>) {
			schemaNode.schema.type = 'object'
			schemaNode.schema.properties = assignOrderToChildren(properties)
			schemaNode.schema.required = Object.keys(properties)
			return this
		},

		array(items: BuiltNode) {
			schemaNode.schema.items = items
			schemaNode.schema.type = 'array'
			return this
		},

		tuple(...items: BuiltNode[]) {
			schemaNode.schema.prefixItems = assignOrderToChildren(items)
			schemaNode.schema.type = 'array'
			return this
		},

		ref(node: () => BuiltNode | string | SchemaBuilder) {
			const target = node()

			if (typeof target === 'string') {
				schemaNode.schema.$ref = target
				return this
			}

			if (typeof target === 'object' && target !== undefined && target !== null) {
				if ('__ref__' in target) {
					const reference = target.__ref__
					if (typeof reference === 'object' && reference !== null && !('file' in reference)) {
						throw new Error('Invalid ref target: __ref__ must resolve to a string or SchemaNode')
					}
					schemaNode.schema.$ref = resolveReferencePath(reference, schemaNode.file)
					return this
				}

				if ('__schemaNode' in target) {
					const targetSchemaNode = (target as SchemaBuilder).__schemaNode
					if (targetSchemaNode) {
						schemaNode.schema.$ref = resolveReferencePath(targetSchemaNode, schemaNode.file)
					}
					return this
				}

				// Direct BuiltNode reference - copy it
				Object.assign(schemaNode.schema, target)
				return this
			}

			schemaNode.schema.$ref = String(target)
			return this
		},

		def(built: BuiltNode) {
			Object.assign(schemaNode.schema, built)
			return this
		},

		patternProperties(patterns: Record<string, BuiltNode>) {
			schemaNode.schema.patternProperties = assignOrderToChildren(patterns)
			return this
		},

		allowAdditional() {
			schemaNode.schema.additionalProperties = true
			return this
		},

		allowUnevaluated() {
			if (schemaNode.schema.type === 'object') {
				schemaNode.schema.unevaluatedProperties = true
			}
			else if (schemaNode.schema.type === 'array') {
				schemaNode.schema.unevaluatedItems = true
			}
			return this
		},

		order(mode: 'strict' | 'loose') {
			schemaNode.orderMode = mode
			return this
		},
	}

	return builder
}
