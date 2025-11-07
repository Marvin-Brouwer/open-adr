import { VFile } from 'vfile'
import { assert, describe, test, vi } from 'vitest'

import { checkFileIncluded } from '../../../src/files/file-include.mts'
import { odrSettings } from '../../../src/settings.mts'

import type { RemarkPluginContext, RemarkPluginSettings } from '../../../src/plugin.mts'

vi.mock('node:fs/promises', () => {
	return {
		readFile: () => import('../../mocks/fs.mts').then(fs => fs.default.readFile()),
	}
})

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
