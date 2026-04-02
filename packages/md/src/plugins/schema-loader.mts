import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { definePlugin, type RemarkPluginContext } from '@md-schema/remark-plugin'
import { type JSONSchemaType } from 'ajv'

import { debug } from '../constants.mts'
import { checkFileIncluded } from '../files/file-include.mts'
import { getFrontMatterData, FrontMatterError } from '../helpers/front-matter.mts'
import { getMdSettings } from '../settings.mts'

import type { SchemaTemplate } from '@md-schema/builder'

export const mdSchemaKey = 'odr:schema' as const

export interface MdFileMetaData { [mdSchemaKey]: string }

export const pluginName = 'remark-plugin:md-schema-loader'
export default definePlugin({
	pluginName,
	async transform(context) {
		if (!checkFileIncluded(context)) return

		const { allowedSchemas } = getMdSettings(context)

		const frontMatterSchema: JSONSchemaType<MdFileMetaData> = {
			type: 'object',
			properties: {
				[mdSchemaKey]: {
					type: 'string',
					title: 'Schema identifier',
					errorMessage: 'schema identifier must be a non-empty string.',
				},
			},
			required: [mdSchemaKey],
			additionalProperties: true,
		}
		const frontMatterResult = await getFrontMatterData<MdFileMetaData>(context.root, frontMatterSchema)
		if (frontMatterResult instanceof FrontMatterError) {
			context.appendError(frontMatterResult.yamlError.message, frontMatterResult.position)
			return
		}

		const schemaUrl = frontMatterResult[mdSchemaKey]
		context.file.data[mdSchemaKey] = {
			schemaUrl,
		}

		if (allowedSchemas && allowedSchemas.length > 0 && !allowedSchemas.includes(schemaUrl)) {
			context.appendError(`Schema "${schemaUrl}" is not allowed. Allowed: ${allowedSchemas.join(', ')}`, frontMatterResult['@position'])
			return
		}

		const templateResult = await tryLoadTemplate(schemaUrl, path.join(context.file.cwd, context.file.dirname ?? '.'), context)
		if (templateResult instanceof Error) {
			context.appendError(
				templateResult.message,
				frontMatterResult['@position'],
				{
					stack: templateResult.stack,
					file: schemaUrl,
					cause: templateResult.cause,
				},
			)
			return
		}

		context.file.data[mdSchemaKey] = {
			schemaUrl,
			template: templateResult,
		}
	},
})

async function tryLoadTemplate(identifier: string, dirname: string, context: RemarkPluginContext): Promise<SchemaTemplate | Error> {
	try {
		return await loadTemplate(identifier, dirname, context)
	}
	catch (error) {
		return error as Error
	}
}

async function loadTemplate(identifier: string, dirname: string, context: RemarkPluginContext): Promise<SchemaTemplate> {
	let moduleUrl: string

	if (identifier.startsWith('file://')) {
		// Resolve relative file:// paths against the document's directory
		const filePath = path.resolve(dirname, identifier.replace('file://', ''))
		moduleUrl = pathToFileURL(filePath).href
	}
	else {
		// Bare specifier — rely on Node.js module resolution
		moduleUrl = identifier
	}

	if (debug.logSchemaResolver) context.writeTrace('loading template', moduleUrl)

	const imported = await import(moduleUrl) as Record<string, unknown>

	// Accept default export or named `template` export
	const template = (imported.default ?? imported.template) as SchemaTemplate | undefined
	if (!template || typeof template.validate !== 'function') {
		throw new Error(
			`Module "${identifier}" does not export a valid SchemaTemplate. Expected a default or named "template" export with a validate(root) method.`,
		)
	}

	if (debug.logSchemaResolver) context.writeTrace('loaded template', identifier)

	return template
}
