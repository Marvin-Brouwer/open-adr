import { describe, it, expect } from 'vitest'

import { jsonSchema } from '../../gen/json-schema-builder.mts'

describe('JSON Schema Builder - Main Functionality', () => {
	const testOutputDirectory = './test-output/schemas'

	describe('Primitive Types', () => {
		it('should create primitive type schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })

			expect(s.string()).toEqual({ type: 'string' })
			expect(s.number()).toEqual({ type: 'number' })
			expect(s.boolean()).toEqual({ type: 'boolean' })
			expect(s.null()).toEqual({ type: 'null' })
		})

		it('should create const schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })

			expect(s.const('user')).toEqual({ const: 'user' })
			expect(s.const(42)).toEqual({ const: 42 })
		})
	})

	describe('Schema Composition', () => {
		it('should create oneOf schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('value.json')

			schema.def(s.oneOf(s.string(), s.number()))

			const result = s.build()
			expect(result['value.json']).toEqual({
				oneOf: [
					{ type: 'string' },
					{ type: 'number' },
				],
			})
		})

		it('should create anyOf schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('value.json')

			schema.def(s.anyOf(s.string(), s.null()))

			const result = s.build()
			expect(result['value.json']).toEqual({
				anyOf: [
					{ type: 'string' },
					{ type: 'null' },
				],
			})
		})

		it('should create allOf schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('value.json')

			schema.def(s.allOf(
				s.object({ type: s.required.const('user') }),
				s.object({ name: s.required.string() }),
			))

			const result = s.build()
			expect(result['value.json']).toEqual({
				allOf: [
					{
						type: 'object',
						properties: { type: { const: 'user', order: 0 } },
						additionalProperties: false,
						unevaluatedProperties: false,
					},
					{
						type: 'object',
						properties: { name: { type: 'string', order: 0 } },
						additionalProperties: false,
						unevaluatedProperties: false,
					},
				],
			})
		})

		it('should create enum schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })

			expect(s.enum('red', 'green', 'blue')).toEqual({
				enum: ['red', 'green', 'blue'],
			})
		})
	})

	describe('References', () => {
		it('should create references between schemas using SchemaBuilder.ref()', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const user = s.schema('user.json')
			const post = s.schema('post.json')

			user.object({
				id: s.required.string(),
				name: s.required.string(),
			})

			// Use SchemaBuilder.ref() to reference another schema file
			post.ref(() => user)

			const result = s.build()
			expect(result['post.json'].$ref).toBe('./user.json')
		})

		it('should create references in nested directories', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const base = s.schema('types/base.json')
			const entity = s.schema('elements/entity.json')

			base.object({ type: s.required.const('base') })
			entity.ref(() => base)

			const result = s.build()
			expect(result['elements/entity.json'].$ref).toBe('../types/base.json')
		})

		it('should handle circular references', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const node = s.schema('node.json')

			node.object({
				value: s.required.string(),
				children: s.required.array(s.ref(() => node)),
			})

			const result = s.build()
			expect(result['node.json'].properties?.children).toMatchObject({
				items: { $ref: './node.json' },
				type: 'array',
			})
		})
	})

	describe('Edge Cases', () => {
		it('should handle schemas with metadata', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json', {
				title: 'Test Schema',
				$id: 'https://example.com/test.json',
			})

			schema.object({ name: s.required.string() })

			const result = s.build()
			expect(result['test.json'].title).toBe('Test Schema')
			expect(result['test.json'].$id).toBe('https://example.com/test.json')
		})

		it('should handle empty object schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({})

			const result = s.build()
			expect(result['test.json']).toEqual({
				type: 'object',
				properties: {},
				required: [],
				additionalProperties: false,
				unevaluatedProperties: false,
			})
		})
	})
})
