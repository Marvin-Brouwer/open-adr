import { readFile } from 'node:fs/promises'
import path from 'node:path'

import Ajv, { type JSONSchemaType, type ValidateFunction } from 'ajv/dist/2020.js'
import { VFile } from 'vfile'

import { debug } from '../constants.mts'
import { checkFileIncluded } from '../files/file-include.mts'
import { getFrontMatterData, FrontMatterError } from '../helpers/front-matter.mts'
import { definePlugin, type RemarkPluginContext } from '../move-later/remark-plugin/plugin.mts'
import { getOdrSettings } from '../settings.mts'

const schemaKey = 'odr:schema' as const
// TODO add npm: protocol
const protocols = ['https', 'file'] as const

type SchemaProtocols = `${typeof protocols[number]}:`

interface OdrFileMetaData { [schemaKey]: string }

export const getSchemaData = (fileOrContext: VFile | RemarkPluginContext) => {
	const file = fileOrContext instanceof VFile ? fileOrContext : fileOrContext.file
	return file.data[schemaKey] as undefined | (OdrFileMetaData & {
		validator: ValidateFunction
	})
}

export const pluginName = 'remark-plugin:odr-schema-loader'
export default definePlugin({
	pluginName,
	async transform(context) {
		if (!checkFileIncluded(context)) return

		const { allowedSchemas } = getOdrSettings(context)

		const frontMatterSchema: JSONSchemaType<OdrFileMetaData> = {
			type: 'object',
			properties: {
				[schemaKey]: {
					type: 'string',
					title: 'Schema URL',
					errorMessage: 'schema url protocol only allows: https, or file.',
					// eslint-disable-next-line no-useless-escape
					pattern: `^(${protocols.map(p => `${p}:`).join('|')})\/\/`,
				},
			},
			required: [schemaKey],
			additionalProperties: true,
		}
		const frontMatterResult = await getFrontMatterData<OdrFileMetaData>(context.root, frontMatterSchema)
		if (frontMatterResult instanceof FrontMatterError) {
			context.appendError(frontMatterResult.yamlError.message, frontMatterResult.position)
			return
		}

		const schemaUrl = frontMatterResult[schemaKey]
		context.file.data[schemaKey] = {
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

			context.file.data[schemaKey] = {
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
			switch (url.protocol as SchemaProtocols) {
				case 'https:': {
					return loadWebSchema(url, context)
				}
				case 'file:': {
					return loadFileSchema(fileUrl(uri, dirname), context)
				}
				default: {
					return {}
				}
			}
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

	const errorData = await response.text()
	if (debug.logSchemaResolver) {
		context.writeTrace(response.status, errorData)
	}
	throw new Error('Unhandled web response', {
		cause: errorData,
	})
}

function fileUrl(uri: string, dirname: string) {
	return path.resolve(dirname, uri.replace('file://', ''))
}
async function loadFileSchema(uri: string, context: RemarkPluginContext) {
	if (debug.logSchemaResolver) context.writeTrace(uri)

	const fileContents: string = await readFile(uri, 'utf8')
	const fileJson = JSON.parse(fileContents.toString()) as Record<string, unknown>
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
