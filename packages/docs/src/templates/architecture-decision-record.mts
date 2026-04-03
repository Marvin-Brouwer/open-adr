import { template, schema, md, getNodeText } from '@md-schema/builder'

import { alternativeList } from '../components/alternative-list.mts'
import { driversList } from '../components/drivers-list.mts'
import { prosAndCons } from '../components/pros-cons.mts'
import { referenceList } from '../components/reference-list.mjs'

import type { Node } from 'unist'

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
		driversList,
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
		alternativeList,
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
		prosAndCons,
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
		referenceList,
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

export default template({
	children: [
		// If this is not there, this whole template is never loaded
		md.frontmatter({ optional: false }),
		mainSection,
	],
})
