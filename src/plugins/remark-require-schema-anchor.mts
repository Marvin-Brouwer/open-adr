import { visit } from 'unist-util-visit'
import micromatch from 'micromatch'

import { schemaTag } from '../constants.mts'
import { plugin } from '../plugin.mts'
import { DefinitionNode } from '../nodes.mts'
import { validateUrl } from '../helpers.mts'

export default plugin((tree, file) => {
	const odrSettings = file.settings?.odr || {}
	const includePatterns = odrSettings.include || []

	const filePath = file.path || file.history?.[0] || ''
	if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return

	const schemaTags: DefinitionNode[] = []
	visit(tree, 'definition', (node: DefinitionNode) => {
		if (node.identifier?.toLowerCase() === schemaTag) schemaTags.push(node);
	})

	if (schemaTags.length === 0) {
		file.fail(new Error(`This file should include an [${schemaTag}] anchor.`), tree.position!);
	}
	const lastSchemaTag = schemaTags.at(-1)!;
	if (schemaTags.length > 1) {
		const redundantTags = schemaTags.slice(0, schemaTags.indexOf(lastSchemaTag));
		for (const tagNode of redundantTags) file.message(`This file contains more than one [${schemaTag}] anchor, please remove duplicates.`, tagNode);
		file.message(`This file contains more than one [${schemaTag}] anchor, using the last.`, lastSchemaTag);
	}
	const url = lastSchemaTag.url
	const [,error] = validateUrl(url)
	if (error) {
		file.fail(`Invalid schema URL ${url}. \n ${error.message}`, lastSchemaTag);
	}
})