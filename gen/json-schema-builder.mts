// json-schema-builder.mts
import path from 'node:path'

import { JsonFileWriter } from './json-file-writer.mts'
import { assignOrderToChildren, BuiltNode, createReferenceNode, createSchemaBuilder, emitSchema, JSONSchemaAST, SchemaNode } from './json-schema-builder.builder.mts'

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

	const fileWriter = new JsonFileWriter({
		baseDirectory,
		eraseOutputDirectory,
	})

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
			const schemasMap = new Map<string, JSONSchemaAST>()
			for (const schemaNode of schemas) {
				const ast = emitSchema(schemaNode.schema, schemaNode.file, new Set(), schemaNode.orderMode)
				schemasMap.set(schemaNode.file, ast)
			}
			await fileWriter.write(schemasMap)
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

	return api
}
