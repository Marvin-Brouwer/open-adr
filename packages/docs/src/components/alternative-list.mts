import { schema, md, hasLinkOnlyHeading } from '@md-schema/builder'

import { hasBlockquoteAndDismissal } from '../helpers.mts'

const alternativeEntry = schema.section({
	level: 4,
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
		md.blockquote({ match: md.match.range(0, 1) }),
		md.paragraph({ match: md.match.range(0, 1) }),
	],
})

export const alternativeList = schema.oneOrMore(alternativeEntry)
