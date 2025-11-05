import { readFile } from 'node:fs/promises'
import path from 'node:path'

import Ajv, { JSONSchemaType } from 'ajv/dist/2020.js'

import { debug } from '../constants.mts'
import { checkFileIncluded } from '../files/file-include.mts'
import { getFrontMatterData, FrontMatterError } from '../nodes/front-matter'
import { definePlugin, RemarkPluginContext } from '../plugin.mts'
import { getOdrSettings } from '../settings.mts'

interface OdrFileMetaData { 'odr:schema': string }

const pluginName = 'remark-plugin:odr-schema-loader'
export default definePlugin({
	pluginName,
	async transform(context) {
		if (!checkFileIncluded(context)) return

		const { allowedSchemas } = getOdrSettings(context)

		const frontMatterSchema: JSONSchemaType<OdrFileMetaData> = {
			type: 'object',
			properties: {
				// TODO add npm: protocol
				'odr:schema': {
					type: 'string',
					title: 'Schema URL',
					errorMessage: 'schema url protocol only allows: https, or file.',
					// eslint-disable-next-line no-useless-escape
					pattern: '^(https:|file:)\/\/',
				},
			},
			required: ['odr:schema'],
			additionalProperties: true,
		}
		const frontMatterResult = await getFrontMatterData<OdrFileMetaData>(context.root, frontMatterSchema)
		if (frontMatterResult instanceof FrontMatterError) {
			context.appendError(frontMatterResult.yamlError.message, frontMatterResult.position)
			return
		}

		const schemaUrl = frontMatterResult['odr:schema']
		context.file.data['odr:schema'] = {
			schemaUrl,
		}

		if (allowedSchemas && allowedSchemas.length > 0 && !allowedSchemas.includes(schemaUrl)) {
			context.appendError(`Schema "${schemaUrl}" is not allowed. Allowed: ${allowedSchemas.join(', ')}`, frontMatterResult['@position'])
			return
		}

		const schemaValue = await tryLoadSchema(schemaUrl, path.join(context.file.cwd, context.file.dirname ?? '.'), context)
		if (schemaValue instanceof Error) {
			const [primaryError, additionalContext] = schemaValue.message.split(', "')
			context.appendError(
				primaryError,
				frontMatterResult['@position'],
				{
					stack: primaryError
						+ `\n  at JSON.parse (${schemaUrl})`,
					file: schemaUrl,
					cause: additionalContext ?? ''
						.replaceAll('\n', String.raw`\n`)
						.replaceAll('\r', String.raw`\r`)
						.replaceAll('\t', String.raw`\t`),
					note: '  '
						+ (additionalContext ?? '')
							.replaceAll('\n', String.raw`\n`)
							.replaceAll('\r', String.raw`\r`)
							.replaceAll('\t', String.raw`\t`)
						+ `\n  at JSON.parse (${schemaUrl})`,
				},
			)
			return
		}
		const ajv = createValidator(path.join(context.file.cwd, context.file.dirname ?? '.'), context)

		try {
			const validator = await ajv.compileAsync(schemaValue)

			context.file.data['odr:schema'] = {
				schemaUrl,
				validator,
			}
		}
		catch (error_) {
			const error = error_ as Error

			context.appendError(
				'Failed to load schema',
				frontMatterResult['@position'],
				{
					cause: error.message,
					stack: error.stack,
					file: schemaUrl,
				},
			)
		}
	},
})

async function tryLoadSchema(uri: string, dirname: string, context: RemarkPluginContext) {
	try {
		return await loadSchema(dirname, context)(uri)
	}
	catch (error) {
		return error as Error
	}
}

function loadSchema(dirname: string, context: RemarkPluginContext) {
	return async (uri: string) => {
		// Skip meta schemas
		if (uri.startsWith('https://json-schema.org/draft/')) return {}
		if (uri.startsWith('http://json-schema.org/draft/')) return {}

		try {
			const url = new URL(uri)
			// TODO add npm: protocol
			switch (url.protocol) {
				case 'https:': {
					return loadWebSchema(url, context)
				}
				case 'file:': {
					return loadFileSchema(fileUrl(uri, dirname), context)
				}
			}
			return {}
		}
		catch {
			return {}
		}
	}
}

async function loadWebSchema(uri: URL, context: RemarkPluginContext) {
	const response = await fetch(uri)
	if (debug.logSchemaResolver) context.writeTrace(uri)
	if (response.ok) {
		const json = await response.json() as Record<string, unknown>
		if (debug.logSchemaResolver) context.writeTrace(response.status, json)

		// Infinite loop fix
		if (!json.$id) {
			json.$id = uri.toString()
		}
		return json
	}
	if (debug.logSchemaResolver) context.writeTrace(response.status, await response.text())
	return response.json()
}

function fileUrl(uri: string, dirname: string) {
	return path.resolve(dirname, uri.replace('file://', ''))
}
async function loadFileSchema(uri: string, context: RemarkPluginContext) {
	if (debug.logSchemaResolver) context.writeTrace(uri)

	const fileContents = await readFile(uri)
	const fileJson = JSON.parse(fileContents.toString())
	// Remove the $id when traversing file system, otherwise the loader will open the web
	fileJson['$id'] = undefined
	return fileJson
}

function createValidator(dirname: string, context: RemarkPluginContext) {
	// TODO use strict
	const ajv = new Ajv({ loadSchema: loadSchema(dirname, context), strict: false })
		// TODO figure out why these are in spec but still "unkown keyword"
		// Also only seems to happen when using https of the same schema :S
		.addKeyword({
			keyword: 'order',
			modifying: false,
			schemaType: ['number'],
			validate: () => true,
		})

	return ajv
}
