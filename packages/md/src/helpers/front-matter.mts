import Ajv, { type JSONSchemaType } from 'ajv'
import ajvErrors from 'ajv-errors'
import { isMap, isPair, isScalar, parseDocument, YAMLError } from 'yaml'

import { scan } from '../nodes/node-helper.mts'

import type { Literal, Position, Node } from 'unist'
import type { Document } from 'yaml'

const ajv = ajvErrors(new Ajv({ allErrors: true }))

export class FrontMatterError extends Error {
	constructor(
		public readonly yamlError: YAMLError,
		public readonly node: Node,
		public readonly position: Position,
	) {
		super('Couldn\'t read frontmatter data')
	}
}

export async function getFrontMatterData<T>(tree: Node, schema?: JSONSchemaType<T>) {
	const yamlNode = await getYamlNode(tree)
	if (!yamlNode?.value)
		return new FrontMatterError(
			new YAMLError('YAMLParseError', [0, 0], 'IMPOSSIBLE', 'No frontmatter data found'),
			tree,
			tree.position!,
		)
	if ((yamlNode.value as string).toString().trim() === '')
		return new FrontMatterError(
			new YAMLError('YAMLParseError', [0, 0], 'IMPOSSIBLE', 'No frontmatter data found'),
			yamlNode,
			yamlNode.position!,
		)

	try {
		const yamlDocument = parseDocument(yamlNode.value as string ?? '', {
			prettyErrors: true,
			strict: false,
		})
		const yamlResult = yamlDocument.toJS() as T & { '@position': Position, '@positions': Record<string, Position> }

		if (!yamlResult)
			return new FrontMatterError(
				new YAMLError('YAMLParseError', [0, 0], 'IMPOSSIBLE', 'No frontmatter data found'),
				yamlNode,
				yamlNode.position!,
			)

		yamlResult['@position'] = yamlNode.position!
		yamlResult['@positions'] = getKeyPositions(yamlDocument, yamlNode)

		if (!schema) return yamlResult

		const validate = ajv.compile(schema)

		if (!validate(yamlResult)) {
			// TODO map the error back to the actual position
			throw new Error(ajv.errorsText(validate.errors, {
				dataVar: 'meta-data',
			}))
		}

		return yamlResult
	}
	catch (error) {
		return new FrontMatterError(
			error as YAMLError,
			yamlNode,
			(error instanceof YAMLError)
				? getRelativePosition(yamlNode, error)
				: yamlNode.position!,
		)
	}
}

function getRelativePosition(tree: Node, error: YAMLError): Position {
	return {
		start: {
			column: (tree.position?.start.column ?? 1) - 1 + (error.linePos?.[0].col ?? 0),
			line: (tree.position?.start.line ?? 1) + (error.linePos?.[0].line ?? 0),
			offset: tree.position?.start.offset ?? 0,
		},
		end: {
			column: (tree.position?.start.column ?? 1) - 1 + (error.linePos?.[1]?.col ?? 0),
			line: (tree.position?.start.line ?? 1) + (error.linePos?.[1]?.line ?? 0),
			offset: tree.position?.start.offset ?? 0,
		},
	}
}

const getYamlNode = (tree: Node) => scan<Literal>(tree, 'yaml').then(nodes => nodes.length > 0 ? nodes[0] : undefined)

function getKeyPositions(document: Document, yamlNode: Literal): Record<string, Position> {
	const positions: Record<string, Position> = {}
	const contents = document.contents
	if (!isMap(contents)) return positions

	const yamlString = yamlNode.value as string
	// The yaml content starts on the line after the opening ---
	const contentStartLine = (yamlNode.position?.start.line ?? 1) + 1
	const contentStartOffset = (yamlNode.position?.start.offset ?? 0) + 4 // skip "---\n"

	for (const item of contents.items) {
		if (!isPair(item) || !isScalar(item.key) || !item.key.range) continue

		const key = String(item.key.value)
		const pairStart = item.key.range[0]
		const pairEnd = isScalar(item.value) && item.value.range
			? item.value.range[2]
			: item.key.range[2]

		positions[key] = {
			start: offsetToLinePos(yamlString, pairStart, contentStartLine, contentStartOffset),
			end: offsetToLinePos(yamlString, pairEnd, contentStartLine, contentStartOffset),
		}
	}

	return positions
}

function offsetToLinePos(
	string_: string,
	offset: number,
	baseStartLine: number,
	baseStartOffset: number,
): Position['start'] {
	let line = 0
	let lastNewline = -1
	for (let index = 0; index < offset && index < string_.length; index++) {
		if (string_[index] === '\n') {
			line++
			lastNewline = index
		}
	}
	return {
		line: baseStartLine + line,
		column: offset - lastNewline,
		offset: baseStartOffset + offset,
	}
}
