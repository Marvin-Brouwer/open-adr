import { template, schema, md, fm, getNodeText } from '@md-schema/builder'

import { alternativeList } from '../components/alternative-list.mts'
import { driversList } from '../components/drivers-list.mts'
import { prosAndCons } from '../components/pros-cons.mts'
import { referenceList } from '../components/reference-list.mjs'
import { guideUrl, multiline } from '../helpers.mts'
import { cfm } from '../tools/custom-frontmatter.mts'

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
	match: md.match.range(0, 1),
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
	match: md.match.range(0, 1),
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
	match: md.match.required,
	children: schema.strictOrder(
		md.heading(2),
		md.paragraph({
			match: md.match.required.with(
				'Add a paragraph stating the decision in active voice ("We will ...")',
			),
		}),
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
	match: md.match.range(0, 1),
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
	match: md.match.range(0, 1),
	children: schema.strictOrder(
		md.heading(2),
		md.paragraph({
			match: md.match.required.with(
				'Add a paragraph describing the consequences — positive, negative, and neutral',
			),
		}),
		prosAndConsSection,
	),
})

const referencesSection = schema.section({
	name: 'References',
	description: multiline(
		'What sources informed this decision?',
		'',
		'Link to related ADRs, RFCs, vendor docs, spike results, and team discussions.',
		'Document when the decision should be revisited',
		'and any validation mechanisms in place.',
	),
	url: guide('references'),
	level: 2,
	match: md.match.range(0, 1),
	children: schema.strictOrder(
		md.heading(2),
		referenceList,
	),
})

const mainSection = schema.section({
	level: 1,
	match: md.match.required,
	children: schema.strictOrder(
		md.heading(1, {
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
		md.codeBlock({
			name: 'metadata',
			match: md.match.required.with(multiline(
				'The metadata for an ADR is required,',
				'add a yml codeblock with at least the following fields:',
				'```yaml',
				'status: in progress | proposed | rejected | accepted',
				'created: YYYY-MM-DD',
				'deciders:',
				'  - list of people or teams responsible for the decision',
				'```',
			)),
			language: 'yml',
			fields: fm.object({
				status: fm.enum({
					message: v => `Status must be one of: \n - ${v.join('\n - ')}`,
					values: ['in progress', 'proposed', 'rejected', 'accepted'],
				}),
				created: fm.date(),
				deciders: fm.contributors(),
				supersedes: fm.optional(cfm.validFileOrGitRef()),
			}),
		}),
		md.paragraph({ match: md.match.range(1, 5) }),
		schema.sectionMap(decisionSection, outcomeSection, referencesSection),
	),
})

export default template({
	children: [
		// If this is not present, this whole template is never loaded
		md.frontmatter(),
		mainSection,
	],
})
