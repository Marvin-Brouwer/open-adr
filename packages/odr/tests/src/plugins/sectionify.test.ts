import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, it, expect } from 'vitest'

import sectionify from '../../../src/plugins/sectionify.mts'

import type { SectionNode } from '../../../src/nodes/nodes.mts'
import type { Parent } from 'unist'

describe('sectionify', () => {
	it('should wrap flat markdown with headings into sections', () => {
		const markdown = `# Heading 1
Some content

## Heading 2
More content

# Heading 3
Final content`

		const processor = unified()
			.use(remarkParse)
			.use({ plugins: [sectionify] })

		const tree = processor.parse(markdown) as Parent
		processor.runSync(tree)

		// Root should have 2 top-level sections
		expect(tree.children).toHaveLength(2)

		const section1 = tree.children[0] as SectionNode
		expect(section1.type).toBe('section')
		expect(section1.depth).toBe(1)
		expect(section1.name).toBe('Heading 1')
		expect(section1.children).toHaveLength(3) // h1 + paragraph + nested section

		const nestedSection = section1.children[2] as SectionNode
		expect(nestedSection.type).toBe('section')
		expect(nestedSection.depth).toBe(2)
		expect(nestedSection.name).toBe('Heading 2')

		const section2 = tree.children[1] as SectionNode
		expect(section2.type).toBe('section')
		expect(section2.depth).toBe(1)
		expect(section2.name).toBe('Heading 3')
	})

	it('should handle nested headings correctly', () => {
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
			.use({ plugins: [sectionify] })

		const tree = processor.parse(markdown) as Parent
		processor.runSync(tree)

		const mainSection = tree.children[0] as SectionNode
		expect(mainSection.children.filter(n => (n).type === 'section')).toHaveLength(2)
	})

	it('should handle markdown with content before first heading', () => {
		const markdown = `Some preamble

# First Heading
Content`

		const processor = unified()
			.use(remarkParse)
			.use({ plugins: [sectionify] })

		const tree = processor.parse(markdown) as Parent
		processor.runSync(tree)

		// First element should be paragraph (preamble)
		expect(tree.children[0].type).toBe('paragraph')
		// Second element should be section
		expect(tree.children[1].type).toBe('section')
	})

	it('should handle multiple root level sections', () => {
		const markdown = `# Section A
Content A

# Section B
Content B

# Section C
Content C`

		const processor = unified()
			.use(remarkParse)
			.use({ plugins: [sectionify] })

		const tree = processor.parse(markdown) as Parent
		processor.runSync(tree)

		expect(tree.children).toHaveLength(3)
		for (const [index, child] of tree.children.entries()) {
			expect((child as SectionNode).type).toBe('section')
			expect((child as SectionNode).name).toBe(`Section ${String.fromCodePoint(65 + index)}`)
		}
	})
})
