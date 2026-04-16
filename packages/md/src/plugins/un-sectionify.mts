import { definePlugin } from '@md-schema/remark-plugin'

import type { Node, Parent } from 'unist'

export const pluginName = 'remark-plugin:unsectionify'

interface SectionNode extends Parent {
	type: 'section'
	children: Node[]
}

function isSection(node: Node): node is SectionNode {
	return node.type === 'section'
}

function flattenSections(children: Node[]): Node[] {
	const result: Node[] = []

	for (const node of children) {
		if (isSection(node)) {
			// Recursively flatten section children
			result.push(...flattenSections(node.children))
		}
		else {
			result.push(node)
		}
	}

	return result
}

export default definePlugin({
	pluginName,
	transform(context) {
		const root = context.root
		root.children = flattenSections(root.children)
	},
})
