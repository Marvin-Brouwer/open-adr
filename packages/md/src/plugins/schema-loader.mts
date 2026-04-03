import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { definePlugin, type RemarkPluginContext } from '@md-schema/remark-plugin'
import { type JSONSchemaType } from 'ajv'

import { debug } from '../constants.mts'
import { checkFileIncluded } from '../files/file-include.mts'
import { getFrontMatterData, FrontMatterError } from '../helpers/front-matter.mts'
import { getMdSettings } from '../settings.mts'

import type { SchemaTemplate } from '@md-schema/builder'

export const mdSchemaKey = 'schema' as const

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
		const schemaPosition = frontMatterResult['@positions']?.[mdSchemaKey] ?? frontMatterResult['@position']
		context.file.data[mdSchemaKey] = {
			schemaUrl,
			schemaPosition,
		}

		if (allowedSchemas && allowedSchemas.length > 0 && !allowedSchemas.includes(schemaUrl)) {
			context.appendError(`Schema "${schemaUrl}" is not allowed. Allowed: ${allowedSchemas.join(', ')}`, schemaPosition)
			return
		}

		const { schemas } = getMdSettings(context)
		const resolved = resolveSchemaIdentifier(schemaUrl, schemas)
		if (resolved instanceof Error) {
			context.appendError(resolved.message, schemaPosition)
			return
		}

		const templateResult = await tryLoadTemplate(resolved, path.join(context.file.cwd, context.file.dirname ?? '.'), context)
		if (templateResult instanceof Error) {
			context.appendError(
				templateResult.message,
				schemaPosition,
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
			schemaPosition,
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

function resolveSchemaIdentifier(identifier: string, schemas: Record<string, string>): string | Error {
	// Schema identifiers must include a version: "name@version"
	if (!identifier.includes('@')) {
		const available = Object.keys(schemas)
		const suggestions = available.filter(k => k.split('@')[0] === identifier)
		const hint = suggestions.length > 0
			? ` Available versions: ${suggestions.join(', ')}`
			: ''
		return new Error(
			`Schema identifier "${identifier}" must include a version (e.g. "${identifier}@1").${hint}`,
		)
	}

	// Look up in the schemas map
	const npmSpecifier = schemas[identifier]
	if (!npmSpecifier) {
		const available = Object.keys(schemas)
		return new Error(
			`Unknown schema "${identifier}". Configure it in the schemas map.${available.length > 0 ? ` Available: ${available.join(', ')}` : ''}`,
		)
	}

	return npmSpecifier
}

async function loadTemplate(identifier: string, dirname: string, context: RemarkPluginContext): Promise<SchemaTemplate> {
	let moduleUrl: string

	if (identifier.startsWith('file://')) {
		// Resolve relative file:// paths against the document's directory
		const filePath = path.resolve(dirname, identifier.replace('file://', ''))
		if (!existsSync(filePath)) {
			throw new Error(`Schema file not found: "${filePath}"`)
		}
		moduleUrl = pathToFileURL(filePath).href
	}
	else if (identifier.startsWith('npm://')) {
		// Strip the npm:// prefix and resolve as an npm package
		const npmIdentifier = identifier.slice('npm://'.length)
		moduleUrl = resolveNpmModule(npmIdentifier, dirname)
	}
	else {
		throw new Error(
			`Schema target "${identifier}" must use a protocol prefix. Use "npm://" for npm packages or "file://" for local files.`,
		)
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

function resolveNpmModule(identifier: string, dirname: string): string {
	// Resolve from the document's directory so Node walks up the tree
	// to find the nearest node_modules with the package installed.
	const require = createRequire(path.join(dirname, '__resolve__.cjs'))
	const packageName = resolvePackageName(identifier)
	const subpath = identifier.slice(packageName.length)
	const packageJsonPath = require.resolve(`${packageName}/package.json`)
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
		return pathToFileURL(path.resolve(packageDir, importPath)).href
	}
	else if (subpath) {
		throw new Error(`Package "${packageName}" does not export subpath ".${subpath}"`)
	}
	else {
		return pathToFileURL(require.resolve(identifier)).href
	}
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
