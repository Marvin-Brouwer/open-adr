import { template, schema, md, getNodeText, getNodeChildren } from '@md-schema/builder'

import { alternativeList } from '../components/alternative-list.mts'
import { driversList } from '../components/drivers-list.mts'
import { prosAndCons } from '../components/pros-cons.mts'
import { referenceList } from '../components/reference-list.mjs'
import { guideUrl, multiline } from '../helpers.mts'

const guide = guideUrl('adr')

const driversSection = schema.section({
	name: 'Drivers',
	description: multiline(
		'What are the forces and constraints that influence the decision?',
		'',
		'List each driver separately — technological, political, social, or project-local.',
		'Call out tensions between competing forces explicitly,',
		'as these trade-offs are what justify the chosen path.',
	),
	url: guide('drivers'),
	level: 3,
	optional: true,
	match(node) {
		const sections = getNodeChildren(node, 'section')
		if (sections.length === 0) return schema.error(
			'Drivers section is optional, but may not be empty if present',
		)
	},
	children: [
		md.heading(3),
		driversList,
	],
})

const alternativesSection = schema.section({
	name: 'Alternatives',
	description: multiline(
		'What other options were considered and why were they dismissed?',
		'',
		'List every option genuinely considered, at the same level of abstraction.',
		'Include a brief description and the primary reason each was not chosen.',
		'Avoid pseudo-alternatives that exist only to be dismissed.',
	),
	url: guide('alternatives'),
	level: 3,
	optional: true,
	match(node) {
		const sections = getNodeChildren(node, 'section')
		if (sections.length === 0) return schema.error(
			'Alternatives section is optional, but may not be empty if present',
		)
	},
	children: [
		md.heading(3),
		alternativeList,
	],
})

const decisionSection = schema.section({
	name: 'Decision',
	description: multiline(
		'What is the change that we are proposing and/or doing?',
		'',
		'State the chosen response in full sentences using active voice ("We will ...").',
		'Name the chosen option, link it back to the drivers it addresses,',
		'and provide an explicit justification.',
	),
	url: guide('decision'),
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
	description: multiline(
		'What are the pros and cons of the decision outcome?',
		'',
		'Use consistent formatting — each item should start with Pro or Con.',
		'This structured analysis helps when revisiting the decision later',
		'to understand the trade-offs that were accepted.',
	),
	url: guide('pros-and-cons'),
	level: 3,
	optional: true,
	children: [
		md.heading(3),
		prosAndCons,
	],
})

const outcomeSection = schema.section({
	name: 'Outcome',
	description: multiline(
		'What was the result of the decision?',
		'',
		'List all consequences — positive, negative, and neutral.',
		'The consequences of one ADR often become the context for the next.',
		'Include follow-up actions and any subsequent ADRs needed.',
	),
	url: guide('outcome'),
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
	description: multiline(
		'What sources informed this decision?',
		'',
		'Link to related ADRs, RFCs, vendor docs, spike results, and team discussions.',
		'Document when the decision should be revisited',
		'and any validation mechanisms in place.',
	),
	url: guide('references'),
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
			description: multiline(
				'Architecture decision record (ADR)',
				'',
				'Describe the situation and problem that motivates the decision.',
				'Write in value-neutral language — describe facts, not opinions.',
				'Call out tensions between competing forces explicitly.',
			),
			url: guide(),
			match(node) {
				const text = getNodeText(node).trim()
				if (!text.startsWith('`ADR`') && !text.startsWith('ADR')) {
					return schema.error('Heading must start with ADR (for example: # `ADR` Title)')
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
