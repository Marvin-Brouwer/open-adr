/* eslint-disable @typescript-eslint/no-explicit-any */

import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { VFile } from 'vfile'
import { assert, describe, test } from 'vitest'

import { mdSettings } from '../../../src/_module.mts'
import pluginUnderTest, { pluginName } from '../../../src/plugins/schema-linter.mts'
import { mdSchemaKey } from '../../../src/plugins/schema-loader.mts'
import sectionify from '../../../src/plugins/sectionify.mts'
import unsectionify from '../../../src/plugins/unsectionify.mts'
import { type MdSettingsDefinition } from '../../../src/settings.mts'
import { md } from '../../helpers/un-pad.mts'

import type { SchemaTemplate, ValidationResult } from '@md-schema/builder'
import type { PluginBody } from '@md-schema/remark-plugin'
import type { Settings, Transformer } from 'unified'

function mockSchemaPlugin(template: SchemaTemplate): PluginBody {
	const plugin: Transformer = (_tree, file, next) => {
		file.data[mdSchemaKey] = {
			schemaUrl: 'test://mock-schema',
			template,
		}
		next(undefined, _tree, file)
	}
	return () => plugin
}

describe(pluginName, () => {
	const testSettings: Settings & Record<string, any> = {
		trace: true,
	}

	const loadProcessor = (template: SchemaTemplate, settings?: MdSettingsDefinition) => {
		return remark().use({
			settings: {
				...testSettings,
				'md-schema': mdSettings(settings ?? {}),
			} as Settings,
			plugins: [
				remarkParse,
				remarkFrontmatter,
				sectionify,
				mockSchemaPlugin(template),
				pluginUnderTest,
				unsectionify,
			],
		})
	}

	describe('template-based validation', () => {
		test('valid document - no validation results', async () => {
			// ARRANGE
			const template: SchemaTemplate = {
				validate: () => [],
			}
			const validDocument = new VFile({
				path: 'doc/odr/test/valid.md',
				value: md(`
					---
					schema: 'test://mock'
					---

					# Example

					This file is valid.
				`),
			})

			// ACT
			const sut = loadProcessor(template)
			const fileResult = await sut.process(validDocument)

			// ASSERT
			assert.isEmpty(fileResult.messages)
		})

		test('validation errors are mapped to appendError', async () => {
			// ARRANGE
			const errorNode = { type: 'paragraph' }
			const template: SchemaTemplate = {
				validate: () => [
					{ message: 'Missing required heading', severity: 'error', node: errorNode } as ValidationResult,
				],
			}
			const invalidDocument = new VFile({
				path: 'doc/odr/test/invalid.md',
				value: md(`
					---
					schema: 'test://mock'
					---

					# Example

					This file is invalid.
				`),
			})

			// ACT
			const sut = loadProcessor(template)
			const fileResult = await sut.process(invalidDocument)

			// ASSERT
			assert.equal(fileResult.messages.length, 1)
			assert.equal(fileResult.messages[0].message, 'Missing required heading')
			assert.isTrue(fileResult.messages[0].fatal)
		})

		test('validation warnings are mapped to appendWarn', async () => {
			// ARRANGE
			const warnNode = { type: 'paragraph' }
			const template: SchemaTemplate = {
				validate: () => [
					{ message: 'Unexpected paragraph node', severity: 'warning', node: warnNode } as ValidationResult,
				],
			}
			const document = new VFile({
				path: 'doc/odr/test/warnings.md',
				value: md(`
					---
					schema: 'test://mock'
					---

					# Example

					Some content.
				`),
			})

			// ACT
			const sut = loadProcessor(template)
			const fileResult = await sut.process(document)

			// ASSERT
			assert.equal(fileResult.messages.length, 1)
			assert.equal(fileResult.messages[0].message, 'Unexpected paragraph node')
			assert.isNotTrue(fileResult.messages[0].fatal)
		})

		test('multiple validation results', async () => {
			// ARRANGE
			const template: SchemaTemplate = {
				validate: () => [
					{ message: 'Error 1', severity: 'error' } as ValidationResult,
					{ message: 'Warning 1', severity: 'warning' } as ValidationResult,
					{ message: 'Error 2', severity: 'error' } as ValidationResult,
				],
			}
			const document = new VFile({
				path: 'doc/odr/test/multiple.md',
				value: md(`
					---
					schema: 'test://mock'
					---

					# Example

					Content.
				`),
			})

			// ACT
			const sut = loadProcessor(template)
			const fileResult = await sut.process(document)

			// ASSERT
			assert.equal(fileResult.messages.length, 3)
			assert.isTrue(fileResult.messages[0].fatal)
			assert.isNotTrue(fileResult.messages[1].fatal)
			assert.isTrue(fileResult.messages[2].fatal)
		})
	})

	describe('sectionify prerequisite', () => {
		test('throws if AST is not sectionified', async () => {
			// ARRANGE
			const template: SchemaTemplate = {
				validate: () => [],
			}
			// Use processor WITHOUT sectionify plugin
			const processor = remark().use({
				settings: {
					...testSettings,
					'md-schema': mdSettings({}),
				} as Settings,
				plugins: [
					remarkParse,
					remarkFrontmatter,
					mockSchemaPlugin(template),
					pluginUnderTest,
				],
			})
			const document = new VFile({
				path: 'doc/odr/test/no-sections.md',
				value: md(`
					---
					schema: 'test://mock'
					---

					# Example

					Content without sectionify.
				`),
			})

			// ACT
			const fileResult = await processor.process(document)

			// ASSERT
			assert.isNotEmpty(fileResult.messages)
			assert.isTrue(fileResult.messages[0].fatal)
			assert.include(fileResult.messages[0].message, 'sectionify')
		})
	})

	describe('missing schema', () => {
		test('throws if no schema data is present', async () => {
			// ARRANGE
			// Use processor WITHOUT schema loader, but WITH sectionify
			const processor = remark().use({
				settings: {
					...testSettings,
					'md-schema': mdSettings({}),
				} as Settings,
				plugins: [
					remarkParse,
					remarkFrontmatter,
					sectionify,
					pluginUnderTest,
					unsectionify,
				],
			})
			const document = new VFile({
				path: 'doc/odr/test/no-schema.md',
				value: md(`
					---
					schema: 'test://mock'
					---

					# Example

					Content without schema loaded.
				`),
			})

			// ACT
			const fileResult = await processor.process(document)

			// ASSERT
			assert.isNotEmpty(fileResult.messages)
			assert.isTrue(fileResult.messages[0].fatal)
			assert.include(fileResult.messages[0].message, 'No schema was present')
		})
	})
})
