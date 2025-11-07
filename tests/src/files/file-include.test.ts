import { VFile } from 'vfile'
import { assert, describe, test } from 'vitest'

import { odrSettings } from '../../../src/_module.mts'
import { checkFileIncluded } from '../../../src/files/file-include.mts'

import type { RemarkPluginContext, RemarkPluginSettings } from '../../../src/move-later/remark-plugin/plugin.mts'

describe('checkFileIncluded', () => {
	test('not in include list', () => {
		// ARRANGE
		const file = new VFile({
			path: 'doc/odr/test/test.md',
		})

		const sut: RemarkPluginContext = {
			file,
			settings: {
				odr: odrSettings({
					include: ['docs/whatever/*.md'],
				}),
			} as Partial<RemarkPluginSettings>,
			writeTrace() {
				//
			},
		} as Partial<RemarkPluginContext> as RemarkPluginContext

		// ACT
		const result = checkFileIncluded(sut)

		// ASSERT
		assert.equal(result, false)
	})

	test('included in include list', () => {
		// ARRANGE
		const file = new VFile({
			path: 'doc/odr/test/test.md',
		})

		const sut: RemarkPluginContext = {
			file,
			settings: {
				odr: odrSettings({
					include: ['doc/odr/**/*.md'],
				}),
			} as Partial<RemarkPluginSettings>,
			writeTrace() {
				//
			},
		} as Partial<RemarkPluginContext> as RemarkPluginContext

		// ACT
		const result = checkFileIncluded(sut)

		// ASSERT
		assert.equal(result, true)
	})

	test('no include configured, allows default', () => {
		// ARRANGE
		const file = new VFile({
			path: 'doc/odr/architecture/test.md',
		})

		const sut: RemarkPluginContext = {
			file,
			settings: {
				odr: odrSettings({
					include: undefined,
				}),
			} as Partial<RemarkPluginSettings>,
			writeTrace() {
				//
			},
		} as Partial<RemarkPluginContext> as RemarkPluginContext

		// ACT
		const result = checkFileIncluded(sut)

		// ASSERT
		assert.equal(result, true)
	})

	test('empty include configured, allows anything', () => {
		// ARRANGE
		const file = new VFile({
			path: 'test.md',
		})

		const sut: RemarkPluginContext = {
			file,
			settings: {
				odr: odrSettings({
					include: [],
				}),
			} as Partial<RemarkPluginSettings>,
			writeTrace() {
				//
			},
		} as Partial<RemarkPluginContext> as RemarkPluginContext

		// ACT
		const result = checkFileIncluded(sut)

		// ASSERT
		assert.equal(result, true)
	})
})
