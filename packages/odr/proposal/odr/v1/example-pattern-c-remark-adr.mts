import { template, schema, md } from './schema-builder' // Hypothetical imports

/**
 * Pattern C Example: Factory Functions + Fluent API
 * Validates: demo/docs/architecture/2025-11-19.remark-guided-docs.md
 */

// ============================================================================
// REUSABLE PARTS (Factories)
// ============================================================================

/**
 * A pros/cons list with the pattern: `pro` or `con` + description
 */
const prosConsList = () =>
	md.list({
		itemsMatch: {
			pattern: /^`(pro|con)`\s+/,
			description: 'Items must start with `pro` or `con` tag'
		}
	})

/**
 * A section that contains driver rationales
 * Each driver is a heading followed by body text
 */
const driverSection = (name: string) =>
	schema.section({
		name,
		level: 3,
		optional: true,
		description: `Driver: ${name}`
	}).children([
		md.paragraph({ optional: true })
	])

/**
 * An alternative option with optional dismissal reason
 */
const alternativeOption = (name: string) =>
	schema.section({
		name,
		level: 4,
		optional: true
	}).children([
		md.blockquote({ optional: true }),
		md.paragraph({ optional: true })
	])

/**
 * A section that wraps alternatives
 */
const alternativesSection = () =>
	schema.section({
		name: 'Alternatives',
		level: 3,
		optional: true
	}).children([
		alternativeOption('markdownlint'),
		alternativeOption('Custom DSL'),
		alternativeOption('Other alternatives', { optional: true })
	])

/**
 * Main decision content: drivers + alternatives together
 */
const decisionContent = () =>
	schema.container({ type: 'decision-content' })
		.children([
			md.paragraph({ required: true }),
			driverSection('remark'),
			driverSection('json schema'),
			driverSection('vscode: unifiedjs.vscode-remark'),
			alternativesSection()
		])

/**
 * Outcome section structure: intro + subsections
 */
const outcomeContent = () =>
	schema.container({ type: 'outcome-content' })
		.children([
			md.paragraph({ required: true }),
			schema.section({
				name: 'Pros and cons',
				level: 3,
				optional: true
			}).children([
				md.paragraph({ optional: true }),
				prosConsList()
			])
		])

/**
 * References section: typically a list of links
 */
const referencesSection = () =>
	schema.section({
		name: 'References',
		level: 2,
		optional: true
	}).children([
		md.list()
	])

// ============================================================================
// MAIN TEMPLATE (Using Pattern C)
// ============================================================================

export const remarkGuidedDocsADR = template()
	/**
	 * Frontmatter (optional): YAML metadata
	 */
	.add(
		md.frontmatter({ optional: true })
	)

	/**
	 * Link references at top of document (optional but common)
	 */
	.add(
		md.linkReferences({ optional: true })
	)

	/**
	 * Main title: must start with "ADR" (or backtick-quoted)
	 */
	.add(
		md.heading(1, {
			required: true,
			match: /^`?ADR`?\s+/,
			error: 'Document must start with "# `ADR` Title"',
			description: 'The main architectural decision record title'
		})
	)

	/**
	 * Optional comment/note block
	 */
	.add(
		md.htmlComment({ optional: true })
	)

	/**
	 * Optional note admonition
	 */
	.add(
		md.blockquote({
			optional: true,
			description: 'Note: often includes instructions or context'
		})
	)

	/**
	 * Optional YAML code block (metadata/status)
	 */
	.add(
		md.codeBlock({
			optional: true,
			language: 'yml',
			description: 'Metadata: status, created date, deciders, etc'
		})
	)

	/**
	 * Problem/context description paragraphs
	 */
	.add(
		md.paragraph({
			minOccurrences: 1,
			maxOccurrences: 5,
			description: 'Context and problem statement'
		})
	)

	/**
	 * Decision section: the core of the ADR
	 */
	.add(
		schema.section({
			name: 'Decision',
			level: 2,
			required: true,
			description: 'The decision that was made'
		}).children([
			md.paragraph({ required: true }),
			decisionContent()
		])
	)

	/**
	 * Outcome section: consequences and pros/cons
	 */
	.add(
		schema.section({
			name: 'Outcome',
			level: 2,
			optional: true,
			description: 'Consequences and implications of the decision'
		}).children([
			outcomeContent()
		])
	)

	/**
	 * References section: external links and citations
	 */
	.add(
		referencesSection()
	)

// ============================================================================
// USAGE/VALIDATION EXAMPLE
// ============================================================================

export function validateDocument(doc: any) {
	return remarkGuidedDocsADR.validate(doc)
}

/**
 * Example validation output:
 * {
 *   valid: true,
 *   errors: [],
 *   warnings: [
 *     {
 *       path: 'root[6]',
 *       message: 'Optional section "Outcome" not found',
 *       severity: 'info'
 *     }
 *   ]
 * }
 */
