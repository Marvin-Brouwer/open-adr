import { md, schema, getNodeChildren } from '@md-schema/builder'

import type { Node } from 'unist'

function getTaggedLines(node: Node): Array<'pro' | 'con'> {
	return getNodeChildren(node, 'inlineCode')
		.map(child => (child as Node & { value: string }).value)
		.filter((value): value is 'pro' | 'con' => value === 'pro' || value === 'con')
}

export const prosConsParagraph = md.paragraph({
	required: true,
	match(node) {
		const tags = getTaggedLines(node)
		if (tags.length === 0) return schema.error(
			'Pros and cons paragraph must contain `pro` or `con` entries',
		)

		const firstConIndex = tags.indexOf('con')
		for (const [index, tag] of tags.entries()) {
			if (firstConIndex !== -1 && tag === 'pro' && index > firstConIndex) {
				return schema.error('Pros must come before cons in the pros and cons paragraph')
			}
		}
	},
})

export const prosAndCons = schema.oneOrMore(prosConsParagraph)
