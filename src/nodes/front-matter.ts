import Ajv, { JSONSchemaType } from 'ajv'
import AjvErrors from 'ajv-errors'
import { Literal, Position, Node } from 'unist'
import { YAMLError, parse as yamlParse } from 'yaml'

import { scan } from './node-helper'

const ajv = AjvErrors(new Ajv({ allErrors: true }))

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
	if (yamlNode.value.toString().trim() === '')
		return new FrontMatterError(
			new YAMLError('YAMLParseError', [0, 0], 'IMPOSSIBLE', 'No frontmatter data found'),
			yamlNode,
			yamlNode.position!,
		)

	try {
		const yamlResult = yamlParse(yamlNode.value as string ?? '', {
			prettyErrors: true,
			strict: false,
			// TODO use symbol instead
		}) as T & { '@position': Position }

		if (!yamlResult)
			return new FrontMatterError(
				new YAMLError('YAMLParseError', [0, 0], 'IMPOSSIBLE', 'No frontmatter data found'),
				yamlNode,
				yamlNode.position!,
			)
		// TODO get exact position of url
		yamlResult['@position'] = yamlNode.position!

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
				? getRelativePosition(yamlNode, error as YAMLError)
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
