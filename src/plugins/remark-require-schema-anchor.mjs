import { visit } from 'unist-util-visit'
import micromatch from 'micromatch'
import { schemaTag } from '../constants.mjs'

/** @returns {typeof import('../../node_modules/unified/index').Transformer} */
export default function remarkRequireSchemaAnchor() {
/** @param {typeof import('../../node_modules/vfile/index').VFile} file */
  return (tree, file) => {
    const odrSettings = file.settings?.odr || {}
    const includePatterns = odrSettings.include || []

    const filePath = file.path || file.history?.[0] || ''
    if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return

    const schemaTags = []
    visit(tree, 'definition', node => {
      if (node.identifier?.toLowerCase() === schemaTag) schemaTags.push(node);
    })

    if (schemaTags.length === 0) {
      file.fail(`This file should include an [${schemaTag}] anchor.`, tree, {
				fatal: true
			});
    }
		const lastSchemaTag = schemaTags.at(-1);
    if (schemaTags.length > 1) {
			const redundantTags = schemaTags.slice(0, schemaTag.indexOf(lastSchemaTag));
      for (const tagNode of redundantTags) file.message(`This file contains more than one [${schemaTag}] anchor, please remove duplicates.`, tagNode);
      file.message(`This file contains more than one [${schemaTag}] anchor, using the last.`, lastSchemaTag);
    }
		const url = lastSchemaTag.url
		const error = validateUrl(url)
    if (error) {
      file.fail(`Invalid schema URL ${url}. \n ${error.message}`, lastSchemaTag);
    }
  }
}

function validateUrl(url) {
	try {
		new URL(url);
		return undefined
	} catch(ex) {
		return ex;
	}
}