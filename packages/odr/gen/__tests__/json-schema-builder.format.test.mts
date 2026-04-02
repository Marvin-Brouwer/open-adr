import { describe, it, expect } from 'vitest'

import { jsonSchema } from '../../gen/json-schema-builder.mts'

describe('JSON Schema Builder - Format Validators', () => {
	const testOutputDirectory = './test-output/schemas'

	describe('URL/URI Format', () => {
		it('should create URL/URI format schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })

			expect(s.url()).toEqual({ type: 'string', format: 'uri' })
			expect(s.required.url()).toEqual({ type: 'string', format: 'uri' })
		})
	})

	describe('IRI Format', () => {
		it('should create IRI format schemas', () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })

			expect(s.iri()).toEqual({ type: 'string', format: 'iri' })
			expect(s.required.iri()).toEqual({ type: 'string', format: 'iri' })
		})
	})
})
