import { getNodeText, asArray, isUrlLike } from '@md-schema/builder'

import type { Node } from 'unist'

export const isNamedReference = (value: string): boolean => {
	const index = value.indexOf(':')
	if (index <= 0) return false
	const rhs = value.slice(index + 1).trim()
	return isUrlLike(rhs)
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
