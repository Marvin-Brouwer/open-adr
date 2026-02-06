import { describe, it, expect } from 'vitest'

import { jsonSchema } from '../../gen/json-schema-builder.mts'

describe('JSON Schema Builder - Object Schemas', () => {
	const testOutputDirectory = './test-output/schemas'

	describe('Basic Object Schemas', () => {
		it('should create a simple object schema with required properties', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('user.json')

			schema.object({
				name: s.required.string(),
				age: s.required.number(),
			})

			const result = s.build()
			expect(result['user.json']).toEqual({
				type: 'object',
				properties: {
					name: { type: 'string', order: 0 },
					age: { type: 'number', order: 1 },
				},
				required: ['name', 'age'],
				additionalProperties: false,
				unevaluatedProperties: false,
			})
		})
	})

	describe('Strict Defaults', () => {
		it('should default to additionalProperties: false for objects', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({ name: s.required.string() })

			const result = s.build()
			expect(result['test.json'].additionalProperties).toBe(false)
		})

		it('should default to unevaluatedProperties: false for objects', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({ name: s.required.string() })

			const result = s.build()
			expect(result['test.json'].unevaluatedProperties).toBe(false)
		})
	})

	describe('Allow Additional/Unevaluated', () => {
		it('should allow additional properties when explicitly enabled', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({ name: s.required.string() }).allowAdditional()

			const result = s.build()
			expect(result['test.json'].additionalProperties).toBe(true)
		})

		it('should allow unevaluated properties for objects', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({ name: s.required.string() }).allowUnevaluated()

			const result = s.build()
			expect(result['test.json'].unevaluatedProperties).toBe(true)
		})
	})

	describe('Pattern Properties', () => {
		it('should add patternProperties to objects', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema
				.object({
					type: s.required.const('custom'),
				})
				.patternProperties({
					'^x-': s.string(),
					'^[0-9]+$': s.number(),
				})

			const result = s.build()
			expect(result['test.json'].patternProperties).toEqual({
				'^x-': { type: 'string', order: 0 },
				'^[0-9]+$': { type: 'number', order: 1 },
			})
		})
	})

	describe('Property Ordering', () => {
		it('should order properties by declaration order in strict mode with order value', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({
				firstName: s.required.string(),
				lastName: s.required.string(),
				age: s.required.number(),
			})

			const result = s.build()
			const properties = result['test.json'].properties
			expect(properties?.firstName.order).toBe(0)
			expect(properties?.lastName.order).toBe(1)
			expect(properties?.age.order).toBe(2)
		})

		it('should order properties by declaration order in loose mode without order value', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema
				.object({
					firstName: s.required.string(),
					lastName: s.required.string(),
					age: s.required.number(),
				})
				.order('loose')

			// TODO fix this tests, TODO this should work the same for array/tuples
			// The order property just shouldn't be there on loose mode, the order or properties/items should remain
			const result = s.build()
			const properties = result['test.json'].properties
			expect(properties?.firstName.order).toBeUndefined()
			expect(properties?.lastName.order).toBeUndefined()
			expect(properties?.age.order).toBeUndefined()
		})

		it('should maintain property order when building', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({
				z: s.required.string(),
				a: s.required.string(),
				m: s.required.string(),
			})

			const result = s.build()
			const keys = Object.keys(result['test.json'].properties ?? {})
			expect(keys).toEqual(['z', 'a', 'm'])
		})
	})
})
