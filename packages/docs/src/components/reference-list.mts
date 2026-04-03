import { md, schema, getNodeText, getNodeChildren, isUrlLike } from '@md-schema/builder'

import { isNamedReference, isObjectReference } from '../helpers.mts'

export const referenceList = md.list({
	required: true,
	match(node) {
		const items = getNodeChildren(node, 'listItem')
		if (items.length === 0) return schema.error(
			'References must contain at least one list item',
		)

		for (const item of items) {
			const value = getNodeText(item).trim()
			if (!value) {
				return schema.error('Reference list items may not be empty')
			}

			if (isUrlLike(value)) continue
			if (isNamedReference(value)) continue
			if (isObjectReference(value)) continue

			return schema.error(
				'Reference entries must be one of: URL only, "label: URL", or object style with name/url(/notes)',
			)
		}
	},
})
