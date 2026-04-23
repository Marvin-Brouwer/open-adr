import { getNodeText, schema } from '@md-schema/builder'

import type { Node } from 'unist'

export function matchSectionHeader(sectionName: string, expectedHeader: string) {
	return (node: Node) => {
		const text = getNodeText(node).trim()
		if (text !== expectedHeader) return schema.error(`The ${sectionName} section header expects "${expectedHeader}" (found "${text}")`)
	}
}
