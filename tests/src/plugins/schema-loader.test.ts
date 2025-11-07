/* eslint-disable @typescript-eslint/no-explicit-any */

import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { VFile } from 'vfile'
import { assert, describe, test, vi } from 'vitest'

import pluginUnderTest, { getSchemaData, pluginName } from '../../../src/plugins/schema-loader.mts'
import { odrSettings, type OdrSettingsDefinition } from '../../../src/settings.mts'
import { md, unPad } from '../../helpers/un-pad.mts'
import fsMock from '../../mocks/fs.mts'

import type { Settings } from 'unified'

vi.mock('node:fs/promises', () => {
	return {
		readFile: () => import('../../mocks/fs.mts').then(fs => fs.default.readFile()),
	}
})

describe(pluginName, () => {
	const testSettings: Settings & Record<string, any> = {
		trace: true,
	}
	const loadProcessor = (settings?: OdrSettingsDefinition) => {
		return remark().use({
			settings: {
				...testSettings,
				odr: odrSettings(settings ?? {}),
			} as Settings,
			plugins: [
				remarkParse,
				// TODO add functionality to check for yaml section
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
		assert.equal(file.messages[0].message, 'meta-data/odr:schema schema url protocol only allows: https, or file.')
		// It should mark the yaml value
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
				offset: 22,
			},
		})
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
		assert.equal(file.messages[0].message.trim(), unPad(`
			Map keys must be unique at line 2, column 1:

			odr:schema: 'file://./any.json'
			odr:schema: 'file://./any.json'
			^
		`))
		// It should mark the yaml value
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 3,
				offset: 0,
			},
			end: {
				column: 2,
				line: 3,
				offset: 0,
			},
		})
	})

	test('schema not found', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-not-found.md',
			value: md(`
				---
				odr:schema: 'file://./non-existent.json'
				---

				# Schema not found

				This file has an invalid odr:schema in the remark data
			`),
		})

		fsMock.readFile = () => Promise.reject(new Error('File not found'))

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.equal(file.messages[0].message.trim(), 'File not found')
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
				offset: 48,
			},
		})
	})

	test('schema not json', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-not-json.md',
			value: md(`
				---
				odr:schema: 'file://./non-json.txt'
				---

				# Schema not json

				This file has an invalid odr:schema in the remark data
			`),
		})

		fsMock.readFile = () => Promise.resolve(Buffer.from(`This isn't even JSON`))

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.equal(file.messages[0].message.trim(), `Unexpected token 'T'`)
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
				offset: 43,
			},
		})
	})

	test('schema invalid', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-invalid.md',
			value: md(`
				---
				odr:schema: 'file://./invalid.json'
				---

				# Schema invalid

				This file has an invalid odr:schema in the remark data
			`),
		})

		const schema = {
			['additionalProperties']: 'non compliant',
		}
		fsMock.readFile = () => Promise.resolve(Buffer.from(JSON.stringify(schema)))

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.equal(file.messages[0].message.trim(), `Failed to load schema`)
		assert.equal(file.messages[0].cause?.toString(), `schema is invalid: data/additionalProperties must be object,boolean`)
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
				offset: 43,
			},
		})
	})

	test('schema valid', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/schema-valid.md',
			value: md(`
				---
				odr:schema: 'file://./valid.json'
				---

				# Schema valid

				This file has a valid odr:schema in the remark data
			`),
		})

		const schema = {
			['$id']: 'https://validexample.com/valid.json',
			['additionalProperties']: false,
		}
		fsMock.readFile = () => Promise.resolve(Buffer.from(JSON.stringify(schema)))

		// ACT
		const sut = loadProcessor()
		const file = await sut.process(document)

		// ASSERT
		assert.isEmpty(file.messages)
		assert.isNotNull(getSchemaData(file)?.validator)
	})

	test('schema not in allow list', async () => {
		// ARRANGE
		const settings: OdrSettingsDefinition = {
			allowedSchemas: [
				'file://./valid.json',
			],
		}
		const document = new VFile({
			path: 'doc/odr/test/schema-valid-not-allowed.md',
			value: md(`
				---
				odr:schema: 'file://./valid-not-allowed.json'
				---

				# Schema valid

				This file has a valid odr:schema in the remark data
			`),
		})

		// const schema = {
		// 	['$id']: 'https://validexample.com/valid.json',
		// 	['additionalProperties']: false,
		// }
		// fsMock.readFile = () => Promise.resolve(Buffer.from(JSON.stringify(schema)))

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.equal(
			file.messages[0].message.trim(),
			`Schema "file://./valid-not-allowed.json" is not allowed. Allowed: file://./valid.json`,
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
				offset: 53,
			},
		})
	})

	test('schema in allow list', async () => {
		// ARRANGE
		const settings: OdrSettingsDefinition = {
			allowedSchemas: [
				'file://./valid.json',
			],
		}
		const document = new VFile({
			path: 'doc/odr/test/schema-valid-not-allowed.md',
			value: md(`
				---
				odr:schema: 'file://./valid.json'
				---

				# Schema valid

				This file has a valid odr:schema in the remark data
			`),
		})

		const schema = {
			['$id']: 'https://validexample.com/valid.json',
			['additionalProperties']: false,
		}
		fsMock.readFile = () => Promise.resolve(Buffer.from(JSON.stringify(schema)))

		// ACT
		const sut = loadProcessor(settings)
		const file = await sut.process(document)

		// ASSERT
		assert.isEmpty(file.messages)
		assert.isNotNull(getSchemaData(file)?.validator)
	})
})
