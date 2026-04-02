import {
	template,
	schema,
	md,
	getNodeText,
	hasLinkOnlyHeading,
	hasNonEmptyBody,
	isUrlLike,
} from '@md-schema/builder'

import { isNamedReference, isObjectReference, hasBlockquoteAndDismissal } from './helpers.mts'

import type { Node } from 'unist'

// -- Reusable validator factories --

function getTaggedLines(node: Node): Array<'pro' | 'con'> {
	const children = 'children' in node && Array.isArray(node.children)
		? node.children as Node[]
		: []
	return children
		.filter(child => child.type === 'inlineCode' && 'value' in child)
		.map(child => (child as Node & { value: string }).value)
		.filter((value): value is 'pro' | 'con' => value === 'pro' || value === 'con')
}

const prosConsParagraph = () =>
	md.paragraph({
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

const driverEntry = () =>
	schema.section({
		level: 4,
		optional: true,
		match(node) {
			if (!hasLinkOnlyHeading(node, 4)) {
				return {
					severity: 'error',
					message: 'Driver entries must be h4 sections with a heading that is a link only',
				}
			}

			if (!hasNonEmptyBody(node)) {
				return {
					severity: 'error',
					message: 'Driver entries may not be empty',
				}
			}
		},
		children: [
			md.heading(4),
			md.paragraph({ optional: true }),
		],
	})

const alternativeEntry = () =>
	schema.section({
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

const referencesList = () =>
	md.list({
		required: true,
		match(node) {
			const children = 'children' in node && Array.isArray(node.children)
				? node.children as Node[]
				: []
			const items = children.filter(child => child.type === 'listItem')
			if (items.length === 0) {
				return { severity: 'error', message: 'References must contain at least one list item' }
			}

			for (const item of items) {
				const value = getNodeText(item).trim()
				if (!value) {
					return { severity: 'error', message: 'Reference list items may not be empty' }
				}

				if (isUrlLike(value)) continue
				if (isNamedReference(value)) continue
				if (isObjectReference(value)) continue

				return {
					severity: 'error',
					message:
						'Reference entries must be one of: URL only, "label: URL", or object style with name/url(/notes)',
				}
			}
		},
	})

// -- Named section partials --

const driversSection = schema.section({
	name: 'Drivers',
	level: 3,
	optional: true,
	match(node) {
		const children = 'children' in node && Array.isArray(node.children)
			? node.children as Node[]
			: []
		const sections = children.filter(child => child.type === 'section')
		if (sections.length === 0) {
			return { severity: 'error', message: 'Drivers section is optional, but may not be empty if present' }
		}
	},
	children: [
		md.heading(3),
		schema.oneOrMore(driverEntry()),
	],
})

const alternativesSection = schema.section({
	name: 'Alternatives',
	level: 3,
	optional: true,
	match(node) {
		const children = 'children' in node && Array.isArray(node.children)
			? node.children as Node[]
			: []
		const sections = children.filter(child => child.type === 'section')
		if (sections.length === 0) {
			return { severity: 'error', message: 'Alternatives section is optional, but may not be empty if present' }
		}
	},
	children: [
		md.heading(3),
		schema.oneOrMore(alternativeEntry()),
	],
})

const decisionSection = schema.section({
	name: 'Decision',
	level: 2,
	required: true,
	children: schema.strictOrder(
		md.heading(2),
		md.paragraph({ required: true }),
		driversSection,
		alternativesSection,
	),
})

const prosAndConsSection = schema.section({
	name: 'Pros and cons',
	level: 3,
	optional: true,
	children: [
		md.heading(3),
		schema.oneOrMore(prosConsParagraph()),
	],
})

const outcomeSection = schema.section({
	name: 'Outcome',
	level: 2,
	optional: true,
	children: schema.strictOrder(
		md.heading(2),
		md.paragraph({ required: true }),
		prosAndConsSection,
	),
})

const referencesSection = schema.section({
	name: 'References:',
	level: 2,
	optional: true,
	children: schema.strictOrder(
		md.heading(2),
		referencesList(),
	),
})

const mainSection = schema.section({
	level: 1,
	required: true,
	children: schema.strictOrder(
		md.heading(1, {
			required: true,
			match(node) {
				const text = getNodeText(node).trim()
				if (!text.startsWith('`ADR`') && !text.startsWith('ADR')) {
					return { severity: 'error', message: 'Heading must start with ADR (for example: # `ADR` Title)' }
				}
			},
		}),
		md.blockquote({ optional: true }),
		md.codeBlock({ optional: true, language: 'yml' }),
		md.paragraph({ minOccurrences: 1, maxOccurrences: 5 }),
		decisionSection,
		outcomeSection,
		referencesSection,
	),
})

// -- Template export --

export const architectureDecisionRecord = template({
	children: [
		// If this is not there, this whole template is never loaded
		md.frontmatter({ optional: false }),
		mainSection,
	],
})

export default architectureDecisionRecord
