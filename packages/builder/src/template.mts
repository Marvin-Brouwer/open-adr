import { DescriptorKind } from './descriptor.mts'

import type { ParagraphDescriptor } from './md.mts'
import type {
	ChildrenDefinition,
	NodeDescriptor,
	StrictOrderDescriptor,
} from './schema.mts'
import type { Node, Parent } from 'unist'

export interface ValidationResult {
	node?: Node
	message: string
	severity: 'error' | 'warning'
}

export interface SchemaTemplate {
	validate(root: Parent): ValidationResult[]
}

export interface TemplateConfig {
	children: ChildrenDefinition
	ignoreTypes?: string[]
}

const DEFAULT_IGNORE_TYPES = ['definition', 'html']

export function template(config: TemplateConfig): SchemaTemplate {
	const ignoreTypes = config.ignoreTypes ?? DEFAULT_IGNORE_TYPES

	return {
		validate(root: Parent): ValidationResult[] {
			return validateChildren(config.children, root.children ?? [], ignoreTypes, root)
		},
	}
}

function filterIgnored(children: Node[], ignoreTypes: string[]): Node[] {
	return children.filter(child => !ignoreTypes.includes(child.type))
}

function validateChildren(
	childrenDefinition: ChildrenDefinition,
	astChildren: Node[],
	ignoreTypes: string[],
	parent: Node,
): ValidationResult[] {
	if (isStrictOrder(childrenDefinition)) {
		return validateStrictOrder(childrenDefinition.items, astChildren, ignoreTypes, parent)
	}
	return validateArray(childrenDefinition, astChildren, ignoreTypes, parent)
}

function isStrictOrder(definition: ChildrenDefinition): definition is StrictOrderDescriptor {
	return !Array.isArray(definition) && definition[DescriptorKind] === 'strictOrder'
}

function validateStrictOrder(
	descriptors: readonly NodeDescriptor[],
	astChildren: Node[],
	ignoreTypes: string[],
	parent: Node,
): ValidationResult[] {
	const results: ValidationResult[] = []
	const filtered = filterIgnored(astChildren, ignoreTypes)
	let childIndex = 0

	for (const descriptor of descriptors) {
		const kind = descriptor[DescriptorKind]

		if (kind === 'oneOrMore') {
			const { item } = descriptor
			let count = 0
			while (childIndex < filtered.length && nodeTypeMatches(item, filtered[childIndex])) {
				results.push(...validateSingleNode(item, filtered[childIndex], ignoreTypes))
				childIndex++
				count++
			}
			if (count === 0) {
				results.push({
					node: filtered[childIndex] ?? parent,
					message: `Expected at least one ${descriptorLabel(item)}`,
					severity: 'error',
				})
			}
			continue
		}

		if (hasOccurrenceRange(descriptor)) {
			const min = (descriptor as ParagraphDescriptor).minOccurrences ?? 0
			const max = (descriptor as ParagraphDescriptor).maxOccurrences ?? Infinity
			let count = 0
			while (childIndex < filtered.length && count < max && nodeTypeMatches(descriptor, filtered[childIndex])) {
				results.push(...validateSingleNode(descriptor, filtered[childIndex], ignoreTypes))
				childIndex++
				count++
			}
			if (count < min) {
				results.push({
					node: filtered[childIndex - 1] ?? parent,
					message: `Expected at least ${String(min)} ${descriptorLabel(descriptor)}(s), found ${String(count)}`,
					severity: 'error',
				})
			}
			continue
		}

		if (childIndex < filtered.length && nodeTypeMatches(descriptor, filtered[childIndex])) {
			results.push(...validateSingleNode(descriptor, filtered[childIndex], ignoreTypes))
			childIndex++
		}
		else if (isRequired(descriptor)) {
			results.push({
				node: filtered[childIndex] ?? parent,
				message: `Missing required ${descriptorLabel(descriptor)}`,
				severity: 'error',
			})
		}
	}

	while (childIndex < filtered.length) {
		results.push({
			node: filtered[childIndex],
			message: `Unexpected ${filtered[childIndex].type} node`,
			severity: 'warning',
		})
		childIndex++
	}

	return results
}

function validateArray(
	descriptors: NodeDescriptor[],
	astChildren: Node[],
	ignoreTypes: string[],
	parent: Node,
): ValidationResult[] {
	const results: ValidationResult[] = []
	const filtered = filterIgnored(astChildren, ignoreTypes)
	const matched = new Set<number>()

	for (const descriptor of descriptors) {
		const kind = descriptor[DescriptorKind]

		if (kind === 'oneOrMore') {
			const { item } = descriptor
			let count = 0
			for (const [index, element] of filtered.entries()) {
				if (!matched.has(index) && nodeTypeMatches(item, element) && nameMatches(item, element)) {
					results.push(...validateSingleNode(item, element, ignoreTypes))
					matched.add(index)
					count++
				}
			}
			if (count === 0) {
				results.push({
					node: parent,
					message: `Expected at least one ${descriptorLabel(item)}`,
					severity: 'error',
				})
			}
			continue
		}

		let found = false
		for (const [index, element] of filtered.entries()) {
			if (!matched.has(index) && nodeTypeMatches(descriptor, element) && nameMatches(descriptor, element)) {
				results.push(...validateSingleNode(descriptor, element, ignoreTypes))
				matched.add(index)
				found = true
				break
			}
		}
		if (!found && isRequired(descriptor)) {
			results.push({
				node: parent,
				message: `Missing required ${descriptorLabel(descriptor)}`,
				severity: 'error',
			})
		}
	}

	for (const [index, element] of filtered.entries()) {
		if (!matched.has(index)) {
			results.push({
				node: element,
				message: `Unexpected ${element.type} node`,
				severity: 'warning',
			})
		}
	}

	return results
}

function validateSingleNode(
	descriptor: NodeDescriptor,
	node: Node,
	ignoreTypes: string[],
): ValidationResult[] {
	const results: ValidationResult[] = []
	const kind = descriptor[DescriptorKind]

	if ('match' in descriptor && typeof descriptor.match === 'function') {
		const matchResult = descriptor.match(node)
		if (matchResult) {
			results.push({
				node,
				message: matchResult.message,
				severity: matchResult.severity,
			})
		}
	}

	if (kind === 'section') {
		const sec = descriptor
		const sectionChildren = 'children' in node && Array.isArray(node.children)
			? node.children as Node[]
			: []
		results.push(...validateChildren(sec.children, sectionChildren, ignoreTypes, node))
	}

	if (kind === 'list') {
		const desc = descriptor
		const listItems = 'children' in node && Array.isArray(node.children)
			? node.children as Node[]
			: []
		const count = listItems.length
		if (desc.minItems !== undefined && count < desc.minItems) {
			results.push({
				node,
				message: `List must have at least ${String(desc.minItems)} item(s), found ${String(count)}`,
				severity: 'error',
			})
		}
		if (desc.maxItems !== undefined && count > desc.maxItems) {
			results.push({
				node,
				message: `List must have at most ${String(desc.maxItems)} item(s), found ${String(count)}`,
				severity: 'error',
			})
		}
	}

	return results
}

function nodeTypeMatches(descriptor: NodeDescriptor, node: Node): boolean {
	const kind = descriptor[DescriptorKind]
	switch (kind) {
		case 'heading': {
			if (node.type !== 'heading') return false
			const desc = descriptor
			return 'depth' in node && node.depth === desc.level
		}
		case 'paragraph': {
			return node.type === 'paragraph'
		}
		case 'blockquote': {
			return node.type === 'blockquote'
		}
		case 'codeBlock': {
			if (node.type !== 'code') return false
			const desc = descriptor
			if (desc.language !== undefined && (!('lang' in node) || node.lang !== desc.language)) return false
			return true
		}
		case 'list': {
			if (node.type !== 'list') return false
			const desc = descriptor
			if (desc.ordered !== undefined && (!('ordered' in node) || node.ordered !== desc.ordered)) return false
			return true
		}
		case 'table': {
			return node.type === 'table'
		}
		case 'thematicBreak': {
			return node.type === 'thematicBreak'
		}
		case 'frontmatter': {
			return node.type === 'yaml'
		}
		case 'section': {
			if (node.type !== 'section') return false
			const sec = descriptor
			if (!('depth' in node) || node.depth !== sec.level) return false
			if (sec.name !== undefined && (!('name' in node) || node.name !== sec.name)) return false
			return true
		}
		case 'oneOrMore': {
			return false
		}
		default: {
			return false
		}
	}
}

function nameMatches(descriptor: NodeDescriptor, node: Node): boolean {
	const kind = descriptor[DescriptorKind]
	if (kind !== 'section') return true
	const sec = descriptor
	if (sec.name === undefined) return true
	return 'name' in node && node.name === sec.name
}

function hasOccurrenceRange(descriptor: NodeDescriptor): boolean {
	return 'minOccurrences' in descriptor || 'maxOccurrences' in descriptor
}

function isRequired(descriptor: NodeDescriptor): boolean {
	if ('required' in descriptor && descriptor.required === true) return true
	if ('optional' in descriptor && descriptor.optional === true) return false
	return true
}

function descriptorLabel(descriptor: NodeDescriptor): string {
	const kind = descriptor[DescriptorKind]
	switch (kind) {
		case 'heading': {
			return `heading (level ${String((descriptor).level)})`
		}
		case 'paragraph': {
			return 'paragraph'
		}
		case 'blockquote': {
			return 'blockquote'
		}
		case 'codeBlock': {
			return 'code block'
		}
		case 'list': {
			const desc = descriptor
			if (desc.ordered === true) return 'ordered list'
			if (desc.ordered === false) return 'unordered list'
			return 'list'
		}
		case 'table': {
			return 'table'
		}
		case 'thematicBreak': {
			return 'thematic break'
		}
		case 'frontmatter': {
			return 'frontmatter'
		}
		case 'section': {
			const sec = descriptor
			return sec.name ? `section "${sec.name}"` : `section (level ${String(sec.level)})`
		}
		case 'oneOrMore': {
			return descriptorLabel((descriptor).item)
		}
		default: {
			return 'unknown'
		}
	}
}
