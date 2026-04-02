import { assert, describe, test } from 'vitest'

import {
	getNodeText,
	asArray,
	isWhitespaceText,
	isLinkNode,
	getHeadingNode,
	hasLinkOnlyHeading,
	hasNonEmptyBody,
	splitTaggedLines,
	isUrlLike,
} from '../src/helpers.mts'

import type { Node } from 'unist'

function n(type: string, properties?: Record<string, unknown>): Node {
	return { type, ...properties } as Node
}

describe('helpers', () => {
	describe('getNodeText', () => {
		test('returns empty for null', () => {
			assert.equal(getNodeText(null), '')
		})

		test('returns value for text node', () => {
			assert.equal(getNodeText(n('text', { value: 'hello' })), 'hello')
		})

		test('recursively extracts from children', () => {
			const node = n('paragraph', {
				children: [
					n('text', { value: 'hello ' }),
					n('strong', {
						children: [n('text', { value: 'world' })],
					}),
				],
			})
			assert.equal(getNodeText(node), 'hello world')
		})

		test('returns empty for node without value or children', () => {
			assert.equal(getNodeText(n('thematicBreak')), '')
		})
	})

	describe('asArray', () => {
		test('returns array as-is', () => {
			const array = [1, 2, 3]
			assert.strictEqual(asArray(array), array)
		})

		test('returns empty array for null', () => {
			assert.deepEqual(asArray(null), [])
		})

		test('returns empty array for undefined', () => {
			assert.deepEqual(asArray(), [])
		})
	})

	describe('isWhitespaceText', () => {
		test('true for whitespace-only text', () => {
			assert.isTrue(isWhitespaceText(n('text', { value: '  \t\n ' })))
		})

		test('false for non-empty text', () => {
			assert.isFalse(isWhitespaceText(n('text', { value: 'hello' })))
		})

		test('false for non-text node', () => {
			assert.isFalse(isWhitespaceText(n('paragraph', { value: '  ' })))
		})
	})

	describe('isLinkNode', () => {
		test('true for link', () => {
			assert.isTrue(isLinkNode(n('link')))
		})

		test('true for linkReference', () => {
			assert.isTrue(isLinkNode(n('linkReference')))
		})

		test('false for other types', () => {
			assert.isFalse(isLinkNode(n('text')))
		})
	})

	describe('getHeadingNode', () => {
		test('finds heading child', () => {
			const heading = n('heading', { depth: 2 })
			const section = n('section', { children: [heading, n('paragraph')] })
			assert.strictEqual(getHeadingNode(section), heading)
		})

		test('returns undefined if no heading', () => {
			const section = n('section', { children: [n('paragraph')] })
			assert.isUndefined(getHeadingNode(section))
		})

		test('returns undefined if no children', () => {
			assert.isUndefined(getHeadingNode(n('section')))
		})
	})

	describe('hasLinkOnlyHeading', () => {
		test('true when heading has single link child', () => {
			const section = n('section', {
				children: [
					n('heading', { depth: 3, children: [n('link', { url: '#' })] }),
				],
			})
			assert.isTrue(hasLinkOnlyHeading(section, 3))
		})

		test('false when heading level does not match', () => {
			const section = n('section', {
				children: [
					n('heading', { depth: 2, children: [n('link', { url: '#' })] }),
				],
			})
			assert.isFalse(hasLinkOnlyHeading(section, 3))
		})

		test('false when heading has non-link children', () => {
			const section = n('section', {
				children: [
					n('heading', { depth: 3, children: [n('text', { value: 'Title' })] }),
				],
			})
			assert.isFalse(hasLinkOnlyHeading(section, 3))
		})

		test('ignores whitespace text children', () => {
			const section = n('section', {
				children: [
					n('heading', {
						depth: 3,
						children: [n('text', { value: ' ' }), n('link', { url: '#' })],
					}),
				],
			})
			assert.isTrue(hasLinkOnlyHeading(section, 3))
		})
	})

	describe('hasNonEmptyBody', () => {
		test('true when section has paragraph content', () => {
			const section = n('section', {
				children: [
					n('heading', { depth: 2 }),
					n('paragraph', { children: [n('text', { value: 'body text' })] }),
				],
			})
			assert.isTrue(hasNonEmptyBody(section))
		})

		test('true when section has blockquote', () => {
			const section = n('section', {
				children: [
					n('heading', { depth: 2 }),
					n('blockquote'),
				],
			})
			assert.isTrue(hasNonEmptyBody(section))
		})

		test('false when only heading', () => {
			const section = n('section', {
				children: [n('heading', { depth: 2 })],
			})
			assert.isFalse(hasNonEmptyBody(section))
		})

		test('false when no children', () => {
			assert.isFalse(hasNonEmptyBody(n('section')))
		})
	})

	describe('splitTaggedLines', () => {
		test('splits and trims lines', () => {
			const result = splitTaggedLines('  `pro` Good  \n  `con` Bad  ')
			assert.deepEqual(result, ['`pro` Good', '`con` Bad'])
		})

		test('filters empty lines', () => {
			const result = splitTaggedLines('a\n\n\nb')
			assert.deepEqual(result, ['a', 'b'])
		})
	})

	describe('isUrlLike', () => {
		test('matches http URLs', () => {
			assert.isTrue(isUrlLike('https://example.com'))
			assert.isTrue(isUrlLike('http://example.com'))
		})

		test('matches relative paths', () => {
			assert.isTrue(isUrlLike('./file.md'))
			assert.isTrue(isUrlLike('../file.md'))
			assert.isTrue(isUrlLike('/file.md'))
		})

		test('rejects non-URL strings', () => {
			assert.isFalse(isUrlLike('just text'))
			assert.isFalse(isUrlLike(''))
		})
	})
})
