import { md, getNodeText, isUrlLike } from '@md-schema/builder'

import { isNamedReference, isObjectReference } from '../helpers.mts'

import type { Node } from 'unist'

export const referenceList = md.list({
	required: true,
	match(node) {
		const children = 'children' in node && Array.isArray(node.children)
			? node.children as Node[]
			: []
		const items = children.filter(child => child.type === 'listItem')
		if (items.length === 0) {
			return { severity: 'error', message: 'References must contain at least one list item' }
		}

		for (const item of items) {
			const value = getNodeText(item).trim()
			if (!value) {
				return { severity: 'error', message: 'Reference list items may not be empty' }
			}

			if (isUrlLike(value)) continue
			if (isNamedReference(value)) continue
			if (isObjectReference(value)) continue

			return {
				severity: 'error',
				message:
						'Reference entries must be one of: URL only, "label: URL", or object style with name/url(/notes)',
			}
		}
	},
})
