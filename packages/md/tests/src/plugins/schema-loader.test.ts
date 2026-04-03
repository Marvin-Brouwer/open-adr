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

				This file has no odr:schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, `meta-data must have required property 'odr:schema'`)
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
				odr:schema: ''
				---

				# Empty schema

				This file has an invalid odr:schema in the remark data
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
				odr:schema: 'file://./any.json'
				odr:schema: 'file://./any.json'
				---

				# Double schema

				This file has an invalid odr:schema in the remark data
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
				odr:schema: 'my-schema'
				---

				# No version

				This file has a schema identifier without a version
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.include(file.messages[0].message, 'must include a version')
	})

	test('schema unknown alias', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/unknown-alias.md',
			value: md(`
				---
				odr:schema: 'my-schema@1'
				---

				# Unknown alias

				This file has a schema identifier not in the schemas map
			`),
		})

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.include(file.messages[0].message, 'Unknown schema')
	})

	test('schema module not found', async () => {
		// ARRANGE
		const settings: MdSettingsDefinition = {
			schemas: {
				'bad-schema@1': 'npm://@non-existent-package/schema',
			},
		}
		const document = new VFile({
			path: 'doc/odr/test/schema-not-found.md',
			value: md(`
				---
				odr:schema: 'bad-schema@1'
				---

				# Schema not found

				This file references a non-existent module
			`),
		})

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
	})

	test('schema file:// not found', async () => {
		// ARRANGE
		const settings: MdSettingsDefinition = {
			schemas: {
				'missing-file@1': 'file://./does-not-exist.mts',
			},
		}
		const document = new VFile({
			path: 'doc/odr/test/file-not-found.md',
			value: md(`
				---
				odr:schema: 'missing-file@1'
				---

				# File not found

				This file references a non-existent file
			`),
		})

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
		assert.include(file.messages[0].message, 'Schema file not found')
	})

	test('schema npm:// not found', async () => {
		// ARRANGE
		const settings: MdSettingsDefinition = {
			schemas: {
				'remote-schema@1': 'npm://@non-existent-package/schema',
			},
		}
		const document = new VFile({
			path: 'doc/odr/test/npm-not-found.md',
			value: md(`
				---
				odr:schema: 'remote-schema@1'
				---

				# npm package not found

				This file references a non-existent npm package
			`),
		})

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
	})

	test('schema file:// invalid module', async () => {
		// ARRANGE
		const invalidModulePath = path.resolve(__dirname, '../../fixtures/invalid-module.mts')
		const settings: MdSettingsDefinition = {
			schemas: {
				'invalid-module@1': `file://${invalidModulePath}`,
			},
		}
		const document = new VFile({
			path: 'doc/odr/test/invalid-module.md',
			value: md(`
				---
				odr:schema: 'invalid-module@1'
				---

				# Invalid module

				This file references a module that is not a valid SchemaTemplate
			`),
		})

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.isNotEmpty(file.messages)
		assert.isTrue(file.messages[0].fatal)
		assert.include(file.messages[0].message, 'does not export a valid SchemaTemplate')
	})

	test('schema not in allow list', async () => {
		// ARRANGE
		const settings: MdSettingsDefinition = {
			schemas: {
				'different-schema@1': '@my-org/different-schema',
			},
			allowedSchemas: [
				'my-schema@1',
			],
		}
		const document = new VFile({
			path: 'doc/odr/test/schema-valid-not-allowed.md',
			value: md(`
				---
				odr:schema: 'different-schema@1'
				---

				# Schema valid

				This file has a valid odr:schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.equal(
			file.messages[0].message.trim(),
			`Schema "different-schema@1" is not allowed. Allowed: my-schema@1`,
		)
		// It should mark the odr:schema line specifically
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 2,
				offset: 4,
			},
			end: {
				column: 33,
				line: 2,
				offset: 36,
			},
		})
	})

	test('schema valid template module', async () => {
		// ARRANGE
		const settings: MdSettingsDefinition = {
			schemas: {
				'mock-template@1': `file://${mockTemplatePath}`,
			},
		}
		const document = new VFile({
			path: 'doc/odr/test/schema-valid.md',
			value: md(`
				---
				odr:schema: 'mock-template@1'
				---

				# Schema valid

				This file has a valid odr:schema in the remark data
			`),
		})

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.isEmpty(file.messages)
		assert.isNotNull(getSchemaData(file)?.template)
	})
})
