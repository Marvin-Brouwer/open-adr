import { schema, md, hasLinkOnlyHeading } from '@md-schema/builder'

import { hasBlockquoteAndDismissal } from '../helpers.mts'

const alternativeEntry = schema.section({
	level: 4,
	optional: true,
	match(node) {
		if (!hasLinkOnlyHeading(node, 4)) {
			return {
				severity: 'error',
				message: 'Alternative entries must be h4 sections with a heading that is a link only',
			}
		}

		if (!hasBlockquoteAndDismissal(node)) {
			return {
				severity: 'error',
				message: 'Alternatives must contain a blockquote explanation and a dismissal paragraph',
			}
		}
	},
	children: [
		md.heading(4),
		md.blockquote({ optional: true }),
		md.paragraph({ optional: true }),
	],
})

export const alternativeList = schema.oneOrMore(alternativeEntry)
