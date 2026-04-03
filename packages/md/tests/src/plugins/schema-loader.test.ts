/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { VFile } from 'vfile'
import { assert, describe, test } from 'vitest'

import { mdSettings } from '../../../src/_module.mts'
import { getSchemaData } from '../../../src/helpers/schema-data.mts'
import pluginUnderTest, { pluginName } from '../../../src/plugins/schema-loader.mts'
import { type MdSettingsDefinition } from '../../../src/settings.mts'
import { md } from '../../helpers/un-pad.mts'

import type { Settings } from 'unified'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mockTemplatePath = path.resolve(__dirname, '../../fixtures/mock-template.mts')

describe(pluginName, () => {
	const testSettings: Settings & Record<string, any> = {
		trace: true,
	}
	const loadProcessor = (settings?: MdSettingsDefinition) => {
		return remark().use({
			settings: {
				...testSettings,
				'md-schema': mdSettings(settings ?? {}),
			} as Settings,
			plugins: [
				remarkParse,
				remarkFrontmatter,
				pluginUnderTest,
			],
		})
	}

	test('no remark', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/no-remark.md',
			value: md(`
				# No Remark

				This file has no remark header
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, 'No frontmatter data found')
		// It should mark the entire file
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 1,
				offset: 0,
			},
			end: {
				column: 1,
				line: 4,
				offset: 44,
			},
		})
	})

	test('no yaml', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/no-yaml.md',
			value: md(`
				---
				---

				# No yaml

				This file has no yaml in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, 'No frontmatter data found')
		// It should mark the remark section
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 1,
				offset: 0,
			},
			end: {
				column: 1,
				line: 7,
				offset: 61,
			},
		})
	})

	test('no schema', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/no-schema.md',
			value: md(`
				---
				no: false
				---

				# No schema

				This file has no schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, `meta-data must have required property 'schema'`)
		// It should mark the yaml
		// But it marks the entire block for now
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 1,
				offset: 0,
			},
			end: {
				column: 4,
				line: 3,
				offset: 17,
			},
		})
	})

	test('empty schema', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/empty-schema.md',
			value: md(`
				---
				schema: ''
				---

				# Empty schema

				This file has an invalid schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		// The new loader doesn't validate protocol patterns, it just tries to import
		// An empty string will fail the import
		assert.isNotEmpty(file.messages)
	})

	test('duplicate schema', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/duplicate-schema.md',
			value: md(`
				---
				schema: 'file://./any.json'
				schema: 'file://./any.json'
				---

				# Double schema

				This file has an invalid schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
	})

	test('schema without version', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/no-version.md',
			value: md(`
				---
				schema: 'my-schema'
				---

				# No version

				This file has a schema identifier that cannot be resolved
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
	})

	test('schema module not found', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-not-found.md',
			value: md(`
				---
				schema: '@non-existent-package/schema'
				---

				# Schema not found

				This file references a non-existent module
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
	})

	test('schema file:// not found', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/file-not-found.md',
			value: md(`
				---
				schema: 'file://./does-not-exist.mts'
				---

				# File not found

				This file references a non-existent file
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
		assert.include(file.messages[0].message, 'Schema file not found')
	})

	test('schema file:// invalid module', async () => {
		// ARRANGE
		const invalidModulePath = path.resolve(__dirname, '../../fixtures/invalid-module.mts')
		const document = new VFile({
			path: 'doc/odr/test/invalid-module.md',
			value: md(`
				---
				schema: 'file://${invalidModulePath}'
				---

				# Invalid module

				This file references a module that is not a valid SchemaTemplate
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
		assert.include(file.messages[0].message, 'does not export a valid SchemaTemplate')
	})

	test('schema not in allow list', async () => {
		// ARRANGE
		const settings: MdSettingsDefinition = {
			allowedSchemas: [
				'my-schema',
			],
		}
		const document = new VFile({
			path: 'doc/odr/test/schema-valid-not-allowed.md',
			value: md(`
				---
				schema: 'different-schema'
				---

				# Schema valid

				This file has a valid schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.equal(
			file.messages[0].message.trim(),
			`Schema "different-schema" is not allowed. Allowed: my-schema`,
		)
		// It should mark the schema line specifically
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 2,
				offset: 4,
			},
			end: {
				column: 27,
				line: 2,
				offset: 30,
			},
		})
	})

	test('schema valid template module', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-valid.md',
			value: md(`
				---
				schema: 'file://${mockTemplatePath}'
				---

				# Schema valid

				This file has a valid schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isEmpty(file.messages)
		assert.isNotNull(getSchemaData(file)?.template)
	})
})
