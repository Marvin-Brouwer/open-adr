import { assert, describe, test } from 'vitest'

import { DescriptorKind } from '../src/descriptor.mts'
import { md } from '../src/md.mts'

describe('md factories', () => {
	describe('heading', () => {
		test('creates heading descriptor with level', () => {
			const h = md.heading(2)
			assert.equal(h[DescriptorKind], 'heading')
			assert.equal(h.level, 2)
		})

		test('passes through options', () => {
			const h = md.heading(1, { required: true })
			assert.equal(h[DescriptorKind], 'heading')
			assert.equal(h.level, 1)
			assert.equal(h.required, true)
		})

		test('passes through match function', () => {
			const matchFunction = () => {}
			const h = md.heading(3, { match: matchFunction })
			assert.equal(h.match, matchFunction)
		})
	})

	describe('paragraph', () => {
		test('creates paragraph descriptor', () => {
			const p = md.paragraph()
			assert.equal(p[DescriptorKind], 'paragraph')
		})

		test('supports occurrence range', () => {
			const p = md.paragraph({ minOccurrences: 1, maxOccurrences: 5 })
			assert.equal(p.minOccurrences, 1)
			assert.equal(p.maxOccurrences, 5)
		})

		test('supports optional', () => {
			const p = md.paragraph({ optional: true })
			assert.equal(p.optional, true)
		})
	})

	describe('blockquote', () => {
		test('creates blockquote descriptor', () => {
			const bq = md.blockquote()
			assert.equal(bq[DescriptorKind], 'blockquote')
		})

		test('supports required', () => {
			const bq = md.blockquote({ required: true })
			assert.equal(bq.required, true)
		})
	})

	describe('codeBlock', () => {
		test('creates codeBlock descriptor', () => {
			const callback = md.codeBlock()
			assert.equal(callback[DescriptorKind], 'codeBlock')
		})

		test('supports language filter', () => {
			const callback = md.codeBlock({ language: 'yml' })
			assert.equal(callback.language, 'yml')
		})
	})

	describe('list', () => {
		test('creates list descriptor', () => {
			const l = md.list()
			assert.equal(l[DescriptorKind], 'list')
		})

		test('supports ordered filter', () => {
			const l = md.list({ ordered: true })
			assert.equal(l.ordered, true)
		})

		test('supports unordered filter', () => {
			const l = md.list({ ordered: false })
			assert.equal(l.ordered, false)
		})

		test('supports minItems', () => {
			const l = md.list({ minItems: 2 })
			assert.equal(l.minItems, 2)
		})

		test('supports maxItems', () => {
			const l = md.list({ maxItems: 10 })
			assert.equal(l.maxItems, 10)
		})

		test('supports minItems and maxItems together', () => {
			const l = md.list({ minItems: 1, maxItems: 5 })
			assert.equal(l.minItems, 1)
			assert.equal(l.maxItems, 5)
		})
	})

	describe('table', () => {
		test('creates table descriptor', () => {
			const t = md.table()
			assert.equal(t[DescriptorKind], 'table')
		})

		test('supports required', () => {
			const t = md.table({ required: true })
			assert.equal(t.required, true)
		})

		test('supports optional', () => {
			const t = md.table({ optional: true })
			assert.equal(t.optional, true)
		})
	})

	describe('thematicBreak', () => {
		test('creates thematicBreak descriptor', () => {
			const tb = md.thematicBreak()
			assert.equal(tb[DescriptorKind], 'thematicBreak')
		})

		test('supports optional', () => {
			const tb = md.thematicBreak({ optional: true })
			assert.equal(tb.optional, true)
		})
	})

	describe('frontmatter', () => {
		test('creates frontmatter descriptor', () => {
			const fm = md.frontmatter()
			assert.equal(fm[DescriptorKind], 'frontmatter')
		})

		test('supports optional', () => {
			const fm = md.frontmatter({ optional: true })
			assert.equal(fm.optional, true)
		})
	})
})
