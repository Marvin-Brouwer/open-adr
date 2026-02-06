import { checkFileIncluded } from '../files/file-include.mts'
import { type JsonPrimitive, trailJsonPath } from '../helpers/json-path.mts'
import { getSchemaData } from '../helpers/schema-data.mts'
import { definePlugin } from '../move-later/remark-plugin/plugin.mts'

import type { ErrorObject } from 'ajv'
import type { Literal, Node } from 'unist'

export const pluginName = 'remark-plugin:odr-schema-linter'
export default definePlugin({
	pluginName,
	async transform(context) {
		if (!checkFileIncluded(context)) return

		const schema = getSchemaData(context)
		if (!schema) throw new Error('No schema was present to lint, please check your plugin configuration.')

		const validationSuccess = schema.validator(context.root)
		console.log(context.file.path, validationSuccess ? 'valid' : 'invalid')

		if (!validationSuccess) {
			for (const validationError of schema.validator.errors ?? []) {
				const sourceTrail = trailJsonPath<Node>(context.root, validationError.instancePath)
				if (sourceTrail.length === 0) {
					context.appendError(`Invalid error state, tree does not contain ${validationError.instancePath}`)
					return
				}

				// We need an object, for the pos, so we take the parent if it's not an object.
				const sourceNode: Node | undefined
					= typeof sourceTrail[0] === 'object' && !Array.isArray(sourceTrail[0])
						? sourceTrail[0] as Node | undefined ?? undefined
						: sourceTrail[1] as Node | undefined ?? undefined

				const errorMessage = formatMessage(validationError, sourceTrail[0])

				context.appendError(errorMessage,
					sourceNode ?? context.root,
					{
						file: context.file.path,
						cause: validationError.message,
						stack: validationError.instancePath,
						expectedValues: getExpectedValues(validationError),
					})
			}
			console.log(context.file.path, context.file.messages)
		}

		await Promise.resolve()
		// TODO this is just a chatgpt barf where we validate our schema against the document.
		// However, it's probably more robust to convert the markdown into JSON and have ajv just validate that.
		// Maybe that'll make it hard to find back the document nodes later.
		// console.log(validate);
		// const isDataValid = ajv.validate(iceCreamSchema, iceCreamData);
		// TODO load schema
		// const activeSchemaPath = path.resolve(fileDir, schemaUrl!.toString());
		// let schema;
		// try { schema = JSON.parse(fs.readFileSync(activeSchemaPath, 'utf8')); }
		// catch (err) {
		// 	file.message(`Failed to load schema file: ${activeSchemaPath}\n${(err as Error).message}`, tree);
		// 	return;
		// }

		// type Heading = { level: number, text: string, node: HeadingNode; mustHaveList?: boolean; };
		// const headings: Heading[] = [];
		// visit(tree, 'heading', (node: HeadingNode) => {
		// 	const text = node.children.map(c => c.value).join('');
		// 	headings.push({ level: node.depth, text, node });
		// });

		// if (Array.isArray(schema.requiredHeadings)) {
		// 	schema.requiredHeadings.forEach((expected: Heading, i: number) => {
		// 		const actual = headings[i];
		// 		if (!actual) { file.message(`Missing heading "${expected.text}" (position ${i + 1})`, tree); return; }
		// 		if (actual.text !== expected.text) file.message(`Expected heading "${expected.text}" but found "${actual.text}"`, actual.node);
		// 		if (actual.level !== expected.level) file.message(`Heading "${actual.text}" should be level ${expected.level}`, actual.node);
		// 		if (expected.mustHaveList) {
		// 			const allNodes = tree.children;
		// 			const index = allNodes.indexOf(actual.node);
		// 			const next = allNodes[index + 1];
		// 			if (!next || next.type !== 'list') file.message(`Section "${expected.text}" must contain a bullet list`, actual.node);
		// 		}
		// 	});
		// }

		// file.info(`Validated against schema: ${path.basename(activeSchemaPath)}`, tree);
	},
})

function formatMessage(validationError: ErrorObject, value: Node | JsonPrimitive) {
	if (!validationError.message)
		return `Unknown error at ${validationError.instancePath}.`

	switch (validationError.keyword) {
		case 'const': {
			// This has to be string!
			const testedValue = (value as string | undefined)?.toString() ?? 'undefined'
			return `Expected absolute value of '${validationError.params.allowedValue}', got '${testedValue}' instead`
		}
		case 'additionalItems': {
			// This is an array of value nodes (TODO more testing)
			const elements = value as unknown as Literal[]
			const testedValue = elements.filter(v => v.value !== '<br />').length
			return `You provided more elements than the schema expects, expected '${validationError.params.limit}' elements, got '${testedValue}' instead`
		}
	}

	console.warn(validationError)
	return `Unknown error type '${validationError.keyword}' at ${validationError.instancePath}.`
}

function getExpectedValues(validationError: ErrorObject) {
	switch (validationError.keyword) {
		case 'const': {
			return [validationError.params.allowedValue as string]
		}
		case 'additionalItems': {
			return
		}
	}

	return
}
