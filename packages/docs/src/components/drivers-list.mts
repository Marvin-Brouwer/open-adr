import { schema, md, hasLinkOnlyHeading, hasNonEmptyBody } from '@md-schema/builder'

const driverEntry = schema.section({
	level: 4,
	optional: true,
	match(node) {
		if (!hasLinkOnlyHeading(node, 4)) return schema.error(
			'Driver entries must be h4 sections with a heading that is a link only',
		)
		if (!hasNonEmptyBody(node)) return schema.error(
			'Driver entries may not be empty',
		)
	},
	children: [
		md.heading(4),
		md.paragraph({ optional: true }),
	],
})

export const driversList = schema.oneOrMore(driverEntry)
