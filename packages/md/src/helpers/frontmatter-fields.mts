import { compileFmSchema, FmKind } from '@md-schema/builder'
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import { parseDocument } from 'yaml'

import { getYamlKeyPositions, getYamlValuePosition } from './front-matter.mts'

import type { Contributors } from '../settings.mts'
import type {
	FmEnumDescriptor,
	FmItemDescriptor,
	FmObjectDescriptor,
	FmSchemaOptions, ValidationResult,
} from '@md-schema/builder'
import type { ErrorObject } from 'ajv'
import type { Literal, Node, Parent } from 'unist'

const ajv = addFormats(new Ajv({ allErrors: true }))

export function validateYamlContent(
	node: Node,
	fields: FmObjectDescriptor,
	contributors: Contributors | undefined,
	filePath?: string,
): ValidationResult[] {
	const literal = node as Literal
	if (typeof literal.value !== 'string' || !literal.value) return []

	const contentSkip = getContentSkip(node)
	const results: ValidationResult[] = []

	const yamlDocument = (() => {
		try {
			return parseDocument(literal.value)
		}
		catch {
			return
		}
	})()
	if (!yamlDocument) return results

	// Warn when fm.contributors() is used but no contributors are configured
	if (!contributors?.who.length) {
		const contributorKeys = findContributorKeys(fields)
		if (contributorKeys.length > 0) {
			const keyPositions = getYamlKeyPositions(yamlDocument, literal, contentSkip)
			for (const key of contributorKeys) {
				const position = keyPositions[key]
				results.push({
					node: position ? { type: node.type, position } as Node : node,
					message: `"${key}" values cannot be validated: no contributors configured in mdSettings`,
					severity: 'warning',
				})
			}
		}
	}

	const data: unknown = yamlDocument.toJS()
	if (!data || typeof data !== 'object') return results

	const options: FmSchemaOptions = { contributorSlugs: contributors?.who.map(c => c.slug) }
	const jsonSchema = compileFmSchema(fields, options)
	const validate = ajv.compile(jsonSchema)
	if (!validate(data)) {
		results.push(...(validate.errors ?? []).map((error) => {
			const position = error.instancePath
				? getYamlValuePosition(yamlDocument, literal, contentSkip, error.instancePath)
				: undefined
			const descriptor = resolveDescriptor(fields, error.instancePath)
			const value = getValueAtPath(data, error.instancePath)
			const { message, expectedValues } = buildErrorMessage(error, descriptor, value)
			return {
				node: position ? { type: node.type, position } as Node : node,
				message,
				severity: 'error' as const,
				...(expectedValues ? { expectedValues } : {}),
			}
		}))
	}

	// Validate contributors fields with a single field-level error using source
	if (contributors?.who.length) {
		const slugs = new Set(contributors.who.map(c => c.slug))
		for (const [key, rawDescriptor] of Object.entries(fields.properties)) {
			const descriptor = unwrapOptional(rawDescriptor)
			if (descriptor[FmKind] !== 'contributors') continue

			const fieldValue = (data as Record<string, unknown>)[key]
			if (!Array.isArray(fieldValue)) continue

			for (const [index, slug] of fieldValue.entries()) {
				if (typeof slug !== 'string' || slugs.has(slug)) continue
				const position = getYamlValuePosition(yamlDocument, literal, contentSkip, `/${key}/${index}`)
				results.push({
					node: position ? { type: node.type, position } as Node : node,
					message: `"${slug}" is not a valid contributor (source: ${contributors.source})`,
					severity: 'error',
					expectedValues: contributors.who.map(c => c.slug),
				})
			}
		}
	}

	// Run custom field validators
	for (const [key, rawDescriptor] of Object.entries(fields.properties)) {
		const descriptor = unwrapOptional(rawDescriptor)
		if (descriptor[FmKind] !== 'custom') continue
		const customDesc = descriptor
		if (!customDesc.validate) continue

		const fieldValue = (data as Record<string, unknown>)[key]
		if (fieldValue === undefined) continue

		const message = customDesc.validate(fieldValue, { filePath: filePath ?? '' })
		if (!message) continue

		const position = getYamlValuePosition(yamlDocument, literal, contentSkip, `/${key}`)
		results.push({
			node: position ? { type: node.type, position } as Node : node,
			message,
			severity: 'error',
		})
	}

	return results
}

export function validateFrontmatterFields(
	root: Parent,
	fields: FmObjectDescriptor,
	contributors: Contributors | undefined,
): ValidationResult[] {
	const yamlNode = root.children.find(c => c.type === 'yaml')
	if (!yamlNode) return []
	return validateYamlContent(yamlNode, fields, contributors)
}

function unwrapOptional(descriptor: FmItemDescriptor): FmItemDescriptor {
	if (descriptor[FmKind] === 'optional') return (descriptor).item
	return descriptor
}

function resolveDescriptor(fields: FmObjectDescriptor, instancePath: string): FmItemDescriptor | undefined {
	const parts = instancePath.replace(/^\//, '').split('/').filter(Boolean)
	if (parts.length === 0) return undefined

	let current: FmItemDescriptor | undefined = fields.properties[parts[0]]
	for (let index = 1; index < parts.length; index++) {
		if (!current) return undefined
		const unwrapped = unwrapOptional(current)
		if (unwrapped[FmKind] === 'list') {
			current = (unwrapped).item
		}
		else {
			return undefined
		}
	}
	return current ? unwrapOptional(current) : undefined
}

function tryFormatDate(value: string): string | undefined {
	try {
		const date = new Date(value)
		if (Number.isNaN(date.getTime())) return undefined
		return date.toISOString().slice(0, 10)
	}
	catch {
		return undefined
	}
}

function getValueAtPath(data: unknown, instancePath: string): unknown {
	if (!instancePath) return undefined
	const parts = instancePath.slice(1).split('/')
	let current: unknown = data
	for (const part of parts) {
		if (current === null || typeof current !== 'object') return undefined
		current = (current as Record<string, unknown>)[part]
	}
	return current
}

function buildErrorMessage(
	error: ErrorObject,
	descriptor: FmItemDescriptor | undefined,
	value?: unknown,
): { message: string, expectedValues?: string[] } {
	const field = error.instancePath.replace(/^\//, '').replaceAll('/', '.')

	if (descriptor?.[FmKind] === 'enum') {
		const enumDesc = descriptor as FmEnumDescriptor
		if (enumDesc.message) return {
			message: enumDesc.message(enumDesc.values),
			expectedValues: [...enumDesc.values],
		}
	}

	switch (error.keyword) {
		case 'enum': {
			const allowed = (error.params as { allowedValues: unknown[] }).allowedValues
			return {
				message: `The "${field}" field may only contain one of: ${allowed.map(v => `"${String(v)}"`).join(', ')}`,
				expectedValues: allowed.map(String),
			}
		}
		case 'type': {
			const expected = (error.params as { type: string }).type
			if (expected === 'boolean') {
				return {
					message: `The "${field}" field must be a boolean`,
					expectedValues: ['true', 'false'],
				}
			}
			break
		}
		case 'format': {
			const fmt = String((error.params as { format: string }).format)
			if (fmt === 'date') {
				const formatted = typeof value === 'string' ? tryFormatDate(value) : undefined
				return {
					message: `The "${field}" field must be a valid date (YYYY-MM-DD)`,
					...(formatted ? { expectedValues: [formatted] } : {}),
				}
			}
			return { message: `The "${field}" field must match format "${fmt}"` }
		}
		case 'required': {
			const missing = String((error.params as { missingProperty: string }).missingProperty)
			return { message: `The "${missing}" field is required` }
		}
	}

	return {
		message: field
			? `The "${field}" field ${error.message ?? 'is invalid'}`
			: error.message ?? 'Invalid value',
	}
}

function getContentSkip(node: Node): number {
	if (node.type === 'yaml') return 4
	const lang = ('lang' in node && typeof (node as { lang?: unknown }).lang === 'string')
		? (node as { lang: string }).lang
		: ''
	return 3 + lang.length + 1
}

function findContributorKeys(descriptor: FmObjectDescriptor): string[] {
	return Object.entries(descriptor.properties)
		.filter(([, d]) => usesContributors(d))
		.map(([key]) => key)
}

function usesContributors(descriptor: FmItemDescriptor): boolean {
	const unwrapped = unwrapOptional(descriptor)
	const kind = unwrapped[FmKind]
	if (kind === 'contributors') return true
	if (kind === 'list') return usesContributors((unwrapped).item)
	return false
}
