import { md, schema } from '@md-schema/builder'

import type { Node } from 'unist'

function getTaggedLines(node: Node): Array<'pro' | 'con'> {
	const children = 'children' in node && Array.isArray(node.children)
		? node.children as Node[]
		: []
	return children
		.filter(child => child.type === 'inlineCode' && 'value' in child)
		.map(child => (child as Node & { value: string }).value)
		.filter((value): value is 'pro' | 'con' => value === 'pro' || value === 'con')
}

export const prosConsParagraph = md.paragraph({
	required: true,
	match(node) {
		const tags = getTaggedLines(node)
		if (tags.length === 0) {
			return {
				severity: 'error',
				message: 'Pros and cons paragraph must contain `pro` or `con` entries',
			}
		}

		const firstConIndex = tags.indexOf('con')

		for (const [index, tag] of tags.entries()) {
			if (firstConIndex !== -1 && tag === 'pro' && index > firstConIndex) {
				return {
					severity: 'error',
					message: 'Pros must come before cons in the pros and cons paragraph',
				}
			}
		}
	},
})

export const prosAndCons = schema.oneOrMore(prosConsParagraph)
