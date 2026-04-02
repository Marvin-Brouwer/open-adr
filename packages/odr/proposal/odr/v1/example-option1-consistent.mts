import { template, schema, md } from './schema-builder' // Hypothetical imports

type AstNode = {
	type?: string
	value?: string
	depth?: number
	children?: AstNode[]
	position?: {
		start?: { line?: number }
		end?: { line?: number }
	}
	[key: string]: unknown
}

const getNodeText = (node: AstNode | null | undefined): string => {
	if (!node) return ''
	if (typeof node.value === 'string') return node.value
	if (!Array.isArray(node.children)) return ''
	return node.children.map((child) => getNodeText(child)).join('')
}

const splitTaggedLines = (text: string) =>
	text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)

const asArray = <T>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : [])

const isWhitespaceText = (node: AstNode) => node.type === 'text' && !String(node.value || '').trim()

const isLinkNode = (node: AstNode) => node.type === 'link' || node.type === 'linkReference'

const getHeadingNode = (sectionNode: AstNode) => asArray(sectionNode.children).find((child) => child.type === 'heading')

const hasLinkOnlyHeading = (sectionNode: AstNode, level: number): boolean => {
	const heading = getHeadingNode(sectionNode)
	if (!heading) return false
	if (heading.depth !== level) return false

	const meaningfulChildren = asArray(heading.children).filter((child) => !isWhitespaceText(child))
	return meaningfulChildren.length === 1 && isLinkNode(meaningfulChildren[0])
}

const hasNonEmptyBody = (sectionNode: AstNode): boolean => {
	const bodyNodes = asArray(sectionNode.children).filter((child) => child.type !== 'heading')
	return bodyNodes.some((child) => {
		const text = getNodeText(child).trim()
		return !!text || child.type === 'blockquote' || child.type === 'list' || child.type === 'code'
	})
}

const isUrlLike = (value: string) => /^(https?:\/\/|\.?\.?\/)/.test(value)

const isNamedReference = (value: string) => {
	const idx = value.indexOf(':')
	if (idx <= 0) return false
	const rhs = value.slice(idx + 1).trim()
	return isUrlLike(rhs)
}

const isObjectReference = (value: string) => /(^|\n)\s*name:\s+/.test(value) && /(^|\n)\s*url:\s+/.test(value)

const prosConsParagraph = () =>
	md.paragraph({
		required: true,
		match(node) {
			const lines = splitTaggedLines(getNodeText(node))
			if (!lines.length) {
				return {
					severity: 'error',
					message: 'Pros and cons paragraph must contain `pro` and `con` entries',
				}
			}

			const firstConIndex = lines.findIndex((line) => line.startsWith('`con`'))
			if (firstConIndex === -1) {
				return {
					severity: 'error',
					message: 'Pros and cons paragraph must include at least one `con` entry',
				}
			}

			const hasPro = lines.some((line) => line.startsWith('`pro`'))
			if (!hasPro) {
				return {
					severity: 'error',
					message: 'Pros and cons paragraph must include at least one `pro` entry',
				}
			}

			for (let i = 0; i < lines.length; i += 1) {
				const line = lines[i]
				if (!line.startsWith('`pro`') && !line.startsWith('`con`')) {
					return {
						severity: 'error',
						message: 'Each line in pros and cons must start with `pro` or `con`',
					}
				}

				if (line.startsWith('`pro`') && i > firstConIndex) {
					return {
						severity: 'error',
						message: 'Pros must come before cons in the pros and cons paragraph',
					}
				}
			}
		}
	})

const driverEntry = () =>
	schema.section({
		level: 3,
		optional: true,
		match(node) {
			if (!hasLinkOnlyHeading(node, 3)) {
				return {
					severity: 'error',
					message: 'Driver entries must be h3 sections with a heading that is a link only',
				}
			}

			if (!hasNonEmptyBody(node)) {
				return {
					severity: 'error',
					message: 'Driver entries may not be empty',
				}
			}
		},
		children: [md.paragraph({ optional: true })],
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

			const body = asArray(node.children).filter((child) => child.type !== 'heading')
			const hasBlockquote = body.some((child) => child.type === 'blockquote')
			const hasParagraph = body.some((child) => child.type === 'paragraph' && getNodeText(child).trim())

			if (!hasBlockquote || !hasParagraph) {
				return {
					severity: 'error',
					message: 'Alternatives must contain a blockquote explanation and a dismissal paragraph',
				}
			}
		},
		children: [md.blockquote({ optional: true }), md.paragraph({ optional: true })],
	})

const referencesList = () =>
	md.list({
		required: true,
		match(node) {
			const items = asArray(node.children).filter((child) => child.type === 'listItem')
			if (!items.length) {
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
		}
	})

const mainSection = schema.section({
	level: 1,
	required: true,
	children: [
		md.heading(1, {
			required: true,
			match(node) {
				const text = getNodeText(node).trim()
				if (!text.startsWith('`ADR`') && !text.startsWith('ADR')) {
					return { severity: 'error', message: 'Heading must start with ADR (for example: # `ADR` Title)' }
				}
			},
		}),
		contextSection,
		decisionSection,
		outcomeSection,
		referencesSection,
	],
})

const contextSection = schema.strictOrder(
	md.blockquote({ optional: true }),
	md.codeBlock({ optional: true, language: 'yml' }),
	md.paragraph({ minOccurrences: 1, maxOccurrences: 5 }),
)

const driversSection = schema.section({
	name: 'Drivers',
	level: 3,
	optional: true,
	match(node) {
		const sections = asArray(node.children).filter((child) => child.type === 'section')
		if (!sections.length) {
			return { severity: 'error', message: 'Drivers section is optional, but may not be empty if present' }
		}
	},
	children: [schema.oneOrMore(driverEntry())],
})

const alternativesSection = schema.section({
	name: 'Alternatives',
	level: 3,
	optional: true,
	match(node) {
		const sections = asArray(node.children).filter((child) => child.type === 'section')
		if (!sections.length) {
			return { severity: 'error', message: 'Alternatives section is optional, but may not be empty if present' }
		}
	},
	children: [schema.oneOrMore(alternativeEntry())],
})

const decisionSection = schema.section({
	name: 'Decision',
	level: 2,
	required: true,
	children: schema.strictOrder(md.paragraph({ required: true }), driversSection, alternativesSection),
})

const prosAndConsSection = schema.section({
	name: 'Pros and cons',
	level: 3,
	optional: true,
	children: [md.paragraph({ optional: true }), prosConsParagraph()],
})

const outcomeSection = schema.section({
	name: 'Outcome',
	level: 2,
	optional: true,
	children: schema.strictOrder(md.paragraph({ required: true }), prosAndConsSection),
})

const referencesSection = schema.section({
	name: 'References',
	level: 2,
	optional: true,
	children: [referencesList()],
})

export const architectureDecisionRecord = template({
	children: [
		md.frontmatter({ optional: true }),
		mainSection,
	],
})