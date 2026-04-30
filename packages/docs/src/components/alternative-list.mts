import { schema, md, hasLinkOnlyHeading } from '@md-schema/builder'

import { hasBlockquoteAndDismissal } from '../helpers.mts'

const alternativeEntry = schema.section({
	level: 4,
	required: false,
	match(node) {
		if (!hasLinkOnlyHeading(node, 4)) return schema.error(
			'Alternative entries must be h4 sections with a heading that is a link only',
		)
		if (!hasBlockquoteAndDismissal(node)) return schema.error(
			'Alternatives must contain a blockquote explanation and a dismissal paragraph',
		)
	},
	children: [
		md.heading(4),
		md.blockquote({ required: false }),
		md.paragraph({ required: false }),
	],
})

export const alternativeList = schema.oneOrMore(alternativeEntry)
