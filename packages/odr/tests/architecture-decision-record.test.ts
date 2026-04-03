import { assert, describe, test } from 'vitest'

import { architectureDecisionRecord } from '../src/architecture-decision-record.mts'

import type { Node, Parent } from 'unist'

// -- AST node factories --

function n(type: string, properties?: Record<string, unknown>): Node {
	return { type, ...properties } as Node
}

function root(...children: Node[]): Parent {
	return { type: 'root', children } as Parent
}

function section(depth: number, name: string, ...children: Node[]): Node {
	return n('section', { depth, name, children })
}

function heading(depth: number, ...children: Node[]): Node {
	return n('heading', { depth, children })
}

function text(value: string): Node {
	return n('text', { value })
}

function inlineCode(value: string): Node {
	return n('inlineCode', { value })
}

function paragraph(...children: Node[]): Node {
	return n('paragraph', { children })
}

function blockquote(...children: Node[]): Node {
	return n('blockquote', { children })
}

function code(lang: string, value: string): Node {
	return n('code', { lang, value })
}

function list(...items: Node[]): Node {
	return n('list', { ordered: false, children: items })
}

function listItem(...children: Node[]): Node {
	return n('listItem', { children })
}

function link(url: string, ...children: Node[]): Node {
	return n('link', { url, children })
}

function linkReference(identifier: string, ...children: Node[]): Node {
	return n('linkReference', { identifier, children })
}

function yaml(value: string): Node {
	return n('yaml', { value })
}

// -- Test data builders --

function buildValidADR(): Parent {
	return root(
		yaml('schema: @md-schema/odr/v1/architecture-decision-record'),
		section(1, '`ADR` Remark guided markdown',
			heading(1, inlineCode('ADR'), text(' Remark guided markdown')),
			blockquote(
				paragraph(text('[!NOTE]')),
				paragraph(text('This is still to be decided')),
			),
			code('yml', 'status: proposed\ncreated: 2025-11-19'),
			paragraph(text('There seems to be quite some documentation format drift.')),
			paragraph(text('Documenting in markdown is the preferred solution.')),
			section(2, 'Decision',
				heading(2, text('Decision')),
				paragraph(text('Use a custom remark plugin.')),
				section(3, 'Drivers',
					heading(3, text('Drivers')),
					section(4, 'remark',
						heading(4, linkReference('remark', text('remark'))),
						paragraph(text('We will be using remark plugins.')),
					),
					section(4, 'json schema',
						heading(4, linkReference('json-schema', text('json schema'))),
						paragraph(text('We will be using jsonschemas.')),
					),
				),
				section(3, 'Alternatives',
					heading(3, text('Alternatives')),
					section(4, 'vscode: markdownlint',
						heading(4, link('https://example.com/markdownlint', text('vscode: markdownlint'))),
						blockquote(paragraph(text('Markdownlint is an extension.'))),
						paragraph(text('This is a fine plugin but less straightforward.')),
					),
				),
			),
			section(2, 'Outcome',
				heading(2, text('Outcome')),
				paragraph(text('Once finished this product should facilitate templates.')),
				section(3, 'Pros and cons',
					heading(3, text('Pros and cons')),
					paragraph(
						inlineCode('pro'), text(' Markdown support OOTB'),
						inlineCode('pro'), text(' Standardized way of working'),
						inlineCode('con'), text(' A new standard to adopt'),
					),
				),
			),
			section(2, 'References:',
				heading(2, text('References:')),
				list(
					listItem(paragraph(text('remark: https://github.com/remarkjs/remark'))),
					listItem(paragraph(text('json schema: https://json-schema.org/'))),
				),
			),
		),
	)
}

describe('architecture-decision-record', () => {
	describe('valid document', () => {
		test('validates a well-formed ADR document', () => {
			const results = architectureDecisionRecord.validate(buildValidADR())
			const errors = results.filter(r => r.severity === 'error')
			assert.isEmpty(errors, errors.map(error => error.message).join(', '))
		})
	})

	describe('heading validation', () => {
		test('errors when h1 does not start with ADR', () => {
			const document = root(
				yaml('schema: @md-schema/odr/v1/architecture-decision-record'),
				section(1, 'Wrong title',
					heading(1, text('Wrong title')),
					paragraph(text('Some context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isNotEmpty(errors)
			assert.include(errors[0].message, 'ADR')
		})
	})

	describe('context paragraphs', () => {
		test('errors when no context paragraphs', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isNotEmpty(errors)
			assert.isTrue(errors.some(error => error.message.includes('paragraph')))
		})
	})

	describe('decision section', () => {
		test('errors when decision section is missing', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Some context.')),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isNotEmpty(errors)
			assert.isTrue(errors.some(error => error.message.includes('Decision')))
		})

		test('errors when decision has no summary paragraph', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						// no paragraph
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isNotEmpty(errors)
			assert.isTrue(errors.some(error => error.message.includes('paragraph')))
		})
	})

	describe('drivers section', () => {
		test('errors when driver heading is not a link', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
						section(3, 'Drivers',
							heading(3, text('Drivers')),
							section(4, 'Not a link',
								heading(4, text('Not a link')),
								paragraph(text('Description.')),
							),
						),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isTrue(errors.some(error => error.message.includes('link only')))
		})

		test('errors when driver is empty', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
						section(3, 'Drivers',
							heading(3, text('Drivers')),
							section(4, 'remark',
								heading(4, linkReference('remark', text('remark'))),
								// no body
							),
						),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isTrue(errors.some(error => error.message.includes('may not be empty')))
		})
	})

	describe('alternatives section', () => {
		test('errors when alternative heading is not a link', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
						section(3, 'Alternatives',
							heading(3, text('Alternatives')),
							section(4, 'not linked',
								heading(4, text('not linked')),
								blockquote(paragraph(text('Quote.'))),
								paragraph(text('Dismissed.')),
							),
						),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isTrue(errors.some(error => error.message.includes('link only')))
		})

		test('errors when alternative lacks blockquote or dismissal', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
						section(3, 'Alternatives',
							heading(3, text('Alternatives')),
							section(4, 'markdownlint',
								heading(4, link('https://example.com', text('markdownlint'))),
								// no blockquote, no dismissal paragraph
							),
						),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isTrue(errors.some(error => error.message.includes('blockquote explanation')))
		})
	})

	describe('pros and cons', () => {
		test('allows separate pro and con paragraphs', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
					section(2, 'Outcome',
						heading(2, text('Outcome')),
						paragraph(text('Outcome text.')),
						section(3, 'Pros and cons',
							heading(3, text('Pros and cons')),
							paragraph(inlineCode('pro'), text(' Something good')),
							paragraph(inlineCode('con'), text(' Something bad')),
						),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isFalse(errors.some(error => error.message.includes('pro') || error.message.includes('con')))
		})

		test('errors when line is not tagged', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
					section(2, 'Outcome',
						heading(2, text('Outcome')),
						paragraph(text('Outcome text.')),
						section(3, 'Pros and cons',
							heading(3, text('Pros and cons')),
							paragraph(text('Not a tagged line')),
						),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isTrue(errors.some(error => error.message.includes('must contain `pro` or `con`')))
		})

		test('errors when pro comes after con', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
					section(2, 'Outcome',
						heading(2, text('Outcome')),
						paragraph(text('Outcome text.')),
						section(3, 'Pros and cons',
							heading(3, text('Pros and cons')),
							paragraph(inlineCode('con'), text(' Bad'), inlineCode('pro'), text(' Good')),
						),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isTrue(errors.some(error => error.message.includes('Pros must come before cons')))
		})
	})

	describe('references', () => {
		test('errors when references list is empty', () => {
			const document = root(
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
					section(2, 'References:',
						heading(2, text('References:')),
						list(),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isTrue(errors.some(error => error.message.includes('at least one list item')))
		})
	})

	describe('optional sections', () => {
		test('accepts minimal valid document (no optional sections)', () => {
			const document = root(
				yaml('schema: @md-schema/odr/v1/architecture-decision-record'),
				section(1, 'ADR Minimal',
					heading(1, text('ADR Minimal')),
					paragraph(text('Context paragraph.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isEmpty(errors, errors.map(error => error.message).join(', '))
		})

		test('accepts document with frontmatter', () => {
			const document = root(
				yaml('schema: @md-schema/odr/v1/architecture-decision-record'),
				section(1, 'ADR With Frontmatter',
					heading(1, text('ADR With Frontmatter')),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						paragraph(text('We decided.')),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isEmpty(errors, errors.map(error => error.message).join(', '))
		})
	})

	describe('ignored nodes', () => {
		test('definition and html nodes are ignored', () => {
			const document = root(
				yaml('schema: @md-schema/odr/v1/architecture-decision-record'),
				n('definition', { identifier: 'remark', url: 'https://github.com/remarkjs/remark' }),
				n('definition', { identifier: 'json-schema', url: 'https://json-schema.org/' }),
				section(1, 'ADR Title',
					heading(1, text('ADR Title')),
					n('html', { value: '<!-- comment -->' }),
					paragraph(text('Context.')),
					section(2, 'Decision',
						heading(2, text('Decision')),
						n('html', { value: '<!-- inline comment -->' }),
						paragraph(text('We decided.')),
					),
				),
			)
			const errors = architectureDecisionRecord.validate(document).filter(r => r.severity === 'error')
			assert.isEmpty(errors, errors.map(error => error.message).join(', '))
		})
	})
})
