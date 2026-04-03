import { assert, describe, test } from 'vitest'

import { md } from '../src/md.mts'
import { schema } from '../src/schema.mts'
import { template, type ValidationResult } from '../src/template.mts'

import type { Node, Parent } from 'unist'

function n(type: string, properties?: Record<string, unknown>): Node {
	return { type, ...properties } as Node
}

function root(...children: Node[]): Parent {
	return { type: 'root', children } as Parent
}

function section(depth: number, name: string, children: Node[]): Node {
	return n('section', { depth, name, children })
}

function heading(depth: number, text?: string): Node {
	const children = text ? [n('text', { value: text })] : []
	return n('heading', { depth, children })
}

function paragraph(text?: string): Node {
	const children = text ? [n('text', { value: text })] : []
	return n('paragraph', { children })
}

function errors(results: ValidationResult[]): ValidationResult[] {
	return results.filter(r => r.severity === 'error')
}

function warnings(results: ValidationResult[]): ValidationResult[] {
	return results.filter(r => r.severity === 'warning')
}

describe('template validation', () => {
	describe('strictOrder', () => {
		test('validates correct order', () => {
			const t = template({
				children: schema.strictOrder(
					md.heading(1),
					md.paragraph(),
				),
			})

			const results = t.validate(root(heading(1), paragraph()))
			assert.isEmpty(errors(results))
		})

		test('errors on missing required node', () => {
			const t = template({
				children: schema.strictOrder(
					md.heading(1),
					md.paragraph({ required: true }),
				),
			})

			const results = t.validate(root(heading(1)))
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Missing required paragraph')
		})

		test('defaults to required when neither required nor optional is set', () => {
			const t = template({
				children: schema.strictOrder(md.paragraph()),
			})

			const results = t.validate(root())
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Missing required paragraph')
		})

		test('skips optional missing node', () => {
			const t = template({
				children: schema.strictOrder(
					md.blockquote({ optional: true }),
					md.paragraph(),
				),
			})

			const results = t.validate(root(paragraph()))
			assert.isEmpty(errors(results))
		})

		test('errors when wrong type in sequence', () => {
			const t = template({
				children: schema.strictOrder(
					md.heading(1),
					md.paragraph(),
				),
			})

			const results = t.validate(root(paragraph(), heading(1)))
			assert.isNotEmpty(errors(results))
		})

		test('warns on extra unexpected nodes', () => {
			const t = template({
				children: schema.strictOrder(md.heading(1)),
			})

			const results = t.validate(root(heading(1), paragraph()))
			assert.isEmpty(errors(results))
			assert.equal(warnings(results).length, 1)
			assert.include(warnings(results)[0].message, 'Unexpected paragraph')
		})
	})

	describe('regular array', () => {
		test('validates presence (order independent)', () => {
			const t = template({
				children: [
					md.paragraph(),
					md.heading(1),
				],
			})

			// reversed order in AST — should still pass
			const results = t.validate(root(heading(1), paragraph()))
			assert.isEmpty(errors(results))
		})

		test('errors on missing required node', () => {
			const t = template({
				children: [
					md.heading(1),
					md.paragraph({ required: true }),
				],
			})

			const results = t.validate(root(heading(1)))
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Missing required paragraph')
		})

		test('warns on extra nodes', () => {
			const t = template({
				children: [md.heading(1)],
			})

			const results = t.validate(root(heading(1), paragraph(), n('blockquote')))
			assert.isEmpty(errors(results))
			assert.equal(warnings(results).length, 2)
		})
	})

	describe('ignored nodes', () => {
		test('skips definition and html nodes by default', () => {
			const t = template({
				children: schema.strictOrder(
					md.heading(1),
					md.paragraph(),
				),
			})

			const results = t.validate(root(
				n('definition', { identifier: 'ref', url: '#' }),
				heading(1),
				n('html', { value: '<!-- comment -->' }),
				paragraph(),
			))
			assert.isEmpty(errors(results))
		})

		test('custom ignoreTypes', () => {
			const t = template({
				children: schema.strictOrder(md.paragraph()),
				ignoreTypes: ['thematicBreak'],
			})

			const results = t.validate(root(n('thematicBreak'), paragraph()))
			assert.isEmpty(errors(results))
		})

		test('custom ignoreTypes does not ignore default types', () => {
			const t = template({
				children: schema.strictOrder(md.paragraph()),
				ignoreTypes: ['thematicBreak'],
			})

			// html node is NOT ignored with custom ignoreTypes
			const results = t.validate(root(paragraph(), n('html', { value: '<!-- x -->' })))
			assert.equal(warnings(results).length, 1)
			assert.include(warnings(results)[0].message, 'Unexpected html')
		})
	})

	describe('sections', () => {
		test('validates section by level', () => {
			const t = template({
				children: [
					schema.section({
						level: 1,
						children: [md.heading(1)],
					}),
				],
			})

			const results = t.validate(root(
				section(1, 'Title', [heading(1, 'Title')]),
			))
			assert.isEmpty(errors(results))
		})

		test('validates section by name', () => {
			const t = template({
				children: [
					schema.section({
						level: 2,
						name: 'Decision',
						children: [md.heading(2)],
					}),
				],
			})

			const results = t.validate(root(
				section(2, 'Decision', [heading(2, 'Decision')]),
			))
			assert.isEmpty(errors(results))
		})

		test('errors when section name does not match', () => {
			const t = template({
				children: [
					schema.section({
						level: 2,
						name: 'Decision',
						children: [md.heading(2)],
					}),
				],
			})

			const results = t.validate(root(
				section(2, 'Outcome', [heading(2, 'Outcome')]),
			))
			assert.isNotEmpty(errors(results))
		})

		test('validates nested sections', () => {
			const t = template({
				children: [
					schema.section({
						level: 1,
						children: schema.strictOrder(
							md.heading(1),
							schema.section({
								level: 2,
								name: 'Child',
								children: [md.heading(2)],
							}),
						),
					}),
				],
			})

			const r = root(
				section(1, 'Parent', [
					heading(1, 'Parent'),
					section(2, 'Child', [heading(2, 'Child')]),
				]),
			)

			const results = t.validate(r)
			assert.isEmpty(errors(results))
		})

		test('errors on missing required nested section', () => {
			const t = template({
				children: [
					schema.section({
						level: 1,
						children: schema.strictOrder(
							md.heading(1),
							schema.section({
								level: 2,
								name: 'Required',
								required: true,
								children: [md.heading(2)],
							}),
						),
					}),
				],
			})

			const r = root(section(1, 'Parent', [heading(1, 'Parent')]))
			const results = t.validate(r)
			assert.isNotEmpty(errors(results))
			assert.include(errors(results)[0].message, 'Missing required section "Required"')
		})
	})

	describe('match callback', () => {
		test('collects match errors', () => {
			const t = template({
				children: schema.strictOrder(
					md.heading(1, {
						match() {
							return { severity: 'error', message: 'Heading must start with ADR' }
						},
					}),
				),
			})

			const results = t.validate(root(heading(1, 'Wrong')))
			assert.equal(errors(results).length, 1)
			assert.equal(errors(results)[0].message, 'Heading must start with ADR')
		})

		test('collects match warnings', () => {
			const t = template({
				children: schema.strictOrder(
					md.paragraph({
						match() {
							return { severity: 'warning', message: 'Consider more detail' }
						},
					}),
				),
			})

			const results = t.validate(root(paragraph()))
			assert.isEmpty(errors(results))
			assert.equal(warnings(results).length, 1)
			assert.equal(warnings(results)[0].message, 'Consider more detail')
		})

		test('no result from match means OK', () => {
			const t = template({
				children: schema.strictOrder(
					md.heading(1, {
						match() { return void 0 },
					}),
				),
			})

			const results = t.validate(root(heading(1, 'Title')))
			assert.isEmpty(results)
		})

		test('match on section descriptor', () => {
			const t = template({
				children: [
					schema.section({
						level: 1,
						match() {
							return { severity: 'error', message: 'Section invalid' }
						},
						children: [md.heading(1)],
					}),
				],
			})

			const results = t.validate(root(
				section(1, 'Title', [heading(1, 'Title')]),
			))
			assert.equal(errors(results).length, 1)
			assert.equal(errors(results)[0].message, 'Section invalid')
		})
	})

	describe('oneOrMore', () => {
		test('matches multiple children', () => {
			const t = template({
				children: schema.strictOrder(
					schema.oneOrMore(md.paragraph()),
				),
			})

			const results = t.validate(root(paragraph(), paragraph(), paragraph()))
			assert.isEmpty(errors(results))
		})

		test('matches exactly one child', () => {
			const t = template({
				children: schema.strictOrder(
					schema.oneOrMore(md.paragraph()),
				),
			})

			const results = t.validate(root(paragraph()))
			assert.isEmpty(errors(results))
		})

		test('errors on zero matches', () => {
			const t = template({
				children: schema.strictOrder(
					schema.oneOrMore(md.paragraph()),
				),
			})

			const results = t.validate(root())
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Expected at least one paragraph')
		})

		test('stops at non-matching type', () => {
			const t = template({
				children: schema.strictOrder(
					schema.oneOrMore(md.paragraph()),
					md.heading(1),
				),
			})

			const results = t.validate(root(paragraph(), paragraph(), heading(1)))
			assert.isEmpty(errors(results))
		})

		test('oneOrMore with sections', () => {
			const t = template({
				children: schema.strictOrder(
					schema.oneOrMore(
						schema.section({
							level: 3,
							children: [md.heading(3)],
						}),
					),
				),
			})

			const results = t.validate(root(
				section(3, 'A', [heading(3, 'A')]),
				section(3, 'B', [heading(3, 'B')]),
			))
			assert.isEmpty(errors(results))
		})

		test('oneOrMore in array mode', () => {
			const t = template({
				children: [
					schema.oneOrMore(md.paragraph()),
				],
			})

			const results = t.validate(root(paragraph(), paragraph()))
			assert.isEmpty(errors(results))
		})
	})

	describe('minOccurrences / maxOccurrences', () => {
		test('accepts within range', () => {
			const t = template({
				children: schema.strictOrder(
					md.paragraph({ minOccurrences: 1, maxOccurrences: 3 }),
				),
			})

			const results = t.validate(root(paragraph(), paragraph()))
			assert.isEmpty(errors(results))
		})

		test('errors below minimum', () => {
			const t = template({
				children: schema.strictOrder(
					md.paragraph({ minOccurrences: 2, maxOccurrences: 5 }),
				),
			})

			const results = t.validate(root(paragraph()))
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Expected at least 2')
		})

		test('stops at maximum', () => {
			const t = template({
				children: schema.strictOrder(
					md.paragraph({ minOccurrences: 1, maxOccurrences: 2 }),
					md.heading(1),
				),
			})

			// 3rd paragraph should be treated as heading slot (and fail/warn)
			const results = t.validate(root(paragraph(), paragraph(), paragraph(), heading(1)))
			// 3rd paragraph doesn't match heading → error for missing heading
			// or the 3rd paragraph becomes unexpected
			const errs = errors(results)
			const warns = warnings(results)
			// At minimum, it should not consume more than max
			assert.isTrue(errs.length > 0 || warns.length > 0)
		})

		test('handles minOccurrences 0 (all optional)', () => {
			const t = template({
				children: schema.strictOrder(
					md.paragraph({ minOccurrences: 0, maxOccurrences: 3 }),
					md.heading(1),
				),
			})

			const results = t.validate(root(heading(1)))
			assert.isEmpty(errors(results))
		})
	})

	describe('codeBlock language', () => {
		test('matches specific language', () => {
			const t = template({
				children: schema.strictOrder(
					md.codeBlock({ language: 'yml' }),
				),
			})

			const results = t.validate(root(n('code', { lang: 'yml', value: 'key: val' })))
			assert.isEmpty(errors(results))
		})

		test('does not match wrong language', () => {
			const t = template({
				children: schema.strictOrder(
					md.codeBlock({ language: 'yml' }),
				),
			})

			const results = t.validate(root(n('code', { lang: 'json', value: '{}' })))
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Missing required code block')
		})

		test('matches any language when not specified', () => {
			const t = template({
				children: schema.strictOrder(md.codeBlock()),
			})

			const results = t.validate(root(n('code', { lang: 'python', value: 'pass' })))
			assert.isEmpty(errors(results))
		})
	})

	describe('heading level matching', () => {
		test('matches correct level', () => {
			const t = template({
				children: schema.strictOrder(md.heading(2)),
			})

			const results = t.validate(root(heading(2)))
			assert.isEmpty(errors(results))
		})

		test('does not match wrong level', () => {
			const t = template({
				children: schema.strictOrder(md.heading(2)),
			})

			const results = t.validate(root(heading(3)))
			assert.equal(errors(results).length, 1)
		})
	})

	describe('complex template', () => {
		test('ADR-like structure validates', () => {
			const t = template({
				children: [
					schema.section({
						level: 1,
						children: schema.strictOrder(
							md.heading(1),
							md.blockquote({ optional: true }),
							md.codeBlock({ optional: true, language: 'yml' }),
							md.paragraph({ minOccurrences: 1, maxOccurrences: 5 }),
							schema.section({
								level: 2,
								name: 'Decision',
								required: true,
								children: schema.strictOrder(
									md.heading(2),
									md.paragraph({ required: true }),
								),
							}),
							schema.section({
								level: 2,
								name: 'Outcome',
								optional: true,
								children: schema.strictOrder(
									md.heading(2),
									md.paragraph({ required: true }),
								),
							}),
						),
					}),
				],
			})

			const r = root(
				section(1, 'ADR Title', [
					heading(1, 'ADR Title'),
					n('blockquote', { children: [paragraph('note')] }),
					n('code', { lang: 'yml', value: 'status: proposed' }),
					paragraph('context'),
					paragraph('more context'),
					section(2, 'Decision', [
						heading(2, 'Decision'),
						paragraph('We decided...'),
					]),
					section(2, 'Outcome', [
						heading(2, 'Outcome'),
						paragraph('The outcome...'),
					]),
				]),
			)

			const results = t.validate(r)
			assert.isEmpty(errors(results))
		})

		test('ADR-like structure errors on missing decision', () => {
			const t = template({
				children: [
					schema.section({
						level: 1,
						children: schema.strictOrder(
							md.heading(1),
							md.paragraph({ minOccurrences: 1, maxOccurrences: 5 }),
							schema.section({
								level: 2,
								name: 'Decision',
								required: true,
								children: [md.heading(2)],
							}),
						),
					}),
				],
			})

			const r = root(
				section(1, 'Title', [
					heading(1, 'Title'),
					paragraph('context'),
				]),
			)

			const results = t.validate(r)
			assert.isNotEmpty(errors(results))
			assert.include(errors(results)[0].message, 'Missing required section "Decision"')
		})
	})

	describe('table', () => {
		test('matches table node', () => {
			const t = template({
				children: schema.strictOrder(
					md.table(),
				),
			})

			const results = t.validate(root(n('table', { children: [] })))
			assert.isEmpty(errors(results))
		})

		test('errors on missing required table', () => {
			const t = template({
				children: schema.strictOrder(
					md.table({ required: true }),
				),
			})

			const results = t.validate(root())
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Missing required table')
		})

		test('skips optional missing table', () => {
			const t = template({
				children: schema.strictOrder(
					md.table({ optional: true }),
					md.paragraph(),
				),
			})

			const results = t.validate(root(paragraph()))
			assert.isEmpty(errors(results))
		})
	})

	describe('thematicBreak', () => {
		test('matches thematicBreak node', () => {
			const t = template({
				children: schema.strictOrder(
					md.paragraph(),
					md.thematicBreak(),
					md.paragraph(),
				),
			})

			const results = t.validate(root(paragraph(), n('thematicBreak'), paragraph()))
			assert.isEmpty(errors(results))
		})

		test('errors on missing required thematicBreak', () => {
			const t = template({
				children: schema.strictOrder(
					md.thematicBreak({ required: true }),
				),
			})

			const results = t.validate(root())
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'Missing required thematic break')
		})

		test('skips optional missing thematicBreak', () => {
			const t = template({
				children: schema.strictOrder(
					md.thematicBreak({ optional: true }),
				),
			})

			const results = t.validate(root())
			assert.isEmpty(errors(results))
		})
	})

	describe('list options', () => {
		test('matches ordered list when ordered: true', () => {
			const t = template({
				children: schema.strictOrder(
					md.list({ ordered: true }),
				),
			})

			const results = t.validate(root(n('list', { ordered: true, children: [] })))
			assert.isEmpty(errors(results))
		})

		test('rejects unordered list when ordered: true', () => {
			const t = template({
				children: schema.strictOrder(
					md.list({ ordered: true }),
				),
			})

			const results = t.validate(root(n('list', { ordered: false, children: [] })))
			assert.isNotEmpty(errors(results))
			assert.include(errors(results)[0].message, 'Missing required ordered list')
		})

		test('matches unordered list when ordered: false', () => {
			const t = template({
				children: schema.strictOrder(
					md.list({ ordered: false }),
				),
			})

			const results = t.validate(root(n('list', { ordered: false, children: [] })))
			assert.isEmpty(errors(results))
		})

		test('matches any list when ordered is not specified', () => {
			const t = template({
				children: schema.strictOrder(
					md.list(),
				),
			})

			const results = t.validate(root(n('list', { ordered: true, children: [] })))
			assert.isEmpty(errors(results))
		})

		test('errors when list has too few items', () => {
			const t = template({
				children: schema.strictOrder(
					md.list({ minItems: 3 }),
				),
			})

			const listNode = n('list', {
				children: [n('listItem'), n('listItem')],
			})
			const results = t.validate(root(listNode))
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'at least 3 item(s), found 2')
		})

		test('errors when list has too many items', () => {
			const t = template({
				children: schema.strictOrder(
					md.list({ maxItems: 2 }),
				),
			})

			const listNode = n('list', {
				children: [n('listItem'), n('listItem'), n('listItem')],
			})
			const results = t.validate(root(listNode))
			assert.equal(errors(results).length, 1)
			assert.include(errors(results)[0].message, 'at most 2 item(s), found 3')
		})

		test('passes when list item count is within range', () => {
			const t = template({
				children: schema.strictOrder(
					md.list({ minItems: 1, maxItems: 5 }),
				),
			})

			const listNode = n('list', {
				children: [n('listItem'), n('listItem'), n('listItem')],
			})
			const results = t.validate(root(listNode))
			assert.isEmpty(errors(results))
		})
	})

	describe('description', () => {
		function infos(results: ValidationResult[]): ValidationResult[] {
			return results.filter(r => r.severity === 'info')
		}

		test('emits info for section with description', () => {
			const t = template({
				children: [
					schema.section({
						name: 'Decision',
						description: 'What is the change',
						level: 2,
						required: true,
						children: [md.heading(2)],
					}),
				],
			})

			const results = t.validate(root(
				section(2, 'Decision', [heading(2, 'Decision')]),
			))
			assert.isEmpty(errors(results))
			assert.equal(infos(results).length, 1)
			assert.equal(infos(results)[0].message, 'What is the change')
		})

		test('targets heading node for section description', () => {
			const h = heading(2, 'Decision')
			const t = template({
				children: [
					schema.section({
						name: 'Decision',
						description: 'What is the change',
						level: 2,
						required: true,
						children: [md.heading(2)],
					}),
				],
			})

			const results = t.validate(root(
				section(2, 'Decision', [h]),
			))
			assert.equal(infos(results)[0].node, h)
		})

		test('does not emit info when no description', () => {
			const t = template({
				children: [
					schema.section({
						name: 'Decision',
						level: 2,
						required: true,
						children: [md.heading(2)],
					}),
				],
			})

			const results = t.validate(root(
				section(2, 'Decision', [heading(2, 'Decision')]),
			))
			assert.isEmpty(infos(results))
		})

		test('emits info for heading with description', () => {
			const t = template({
				children: schema.strictOrder(
					md.heading(1, { description: 'The title of the document' }),
				),
			})

			const results = t.validate(root(heading(1, 'My Title')))
			assert.isEmpty(errors(results))
			assert.equal(infos(results).length, 1)
			assert.equal(infos(results)[0].message, 'The title of the document')
		})
	})
})
