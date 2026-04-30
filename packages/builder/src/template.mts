import { DescriptorKind, type BaseDescriptorOptions } from './descriptor.mts'

import type { FmObjectDescriptor } from './fm.mts'
import type { CodeBlockDescriptor, FrontmatterDescriptor, ParagraphDescriptor } from './md.mts'
import type {
	ChildrenDefinition,
	NodeDescriptor,
	SectionDescriptor,
	StrictOrderDescriptor,
} from './schema.mts'
import type { Node, Parent } from 'unist'

export interface ValidationResult {
	node?: Node
	message: string
	severity: 'error' | 'warning' | 'info'
	url?: string
}

export interface ValidationContext {
	validateYamlContent?: (node: Node, fields: FmObjectDescriptor) => ValidationResult[]
}

export interface SchemaTemplate {
	validate(root: Parent, context?: ValidationContext): ValidationResult[]
	readonly frontmatterDescriptor?: FrontmatterDescriptor
}

export interface TemplateConfig {
	children: ChildrenDefinition
	ignoreTypes?: string[]
}

const DEFAULT_IGNORE_TYPES = ['definition', 'html']

export function template(config: TemplateConfig): SchemaTemplate {
	const ignoreTypes = config.ignoreTypes ?? DEFAULT_IGNORE_TYPES

	return {
		validate(root: Parent, context?: ValidationContext): ValidationResult[] {
			return validateChildren(config.children, root.children ?? [], ignoreTypes, root, context)
		},
		frontmatterDescriptor: findFrontmatterDescriptor(config.children),
	}
}

function findFrontmatterDescriptor(children: ChildrenDefinition): FrontmatterDescriptor | undefined {
	const items = isStrictOrder(children) ? children.items : (children as NodeDescriptor[])
	return items.find(
		(d): d is FrontmatterDescriptor =>
			d[DescriptorKind] === 'frontmatter' && 'fields' in d && d.fields !== undefined,
	)
}

function filterIgnored(children: Node[], ignoreTypes: string[]): Node[] {
	return children.filter(child => !ignoreTypes.includes(child.type))
}

function validateChildren(
	childrenDefinition: ChildrenDefinition,
	astChildren: Node[],
	ignoreTypes: string[],
	parent: Node,
	context?: ValidationContext,
): ValidationResult[] {
	if (isStrictOrder(childrenDefinition)) {
		return validateStrictOrder(childrenDefinition.items, astChildren, ignoreTypes, parent, context)
	}
	return validateArray(childrenDefinition, astChildren, ignoreTypes, parent, context)
}

function isStrictOrder(definition: ChildrenDefinition): definition is StrictOrderDescriptor {
	return !Array.isArray(definition) && definition[DescriptorKind] === 'strictOrder'
}

function validateStrictOrder(
	descriptors: readonly NodeDescriptor[],
	astChildren: Node[],
	ignoreTypes: string[],
	parent: Node,
	context?: ValidationContext,
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
				results.push(...validateSingleNode(item, filtered[childIndex], ignoreTypes, context))
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
				results.push(...validateSingleNode(descriptor, filtered[childIndex], ignoreTypes, context))
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

		if (kind === 'sectionMap') {
			const { sections } = descriptor
			results.push(...validateSectionMap(sections, filtered.slice(childIndex), ignoreTypes, parent, context))
			childIndex = filtered.length
			continue
		}

		if (childIndex < filtered.length && nodeTypeMatches(descriptor, filtered[childIndex])) {
			results.push(...validateSingleNode(descriptor, filtered[childIndex], ignoreTypes, context))
			childIndex++
		}
		else if (isRequired(descriptor)) {
			results.push({
				node: filtered[childIndex] ?? parent,
				message: getMissingMessage(descriptor),
				severity: 'error',
			})
		}
	}

	while (childIndex < filtered.length) {
		results.push({
			node: filtered[childIndex],
			message: `Unexpected ${unexpectedNodeLabel(filtered[childIndex])}`,
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
	context?: ValidationContext,
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
					results.push(...validateSingleNode(item, element, ignoreTypes, context))
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
				results.push(...validateSingleNode(descriptor, element, ignoreTypes, context))
				matched.add(index)
				found = true
				break
			}
		}
		if (!found && isRequired(descriptor)) {
			results.push({
				node: parent,
				message: getMissingMessage(descriptor),
				severity: 'error',
			})
		}
	}

	for (const [index, element] of filtered.entries()) {
		if (!matched.has(index)) {
			results.push({
				node: element,
				message: `Unexpected ${unexpectedNodeLabel(element)}`,
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
	context?: ValidationContext,
): ValidationResult[] {
	const results: ValidationResult[] = []
	const kind = descriptor[DescriptorKind]

	if ('description' in descriptor && typeof descriptor.description === 'string') {
		const headingNode = kind === 'section'
			&& 'children' in node && Array.isArray(node.children)
			? (node.children as Node[]).find(child => child.type === 'heading')
			: undefined

		results.push({
			node: headingNode ?? node,
			message: descriptor.description,
			severity: 'info',
			...('url' in descriptor && typeof descriptor.url === 'string' ? { url: descriptor.url } : {}),
		})
	}

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
		results.push(...validateChildren(sec.children, sectionChildren, ignoreTypes, node, context))
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

	if ((kind === 'frontmatter' || kind === 'codeBlock') && context?.validateYamlContent) {
		const fields = (descriptor as CodeBlockDescriptor).fields
		if (fields) results.push(...context.validateYamlContent(node, fields))
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
		case 'sectionMap': {
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
	if ('required' in descriptor) return descriptor.required !== false
	return true
}

function descriptorLabel(descriptor: NodeDescriptor): string {
	const name = (descriptor as Partial<BaseDescriptorOptions>).name
	const kind = descriptor[DescriptorKind]
	switch (kind) {
		case 'heading': {
			return name ?? `heading (level ${String((descriptor).level)})`
		}
		case 'paragraph': {
			return name ?? 'paragraph'
		}
		case 'blockquote': {
			return name ?? 'blockquote'
		}
		case 'codeBlock': {
			return name ? `"${name}" code block` : 'code block'
		}
		case 'list': {
			if (name) return name
			const desc = descriptor
			if (desc.ordered === true) return 'ordered list'
			if (desc.ordered === false) return 'unordered list'
			return 'list'
		}
		case 'table': {
			return name ?? 'table'
		}
		case 'thematicBreak': {
			return name ?? 'thematic break'
		}
		case 'frontmatter': {
			return name ?? 'frontmatter'
		}
		case 'section': {
			return name ? `section "${name}"` : `section (level ${String((descriptor).level)})`
		}
		case 'oneOrMore': {
			return descriptorLabel((descriptor).item)
		}
		case 'sectionMap': {
			return name ?? 'section map'
		}
		default: {
			return name ?? 'unknown'
		}
	}
}

function getMissingMessage(descriptor: NodeDescriptor): string {
	const missingFunction = (descriptor as Partial<BaseDescriptorOptions>).missingErrorMessage
	if (typeof missingFunction === 'function') return missingFunction.call(descriptor as BaseDescriptorOptions)
	return `Missing required ${descriptorLabel(descriptor)}`
}

function unexpectedNodeLabel(node: Node): string {
	if (node.type === 'section' && 'name' in node && typeof node.name === 'string') {
		return `section "${node.name}"`
	}
	return `${node.type} node`
}

function sectionHeading(node: Node): Node {
	if (node.type !== 'section') return node
	const heading = ('children' in node && Array.isArray(node.children))
		? (node.children as Node[]).find(c => c.type === 'heading')
		: undefined
	return heading ?? node
}

function validateSectionMap(
	sections: readonly SectionDescriptor[],
	nodes: Node[],
	ignoreTypes: string[],
	parent: Node,
	context?: ValidationContext,
): ValidationResult[] {
	const results: ValidationResult[] = []
	const consumed = new Set<number>()
	const matches: Array<{ sec: SectionDescriptor, nodeIndex: number }> = []

	for (const sec of sections) {
		const secName = sec.name
		const matchIndex = nodes.findIndex(
			(n, nodeIndex) => !consumed.has(nodeIndex)
				&& n.type === 'section'
				&& 'name' in n
				&& typeof n.name === 'string'
				&& n.name === secName,
		)
		if (matchIndex !== -1) {
			consumed.add(matchIndex)
			matches.push({ sec, nodeIndex: matchIndex })
			results.push(...validateSingleNode(sec, nodes[matchIndex], ignoreTypes, context))
		}
		else if (isRequired(sec)) {
			const next = nodes.find((node, nodeIndex) => !consumed.has(nodeIndex) && node.type === 'section')
			results.push({
				node: next === undefined ? parent : sectionHeading(next),
				message: getMissingMessage(sec),
				severity: 'error',
			})
		}
	}

	let lastNodeIndex = -1
	for (const { sec, nodeIndex } of matches) {
		if (nodeIndex < lastNodeIndex) {
			results.push({
				node: sectionHeading(nodes[nodeIndex]),
				message: `Section "${sec.name ?? 'unknown'}" is out of order`,
				severity: 'warning',
			})
		}
		else {
			lastNodeIndex = nodeIndex
		}
	}

	for (const [nodeIndex, node] of nodes.entries()) {
		if (!consumed.has(nodeIndex)) {
			results.push({
				node: sectionHeading(node),
				message: `Unexpected ${unexpectedNodeLabel(node)}`,
				severity: 'warning',
			})
		}
	}

	return results
}
