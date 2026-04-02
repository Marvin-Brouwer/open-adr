/* eslint-disable @typescript-eslint/no-explicit-any */

import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { VFile } from 'vfile'
import { assert, describe, test, vi } from 'vitest'

import { mdSettings } from '../../../src/_module.mts'
import { getSchemaData } from '../../../src/helpers/schema-data.mts'
import pluginUnderTest, { pluginName } from '../../../src/plugins/schema-loader.mts'
import { type MdSettingsDefinition } from '../../../src/settings.mts'
import { md } from '../../helpers/un-pad.mts'

import type { SchemaTemplate } from '@md-schema/builder'
import type { Settings } from 'unified'

// Mock template module for file:// loading
const mockTemplate: SchemaTemplate = {
	validate: () => [],
}

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

	test('schema module not found', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-not-found.md',
			value: md(`
				---
				odr:schema: '@non-existent-package/schema'
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

	test('schema not in allow list', async () => {
		// ARRANGE
		const settings: MdSettingsDefinition = {
			allowedSchemas: [
				'@my-org/my-schema',
			],
		}
		const document = new VFile({
			path: 'doc/odr/test/schema-valid-not-allowed.md',
			value: md(`
				---
				odr:schema: '@my-org/different-schema'
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
			`Schema "@my-org/different-schema" is not allowed. Allowed: @my-org/my-schema`,
		)
		// It should mark the yaml URL value
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
				offset: 46,
			},
		})
	})

	test('schema valid template module', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-valid.md',
			value: md(`
				---
				odr:schema: '@md-schema/odr/v1/architecture-decision-record'
				---

				# Schema valid

				This file has a valid odr:schema in the remark data
			`),
		})

		// Mock the dynamic import to return a valid template
		vi.doMock('@md-schema/odr/v1/architecture-decision-record', () => ({
			default: mockTemplate,
		}))

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isEmpty(file.messages)
		assert.isNotNull(getSchemaData(file)?.template)

		vi.doUnmock('@md-schema/odr/v1/architecture-decision-record')
	})
})
