// json-schema-builder.mts
import fs from 'node:fs/promises'
import path from 'node:path'

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

interface SchemaNode {
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
 * Builder interface for constructing JSON Schema files with a fluent API.
 * Allows chaining methods to define the schema structure.
 */
export interface SchemaBuilder {
	/** Internal property for ref resolution */
	__schemaNode?: SchemaNode

	/**
	 * Defines an object schema with the given properties.
	 * By default, no additional properties are allowed unless `allowAdditional()` is called.
	 *
	 * @param properties - Record of property names to their schema definitions
	 * @returns This builder for method chaining
	 */
	object(properties: Record<string, BuiltNode>): this

	/**
	 * Adds pattern-based property validation to an object schema.
	 * Properties matching the regex patterns will be validated against their schemas.
	 *
	 * @param patterns - Record of regex patterns to their schema definitions
	 * @returns This builder for method chaining
	 */
	patternProperties(patterns: Record<string, BuiltNode>): this

	/**
	 * Defines an array schema where all items validate against the given schema.
	 * For positional/tuple validation, use `tuple()` instead.
	 *
	 * @param items - Schema that all array items must validate against
	 * @returns This builder for method chaining
	 */
	array(items: BuiltNode): this

	/**
	 * Defines a tuple schema with strict positional item validation.
	 * By default, additional items beyond the defined positions are not allowed.
	 *
	 * @param items - Schemas for each position in the tuple
	 * @returns This builder for method chaining
	 */
	tuple(...items: BuiltNode[]): this

	/**
	 * Creates a reference to another schema.
	 * The reference can be to another SchemaBuilder, a BuiltNode, or a string path.
	 *
	 * @param node - Function returning the schema to reference
	 * @returns This builder for method chaining
	 */
	ref(node: () => BuiltNode | string | SchemaBuilder): this

	/**
	 * Directly defines this schema using a pre-built node.
	 * Useful for composing schemas or using advanced schema features.
	 *
	 * @param built - The built node to use as this schema's definition
	 * @returns This builder for method chaining
	 */
	def(built: BuiltNode): this

	/**
	 * Allows additional properties (for objects) or items (for tuples/arrays).
	 * By default, additional properties/items are not allowed.
	 *
	 * @returns This builder for method chaining
	 */
	allowAdditional(): this

	/**
	 * Allows unevaluated properties (for objects) or unevaluated items (for arrays).
	 * By default, unevaluated properties/items are not allowed.
	 * This is stricter than additionalProperties as it accounts for composition keywords.
	 *
	 * @returns This builder for method chaining
	 */
	allowUnevaluated(): this

	/**
	 * Sets the ordering mode for this schema's properties or items.
	 * - 'strict': Properties/items are ordered by declaration order (0, 1, 2, ...)
	 * - 'loose': No ordering is applied
	 *
	 * @param mode - The ordering mode to use
	 * @returns This builder for method chaining
	 */
	order(mode: 'strict' | 'loose'): this
}

export interface JsonSchemaWriterOptions {
	/**
	 * The output directory where schema files will be written.
	 * Can be absolute or relative to the current working directory.
	 */
	outputDirectory: string

	/**
	 * Whether to erase the output directory before writing schemas.
	 * @default true
	 */
	eraseOutputDirectory?: boolean
}

/**
 * Creates a JSON Schema writer for building and outputting JSON Schema files.
 *
 * @param options - Configuration options for the schema writer
 * @returns An API object with methods for creating and managing schemas
 *
 * @example
 * ```typescript
 * const js = jsonSchema({
 *   outputDirectory: './schemas',
 *   eraseOutputDirectory: true
 * })
 *
 * const person = js.schema('./person.json')
 *   .object({
 *     name: js.required.string(),
 *     age: js.required.number(),
 *   })
 *
 * await js.write()
 * ```
 */
export function jsonSchema(options: JsonSchemaWriterOptions) {
	const baseDirectory = path.resolve(process.cwd(), options.outputDirectory)
	const eraseOutputDirectory = options.eraseOutputDirectory ?? true
	const schemas: SchemaNode[] = []
	const definitions = new Map<string, BuiltNode>()
	let currentFile: SchemaNode | undefined

	function createReferenceNode(node: () => BuiltNode | string | SchemaBuilder): BuiltNode {
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

	function emitSchema(schema: BuiltNode, file: string, seen: Set<BuiltNode>, orderMode: 'strict' | 'loose' = 'strict'): JSONSchemaAST {
		// Handle ref nodes first before processing as regular objects
		if ('__ref__' in schema) {
			const target = schema.__ref__
			let referencePath: string

			if (typeof target === 'string') {
				referencePath = target
			}
			else if (typeof target === 'object' && target !== undefined && target !== null && 'file' in target) {
				// It's a SchemaNode - calculate relative path
				const targetFile = (target as SchemaNode).file
				const currentDirectory = path.dirname(file)
				referencePath = path.relative(currentDirectory, targetFile).replaceAll(path.sep, '/')
				// Ensure relative paths start with ./
				if (!referencePath.startsWith('.')) {
					referencePath = './' + referencePath
				}
			}
			else {
				// Fallback for unknown types
				referencePath = `#/$defs/${String(target)}`
			}

			return { $ref: referencePath }
		}

		if (seen.has(schema)) {
			return {}
		}
		seen.add(schema)

		const output: JSONSchemaAST = {}
		for (const [key, value] of Object.entries(schema)) {
			if (key === '__ref__' || key === '__schemaNode') {
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

			if (value && typeof value === 'object') {
				if (Array.isArray(value)) {
					output[key] = value.map(item => emitSchema(item as BuiltNode, file, seen, orderMode))
				}
				else if (typeof value === 'object' && '__ref__' in value) {
					const target = (value as BuiltNode).__ref__
					let referencePath: string

					if (typeof target === 'string') {
						referencePath = target
					}
					else if (typeof target === 'object' && target !== undefined && target !== null && 'file' in target) {
						// It's a SchemaNode - calculate relative path
						const targetFile = (target as SchemaNode).file
						const currentDirectory = path.dirname(file)
						referencePath = path.relative(currentDirectory, targetFile).replaceAll(path.sep, '/')
						// Ensure relative paths start with ./
						if (!referencePath.startsWith('.')) {
							referencePath = './' + referencePath
						}
					}
					else {
						// Fallback for unknown types
						referencePath = `#/$defs/${String(target)}`
					}

					// Create a nested object with $ref instead of setting it on the parent
					output[key] = { $ref: referencePath }
				}
				else {
					output[key] = emitSchema(value as BuiltNode, file, seen, orderMode)
				}
			}
			else {
				output[key] = value
			}
		}

		// Apply strict ordering if enabled
		if (orderMode === 'strict') {
			if (schema.type === 'object' && schema.properties) {
				const orderedProperties: Record<string, JSONSchemaAST> = {}
				const entries = Object.entries(output.properties as Record<string, JSONSchemaAST>)
					.map(([propertyKey, propertyValue]) => ({
						key: propertyKey,
						value: propertyValue,
						order: (schema.properties?.[propertyKey])?.order ?? Infinity,
					}))
					.toSorted((a, b) => a.order - b.order)

				for (const { key, value } of entries) {
					orderedProperties[key] = value
				}
				output.properties = orderedProperties
			}

			if (schema.type === 'array' && schema.prefixItems) {
				const prefixItemsArray = output.prefixItems as JSONSchemaAST[]
				const orderedItems = prefixItemsArray
					.map((item, index) => ({
						item,
						order: (schema.prefixItems?.[index])?.order ?? Infinity,
					}))
					.toSorted((a, b) => a.order - b.order)
					.map(({ item }) => item)

				output.prefixItems = orderedItems
			}
		}

		// Apply implicit restrictions unless allowAdditional or allowUnevaluated was called
		if (schema.type === 'object' && !('additionalProperties' in schema)) {
			output.additionalProperties = false
		}
		if (schema.type === 'object' && !('unevaluatedProperties' in schema)) {
			output.unevaluatedProperties = false
		}
		if (schema.type === 'array' && schema.prefixItems && !('items' in schema)) {
			output.items = false
		}
		if (schema.type === 'array' && schema.items && !('additionalItems' in schema)) {
			output.additionalItems = false
		}
		if (schema.type === 'array' && !('unevaluatedItems' in schema)) {
			output.unevaluatedItems = false
		}

		return output
	}

	const primitiveBuilders = {
		string: (): BuiltNode => ({ type: 'string' }),
		number: (): BuiltNode => ({ type: 'number' }),
		boolean: (): BuiltNode => ({ type: 'boolean' }),
		null: (): BuiltNode => ({ type: 'null' }),
		url: (): BuiltNode => ({ type: 'string', format: 'uri' }),
		iri: (): BuiltNode => ({ type: 'string', format: 'iri' }),
		const: (value: unknown): BuiltNode => ({ const: value }),
		array: (items: BuiltNode): BuiltNode => ({
			items,
			type: 'array',
		}),
		object: (properties: Record<string, BuiltNode>): BuiltNode => ({
			type: 'object',
			properties: assignOrderToChildren(properties),
			required: Object.keys(properties),
		}),
	}

	function assignOrderToChildren<T extends BuiltNode[] | Record<string, BuiltNode>>(value: T): T {
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

	const api = {
		// Expose internals for debugging
		_schemas: schemas,
		_definitions: definitions,
		_currentFile: currentFile,

		/**
		 * Creates a new schema file with optional metadata.
		 * Returns a builder that allows defining the schema structure using method chaining.
		 *
		 * @param file - Relative path where the schema file should be written
		 * @param meta - Optional metadata to include in the schema (e.g., $id, title, description)
		 * @returns A SchemaBuilder for defining the schema structure
		 *
		 * @example
		 * ```typescript
		 * const userSchema = js.schema('./user.json', { title: 'User Schema' })
		 *   .object({
		 *     id: js.required.string(),
		 *     name: js.required.string(),
		 *   })
		 * ```
		 */
		schema(file: string, meta: Record<string, unknown> = {}): SchemaBuilder {
			const schemaNode: SchemaNode = { file, schema: { ...meta }, orderMode: 'strict' }
			schemas.push(schemaNode)
			currentFile = schemaNode
			return createSchemaBuilder(schemaNode)
		},

		/**
		 * Registers a named definition that can be referenced from other schemas.
		 * Useful for creating reusable schema components.
		 *
		 * @param name - The name of the definition
		 * @param built - The schema node to register
		 * @returns The built node that was registered
		 *
		 * @throws Error if a definition with the same name already exists
		 */
		def(name: string, built: BuiltNode): BuiltNode {
			if (definitions.has(name)) {
				throw new Error(`Definition "${name}" already defined`)
			}
			definitions.set(name, built)
			return built
		},

		/**
		 * Creates a reference node that points to another schema.
		 * The reference is resolved lazily, allowing forward references.
		 *
		 * @param node - Function returning the schema to reference
		 * @returns A BuiltNode representing the reference
		 *
		 * @example
		 * ```typescript
		 * const person = js.schema('./person.json')
		 * const team = js.schema('./team.json')
		 *   .object({
		 *     members: js.array(js.ref(() => person))
		 *   })
		 * ```
		 */
		ref(node: () => BuiltNode | string | SchemaBuilder): BuiltNode {
			return createReferenceNode(node)
		},

		/**
		 * Builds all registered schemas into their JSON Schema AST representations.
		 * This does not write files, but returns the in-memory representation.
		 *
		 * @returns A record mapping file paths to their JSON Schema AST
		 */
		build(): Record<string, JSONSchemaAST> {
			const result: Record<string, JSONSchemaAST> = {}
			for (const schemaNode of schemas) {
				result[schemaNode.file] = emitSchema(schemaNode.schema, schemaNode.file, new Set(), schemaNode.orderMode)
			}
			return result
		},

		/**
		 * Writes all registered schemas to their respective files in the base directory.
		 * Creates any necessary parent directories automatically.
		 * If eraseOutputDirectory is enabled, removes all existing files in the directory first.
		 *
		 * @returns A promise that resolves when all files have been written
		 *
		 * @example
		 * ```typescript
		 * const js = jsonSchema({ outputDirectory: './schemas' })
		 * js.schema('./user.json').object({ name: js.required.string() })
		 * await js.write()
		 * ```
		 */
		async write(): Promise<void> {
			// Erase output directory if option is enabled
			if (eraseOutputDirectory) {
				try {
					await fs.rm(baseDirectory, { recursive: true, force: true })
				}
				catch {
					// Ignore errors if directory doesn't exist
				}
			}

			// Write all schemas
			for (const schemaNode of schemas) {
				const ast = emitSchema(schemaNode.schema, schemaNode.file, new Set(), schemaNode.orderMode)
				const outPath = path.resolve(baseDirectory, schemaNode.file)
				await fs.mkdir(path.dirname(outPath), { recursive: true })
				await fs.writeFile(outPath, JSON.stringify(ast, undefined, '\t') + '\n', 'utf8')
			}
		},

		/**
		 * Builders for creating required schema nodes.
		 * These automatically mark the containing property as required.
		 */
		required: primitiveBuilders,

		/**
		 * Creates a string schema.
		 *
		 * @returns A BuiltNode representing the string schema
		 */
		string: (): BuiltNode => ({ type: 'string' }),

		/**
		 * Creates a number schema.
		 *
		 * @returns A BuiltNode representing the number schema
		 */
		number: (): BuiltNode => ({ type: 'number' }),

		/**
		 * Creates a boolean schema.
		 *
		 * @returns A BuiltNode representing the boolean schema
		 */
		boolean: (): BuiltNode => ({ type: 'boolean' }),

		/**
		 * Creates a null schema.
		 *
		 * @returns A BuiltNode representing the null schema
		 */
		null: (): BuiltNode => ({ type: 'null' }),

		/**
		 * Creates a URL/URI string schema with format validation.
		 *
		 * @returns A BuiltNode representing the URI string schema
		 */
		url: (): BuiltNode => ({ type: 'string', format: 'uri' }),

		/**
		 * Creates an IRI string schema with format validation.
		 *
		 * @returns A BuiltNode representing the IRI string schema
		 */
		iri: (): BuiltNode => ({ type: 'string', format: 'iri' }),

		/**
		 * Creates a const schema that validates against a specific value.
		 *
		 * @param value - The exact value to validate against
		 * @returns A BuiltNode representing the const schema
		 */
		const: (value: unknown): BuiltNode => ({ const: value }),

		/**
		 * Creates an object schema with optional properties.
		 * Properties are not automatically marked as required.
		 *
		 * @param properties - Record of property names to their schema definitions
		 * @returns A BuiltNode representing the object schema
		 */
		object: (properties: Record<string, BuiltNode>): BuiltNode => ({
			type: 'object',
			properties: assignOrderToChildren(properties),
		}),

		/**
		 * Creates an array schema where all items validate against the given schema.
		 * For positional/tuple validation, use `tuple()` instead.
		 *
		 * @param items - Schema that all array items must validate against
		 * @returns A BuiltNode representing the array schema
		 */
		array: (items: BuiltNode): BuiltNode => ({
			items,
			type: 'array',
		}),

		/**
		 * Creates a tuple schema with strict positional validation.
		 *
		 * @param items - Schemas for each position in the tuple
		 * @returns A BuiltNode representing the tuple schema
		 */
		tuple: (...items: BuiltNode[]): BuiltNode => ({
			prefixItems: assignOrderToChildren(items),
			type: 'array',
		}),

		/**
		 * Creates a oneOf union schema.
		 * Validates against exactly one of the provided schemas.
		 *
		 * @param arguments_ - The schemas to choose from
		 * @returns A BuiltNode representing the oneOf schema
		 */
		oneOf: (...arguments_: BuiltNode[]): BuiltNode => ({ oneOf: arguments_ }),

		/**
		 * Creates an anyOf union schema.
		 * Validates against one or more of the provided schemas.
		 *
		 * @param arguments_ - The schemas to choose from
		 * @returns A BuiltNode representing the anyOf schema
		 */
		anyOf: (...arguments_: BuiltNode[]): BuiltNode => ({ anyOf: arguments_ }),

		/**
		 * Creates an allOf intersection schema.
		 * Validates against all of the provided schemas.
		 *
		 * @param arguments_ - The schemas that must all match
		 * @returns A BuiltNode representing the allOf schema
		 */
		allOf: (...arguments_: BuiltNode[]): BuiltNode => ({ allOf: arguments_ }),

		/**
		 * Creates a not schema.
		 * Validates when the data does NOT match the provided schema.
		 *
		 * @param schema - The schema to negate
		 * @returns A BuiltNode representing the not schema
		 */
		not: (schema: BuiltNode): BuiltNode => ({ not: schema }),

		/**
		 * Creates an enum schema that validates against a fixed set of values.
		 *
		 * @param values - The allowed values (at least 2 required)
		 * @returns A BuiltNode representing the enum schema
		 *
		 * @throws Error if fewer than 2 values are provided
		 */
		enum: (...values: unknown[]): BuiltNode => {
			if (values.length < 2) {
				throw new Error('js.enum requires at least 2 values')
			}
			return { enum: values }
		},
	}

	function createSchemaBuilder(schemaNode: SchemaNode): SchemaBuilder {
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
				}
				else if (typeof target === 'object' && target !== undefined && target !== null && '__ref__' in target) {
					const reference = (target).__ref__
					if (typeof reference === 'string') {
						schemaNode.schema.$ref = reference
					}
					else if (typeof reference === 'object' && reference !== undefined && reference !== null && 'file' in reference) {
						// It's a SchemaNode - create a relative path reference
						const targetSchemaNode = reference as SchemaNode
						const currentDirectory = path.dirname(schemaNode.file)
						let referencePath = path.relative(currentDirectory, targetSchemaNode.file).replaceAll(path.sep, '/')
						// Ensure relative paths start with ./
						if (!referencePath.startsWith('.')) {
							referencePath = './' + referencePath
						}
						schemaNode.schema.$ref = referencePath
					}
					else {
						// reference is an unknown object - this shouldn't happen in normal usage
						throw new Error('Invalid ref target: __ref__ must resolve to a string or SchemaNode')
					}
				}
				else if (typeof target === 'object' && target !== undefined && target !== null && '__schemaNode' in target) {
					// It's a SchemaBuilder - create a relative path reference
					const targetSchemaNode = (target as SchemaBuilder).__schemaNode
					if (targetSchemaNode) {
						const currentDirectory = path.dirname(schemaNode.file)
						let referencePath = path.relative(currentDirectory, targetSchemaNode.file).replaceAll(path.sep, '/')
						// Ensure relative paths start with ./
						if (!referencePath.startsWith('.')) {
							referencePath = './' + referencePath
						}
						schemaNode.schema.$ref = referencePath
					}
				}
				else if (typeof target === 'object' && target !== undefined && target !== null) {
					// Direct BuiltNode reference - copy it
					Object.assign(schemaNode.schema, target)
				}
				else {
					schemaNode.schema.$ref = String(target)
				}
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

	return api
}
