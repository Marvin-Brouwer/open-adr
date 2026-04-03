import { getNodeText, getNodeChildren } from '@md-schema/builder'

import { guideHost, guideVersion } from './constants.mts'

import type { Node } from 'unist'

export const isNamedReference = (value: string): boolean => {
	// Find a ": URL" pattern, supporting labels with colons (e.g. "vscode: name: https://...")
	const match = value.match(/:\s+(https?:\/\/|\.{0,2}\/)/)
	return match !== null && match.index! > 0
}

export const isObjectReference = (value: string): boolean =>
	/(^|\n)\s*name:\s+/.test(value) && /(^|\n)\s*url:\s+/.test(value)

export const hasBlockquoteAndDismissal = (node: Node): boolean => {
	const body = getNodeChildren(node).filter(child => child.type !== 'heading')
	const hasBlockquote = body.some(child => child.type === 'blockquote')
	const hasParagraph = body.some(child => child.type === 'paragraph' && getNodeText(child).trim())
	return hasBlockquote && hasParagraph
}

export const multiline = (...lines: string[]) => lines.join('\n')

export const guideUrl = (shortcut: string) =>
	(section?: string) => `${guideHost}/${shortcut}/${guideVersion}/`
		+ (section ? `#${section.toLowerCase().replaceAll(/\s+/g, '-')}` : '')
