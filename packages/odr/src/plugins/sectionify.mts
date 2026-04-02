import { definePlugin } from '@md-schema/remark-plugin'

import type { SectionNode } from '../nodes/nodes.mts'
import type { Node } from 'unist'

export const pluginName = 'remark-plugin:sectionify'

interface HeadingNode extends Node {
	type: 'heading'
	depth: number
	children: Array<{ value?: string }>
}

function isHeading(node: Node): node is HeadingNode {
	return node.type === 'heading'
}

function extractHeadingText(heading: HeadingNode): string {
	return heading.children.map(child => child.value ?? '').join('')
}

export default definePlugin({
	pluginName,
	transform(context) {
		const root = context.root
		const newChildren: Node[] = []

		let index = 0
		while (index < root.children.length) {
			const node = root.children[index]

			if (isHeading(node)) {
				// Start a new section at this heading
				const section = buildSection(root.children, index)
				newChildren.push(section)
				index += section.children.length
			}
			else {
				// Non-heading content before any heading
				newChildren.push(node)
				index++
			}
		}

		root.children = newChildren
	},
})

function buildSection(children: Node[], startIndex: number): SectionNode {
	const node = children[startIndex]
	if (!node || !isHeading(node)) {
		throw new Error(`Expected heading at index ${startIndex}`)
	}
	const heading = node
	const headingDepth = heading.depth
	const name = extractHeadingText(heading)

	const sectionChildren: Node[] = [heading]
	let index = startIndex + 1

	// Collect content until we hit a heading of same or lower depth
	while (index < children.length) {
		const node = children[index]

		if (isHeading(node) && node.depth <= headingDepth) {
			// Stop here, this heading should be in a different section
			break
		}

		if (isHeading(node) && node.depth > headingDepth) {
			// This is a sub-heading, recursively build nested section
			const nestedSection = buildSection(children, index)
			sectionChildren.push(nestedSection)
			index += nestedSection.children.length
		}
		else {
			// Regular content node
			sectionChildren.push(node)
			index++
		}
	}

	return {
		type: 'section',
		depth: headingDepth,
		name,
		children: sectionChildren,
	}
}
