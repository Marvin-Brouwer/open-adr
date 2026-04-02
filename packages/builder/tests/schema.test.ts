import { assert, describe, test } from 'vitest'

import { DescriptorKind } from '../src/descriptor.mts'
import { md } from '../src/md.mts'
import { schema } from '../src/schema.mts'

import type { StrictOrderDescriptor } from '../src/schema.mts'

const matchFunction = () => {}

describe('schema factories', () => {
	describe('section', () => {
		test('creates section descriptor', () => {
			const s = schema.section({
				level: 2,
				name: 'Decision',
				children: [md.paragraph()],
			})
			assert.equal(s[DescriptorKind], 'section')
			assert.equal(s.level, 2)
			assert.equal(s.name, 'Decision')
			assert.isArray(s.children)
		})

		test('section with strictOrder children', () => {
			const s = schema.section({
				level: 1,
				children: schema.strictOrder(md.heading(1), md.paragraph()),
			})
			assert.equal(s[DescriptorKind], 'section')
			const children = s.children
			assert.equal((children as StrictOrderDescriptor)[DescriptorKind], 'strictOrder')
		})

		test('passes through match and required', () => {
			const s = schema.section({
				level: 1,
				required: true,
				match: matchFunction,
				children: [],
			})
			assert.equal(s.required, true)
			assert.equal(s.match, matchFunction)
		})
	})

	describe('strictOrder', () => {
		test('creates strictOrder descriptor with variadic items', () => {
			const so = schema.strictOrder(
				md.heading(1),
				md.paragraph(),
				md.blockquote(),
			)
			assert.equal(so[DescriptorKind], 'strictOrder')
			assert.equal(so.items.length, 3)
		})

		test('empty strictOrder', () => {
			const so = schema.strictOrder()
			assert.equal(so[DescriptorKind], 'strictOrder')
			assert.equal(so.items.length, 0)
		})
	})

	describe('oneOrMore', () => {
		test('creates oneOrMore descriptor', () => {
			const oom = schema.oneOrMore(md.paragraph())
			assert.equal(oom[DescriptorKind], 'oneOrMore')
			assert.equal(oom.item[DescriptorKind], 'paragraph')
		})

		test('wraps a section descriptor', () => {
			const oom = schema.oneOrMore(
				schema.section({ level: 3, children: [] }),
			)
			assert.equal(oom[DescriptorKind], 'oneOrMore')
			assert.equal(oom.item[DescriptorKind], 'section')
		})
	})
})
