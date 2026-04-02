import fs from 'node:fs/promises'
import path from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { jsonSchema } from '../../gen/json-schema-builder.mts'

describe('JSON Schema Builder - File Operations', () => {
	const testOutputDirectory = './test-output/schemas'

	beforeEach(async () => {
		// Clean up test directory before each test
		await fs.rm(testOutputDirectory, { recursive: true, force: true })
	})

	afterEach(async () => {
		// Clean up after tests
		await fs.rm(testOutputDirectory, { recursive: true, force: true })
	})

	describe('Writing Files', () => {
		it('should write schemas to files', async () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('user.json')

			schema.object({
				name: s.required.string(),
			})

			await s.write()

			const fileContent = await fs.readFile(path.join(testOutputDirectory, 'user.json'), 'utf8')
			const written = JSON.parse(fileContent) as object

			expect(written).toEqual({
				type: 'object',
				properties: {
					name: { type: 'string', order: 0 },
				},
				required: ['name'],
				additionalProperties: false,
				unevaluatedProperties: false,
			})
		})

		it('should erase output directory by default', async () => {
			// Create a file that should be deleted
			await fs.mkdir(testOutputDirectory, { recursive: true })
			await fs.writeFile(path.join(testOutputDirectory, 'old.json'), '{}')

			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('new.json')
			schema.object({ name: s.required.string() })

			await s.write()

			// old.json should be deleted
			await expect(fs.access(path.join(testOutputDirectory, 'old.json'))).rejects.toThrow()
			// new.json should exist
			await expect(fs.access(path.join(testOutputDirectory, 'new.json'))).resolves.toBeUndefined()
		})

		it('should not erase output directory when disabled', async () => {
			// Create a file that should be preserved
			await fs.mkdir(testOutputDirectory, { recursive: true })
			await fs.writeFile(path.join(testOutputDirectory, 'old.json'), '{}')

			const s = jsonSchema({
				outputDirectory: testOutputDirectory,
				eraseOutputDirectory: false,
			})
			const schema = s.schema('new.json')
			schema.object({ name: s.required.string() })

			await s.write()

			// old.json should still exist
			await expect(fs.access(path.join(testOutputDirectory, 'old.json'))).resolves.toBeUndefined()
			// new.json should also exist
			await expect(fs.access(path.join(testOutputDirectory, 'new.json'))).resolves.toBeUndefined()
		})

		it('should create nested directories automatically', async () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('deeply/nested/path/schema.json')

			schema.object({ name: s.required.string() })

			await s.write()

			const filePath = path.join(testOutputDirectory, 'deeply/nested/path/schema.json')
			await expect(fs.access(filePath)).resolves.toBeUndefined()
		})

		it('should format JSON with tabs and newline', async () => {
			const s = jsonSchema({ outputDirectory: testOutputDirectory })
			const schema = s.schema('test.json')

			schema.object({ name: s.required.string() })

			await s.write()

			const fileContent = await fs.readFile(path.join(testOutputDirectory, 'test.json'), 'utf8')

			// Check for tab indentation
			expect(fileContent).toContain('\t')
			// Check for trailing newline
			expect(fileContent.endsWith('\n')).toBe(true)
		})
	})
})
