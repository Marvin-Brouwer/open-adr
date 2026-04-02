import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, it, expect } from 'vitest'

import sectionify from '../../../src/plugins/sectionify.mts'
import unsectionify from '../../../src/plugins/unsectionify.mts'

import type { Node, Parent } from 'unist'

function isType(node: Node, type: string) {
	return node.type === type
}

function hasChildren(node: Node): node is Node & { children: unknown[] } {
	return 'children' in node && Array.isArray((node as { children?: unknown }).children)
}

function getFirstChildText(node: Node) {
	if (!hasChildren(node) || node.children.length === 0) return

	const first = node.children[0]
	if (typeof first !== 'object' || first === null || !('value' in first)) return

	const value = (first as { value: unknown }).value
	if (typeof value !== 'string') return

	return value
}

describe('unsectionify', () => {
	it('should flatten sections back to flat markdown', () => {
		const markdown = `# Heading 1
Some content

## Heading 2
More content

# Heading 3
Final content`

		const processor = unified()
			.use(remarkParse)
			.use({ plugins: [sectionify, unsectionify] })

		const tree = processor.parse(markdown) as Parent
		processor.runSync(tree)

		// After unsectionify, should have no section nodes
		const hasSections = tree.children.some(node => isType(node, 'section'))
		expect(hasSections).toBe(false)

		// Should still have all the original content
		const headings = tree.children.filter(node => isType(node, 'heading'))
		expect(headings).toHaveLength(3)
	})

	it('should handle nested sections', () => {
		const markdown = `# Main
Content 1

## Sub 1
Content 1.1

### Deep
Content deep

## Sub 2
Content 2`

		const processor = unified()
			.use(remarkParse)
			.use({ plugins: [sectionify, unsectionify] })

		const tree = processor.parse(markdown) as Parent
		processor.runSync(tree)

		const hasSections = tree.children.some(node => isType(node, 'section'))
		expect(hasSections).toBe(false)

		const headings = tree.children.filter(node => isType(node, 'heading'))
		expect(headings).toHaveLength(4) // Main, Sub 1, Deep, Sub 2
	})

	it('should be roundtrip reversible with sectionify', () => {
		const markdown = `# Section A
Content A

## Subsection A.1
Content A.1

# Section B
Content B`

		const processor = unified()
			.use(remarkParse)

		const originalTree = processor.parse(markdown) as Parent

		// Sectionify then unsectionify
		const processor2 = unified()
			.use(remarkParse)
			.use({ plugins: [sectionify, unsectionify] })

		const resultTree = processor2.parse(markdown) as Parent
		processor2.runSync(resultTree)

		// Compare structure
		expect(originalTree.children).toHaveLength(resultTree.children.length)

		// Both should have no section nodes
		const originalHasSections = originalTree.children.some(node => isType(node, 'section'))
		const resultHasSections = resultTree.children.some(node => isType(node, 'section'))

		expect(originalHasSections).toBe(false)
		expect(resultHasSections).toBe(false)
	})

	it('should preserve content order when flattening', () => {
		const markdown = `# H1
P1

## H2
P2

P3

# H3
P4`

		const processor = unified()
			.use(remarkParse)
			.use({ plugins: [sectionify, unsectionify] })

		const tree = processor.parse(markdown) as Parent
		processor.runSync(tree)

		// Get all text content in order
		const headings = tree.children.filter(node => isType(node, 'heading'))
		expect(headings.map(heading => getFirstChildText(heading))).toEqual(['H1', 'H2', 'H3'])

		// Paragraphs should maintain order
		const paragraphs = tree.children.filter(node => isType(node, 'paragraph'))
		expect(paragraphs.length).toBeGreaterThanOrEqual(3)
	})
})
