import { getNodeText, asArray } from '@md-schema/builder'

import type { Node } from 'unist'

export const isNamedReference = (value: string): boolean => {
	// Find a ": URL" pattern, supporting labels with colons (e.g. "vscode: name: https://...")
	const match = value.match(/:\s+(https?:\/\/|\.{0,2}\/)/)
	return match !== null && match.index! > 0
}

export const isObjectReference = (value: string): boolean =>
	/(^|\n)\s*name:\s+/.test(value) && /(^|\n)\s*url:\s+/.test(value)

export const hasBlockquoteAndDismissal = (node: Node): boolean => {
	const body = asArray('children' in node && Array.isArray(node.children) ? node.children as Node[] : undefined)
		.filter(child => child.type !== 'heading')
	const hasBlockquote = body.some(child => child.type === 'blockquote')
	const hasParagraph = body.some(child => child.type === 'paragraph' && getNodeText(child).trim())
	return hasBlockquote && hasParagraph
}
