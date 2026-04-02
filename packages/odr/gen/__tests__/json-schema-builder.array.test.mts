import { describe, it, expect } from 'vitest'

import { jsonSchema } from '../../gen/json-schema-builder.mts'

describe('JSON Schema Builder - Array Schemas', () => {
	const testOutputDirectory = './test-output/schemas'

	describe('Basic Array Schemas', () => {
		it('should create an array schema with items', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('tags.json')

			schema.array(s.string())

			const result = s.build()
			expect(result['tags.json']).toEqual({
				type: 'array',
				items: { type: 'string' },
				additionalItems: false,
				unevaluatedItems: false,
			})
		})
		it('should create an array schema with items of different types', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('tags.json')

			schema.array(s.anyOf(s.string(), s.number()))

			const result = s.build()
			expect(result['tags.json']).toEqual({
				type: 'array',
				items: {
					anyOf: [
						{ type: 'string' },
						{ type: 'number' },
					],
				},
				additionalItems: false,
				unevaluatedItems: false,
			})
		})
	})

	describe('Strict Defaults', () => {
		it('should default to additionalItems: false for arrays', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.array(s.string())

			const result = s.build()
			expect(result['test.json'].additionalItems).toBe(false)
		})

		it('should default to unevaluatedItems: false for arrays', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.array(s.string())

			const result = s.build()
			expect(result['test.json'].unevaluatedItems).toBe(false)
		})
	})

	describe('Allow Additional/Unevaluated', () => {
		it('should allow unevaluated items for arrays', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.array(s.string()).allowUnevaluated()

			const result = s.build()
			expect(result['test.json'].unevaluatedItems).toBe(true)
		})
	})

	describe('Tuple Schemas', () => {
		it('should handle tuple schemas with prefixItems', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.tuple(s.string(), s.number(), s.boolean())

			const result = s.build()
			expect(result['test.json']).toEqual({
				type: 'array',
				prefixItems: [
					{ type: 'string', order: 0 },
					{ type: 'number', order: 1 },
					{ type: 'boolean', order: 2 },
				],
				items: false,
				unevaluatedItems: false,
			})
		})

		it('should order tuple items by declaration order in strict mode with order value', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.tuple(s.string(), s.number(), s.boolean())

			const result = s.build()
			const prefixItems = result['test.json'].prefixItems
			expect(prefixItems?.[0].order).toBe(0)
			expect(prefixItems?.[1].order).toBe(1)
			expect(prefixItems?.[2].order).toBe(2)
		})

		it('should order tuple items by declaration order in loose mode without order value', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.tuple(s.string(), s.number(), s.boolean()).order('loose')

			const result = s.build()
			const prefixItems = result['test.json'].prefixItems
			expect(prefixItems?.[0].order).toBeUndefined()
			expect(prefixItems?.[1].order).toBeUndefined()
			expect(prefixItems?.[2].order).toBeUndefined()
		})

		it('should maintain tuple item order when building', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.tuple(s.boolean(), s.string(), s.number())

			const result = s.build()
			const prefixItems = result['test.json'].prefixItems
			expect(prefixItems?.[0].type).toBe('boolean')
			expect(prefixItems?.[1].type).toBe('string')
			expect(prefixItems?.[2].type).toBe('number')
		})
	})
})
