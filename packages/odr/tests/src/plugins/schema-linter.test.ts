/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'node:path'

import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { VFile } from 'vfile'
import { assert, describe, test } from 'vitest'

import { odrSettings } from '../../../src/_module.mts'
import pluginUnderTest, { pluginName } from '../../../src/plugins/schema-linter.mts'
import { type OdrSettingsDefinition } from '../../../src/settings.mts'
import { mockSchemaPlugin } from '../../helpers/schema.mts'
import { md } from '../../helpers/un-pad.mts'

import type { Settings } from 'unified'

const singleLineSchema = path.resolve(__filename, '../../../../spec/odr/v1/definitions/single-line-string.json')

describe(pluginName, () => {
	const testSettings: Settings & Record<string, any> = {
		trace: true,
	}

	describe('basic example', () => {
		const schema = {
			$id: path.resolve(__filename, '../../../spec/odr/v1/examples/valid-example-1.json'),
			// Nobody cares about the rest of it
			additionalProperties: true,
			properties: {
				children: {
					type: 'array',
					additionalItems: false,
					items: [{
						type: 'object',
						additionalProperties: true,
						required: [
							'type',
						],
						properties: {
							type: {
								title: 'element type',
								const: 'yaml',
							},
						},
					},
					{
						type: 'object',
						additionalProperties: true,
						required: [
							'type',
							'children',
						],
						properties: {
							type: {
								title: 'element type',
								const: 'heading',
							},
							children: {
								type: 'array',
								additionalItems: false,
								items: [
									{
										type: 'object',
										required: [
											'type',
											'value',
										],
										properties: {
											type: { const: 'text' },
											value: { const: 'Example' },
										},
									},
								],
							},
						},
					},
					{
						type: 'object',
						additionalProperties: true,
						required: [
							'type',
							'children',
						],
						properties: {
							type: {
								title: 'element type',
								const: 'paragraph',
							},
							children: {
								type: 'array',
								additionalItems: false,
								items: [
									{
										type: 'object',
										required: [
											'type',
											'value',
										],
										properties: {
											type: { const: 'text' },
											value: { $ref: singleLineSchema },
										},
									},
								],
							},
						},
					}],
				},
			},
		}

		const loadProcessor = (settings?: OdrSettingsDefinition) => {
			return remark().use({
				settings: {
					...testSettings,
					odr: odrSettings(settings ?? {}),
				} as Settings,
				plugins: [
					remarkParse,
					remarkFrontmatter,
					mockSchemaPlugin(schema, singleLineSchema),
					pluginUnderTest,
				],
			})
		}

		test('valid document', async () => {
			// ARRANGE
			const validDocument = new VFile({
				path: 'doc/odr/test/basic-example-valid.md',
				value: md(`
					---
					odr:schema: 'file://./example1.json'
					---

					# Example

					This file requires at least a H1 with "Example" verbatim and a paragraph.
				`),
			})

			// ACT
			const sut = loadProcessor()
			const fileResult = await sut.process(validDocument)

			// ASSERT
			assert.isEmpty(fileResult.messages)
		})
		test('Incorrect chapter title', async () => {
			// ARRANGE
			const invalidDocument = new VFile({
				path: 'doc/odr/test/basic-example-invalid.md',
				value: md(`
					---
					odr:schema: 'file://./example1.json'
					---

					# Wrong!

					This file requires at least a H1 with "Example" verbatim and a paragraph.
				`),
			})

			// ACT
			const sut = loadProcessor()
			const fileResult = await sut.process(invalidDocument)

			// ASSERT
			assert.deepEqual(fileResult.messages[0].message, 'Expected absolute value of \'Example\', got \'Wrong!\' instead')
			assert.deepEqual(fileResult.messages[0].expected, ['Example'])
			assert.deepEqual(fileResult.messages[0].place, {
				end: {
					column: 9,
					line: 5,
					offset: 54,
				},
				start: {
					column: 3,
					line: 5,
					offset: 48,
				},
			})
		})
		// TODO figure out why newline \ and double space don't work
		// TODO make a better error message for this
		test('Additional text', async () => {
			// ARRANGE
			const invalidDocument = new VFile({
				path: 'doc/odr/test/basic-example-invalid.md',
				value: md(`
					---
					odr:schema: 'file://./example1.json'
					---

					# Example

					This file requires at least a H1 with "Example" verbatim and a paragraph. <br />
					But there's more here!
				`),
			})

			// ACT
			const sut = loadProcessor()
			const fileResult = await sut.process(invalidDocument)

			// ASSERT
			assert.deepEqual(fileResult.messages[0].message, 'You provided more elements than the schema expects, expected \'1\' elements, got \'2\' instead')
			assert.isUndefined(fileResult.messages[0].expected)
			assert.deepEqual(fileResult.messages[0].place, {
				end: {
					column: 23,
					line: 8,
					offset: 160,
				},
				start: {
					column: 1,
					line: 7,
					offset: 57,
				},
			})
		})
	})
})
