import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
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
		// Bare specifier — resolve from the document's working directory
		// so that the consuming project's dependencies are used, not the md package's.
		const cwd = context.file.cwd
		const require = createRequire(path.join(cwd, '__resolve__.cjs'))
		const packageName = resolvePackageName(identifier)
		const subpath = identifier.slice(packageName.length)
		const packageJsonPath = require.resolve(path.join(packageName, 'package.json'))
		const packageDir = path.dirname(packageJsonPath)
		const packageJson = JSON.parse(
			readFileSync(packageJsonPath, 'utf-8'),
		) as { exports?: Record<string, { import?: string } | string> }

		const exportKey = subpath ? `.${subpath}` : '.'
		const exportEntry = packageJson.exports?.[exportKey]
		const importPath = typeof exportEntry === 'string'
			? exportEntry
			: exportEntry?.import

		if (importPath) {
			moduleUrl = pathToFileURL(path.resolve(packageDir, importPath)).href
		}
		else if (!subpath) {
			moduleUrl = pathToFileURL(require.resolve(identifier)).href
		}
		else {
			throw new Error(`Package "${packageName}" does not export subpath ".${subpath}"`)
		}
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

function resolvePackageName(identifier: string): string {
	if (identifier.startsWith('@')) {
		// Scoped package: @scope/name/subpath → @scope/name
		const parts = identifier.split('/')
		return parts.slice(0, 2).join('/')
	}
	// Unscoped package: name/subpath → name
	return identifier.split('/')[0]
}
