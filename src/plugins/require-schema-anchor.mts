import { visit } from 'unist-util-visit';
import micromatch from 'micromatch';

import { schemaTag } from '../constants.mts';
import { definePlugin } from '../plugin.mts';
import { DefinitionNode } from '../nodes.mts';
import { validateUrl } from '../helpers.mts';
import { createMessageWriter } from '../message-helper.mts';

const pluginName = 'remark-plugin-require-schema';
export default definePlugin(pluginName, (tree, file, settings) => {
	const odrSettings = settings?.odr || {};
	const includePatterns = odrSettings.include as string[] || [];

	const messageWriter = createMessageWriter(file);

	const filePath = file.path || file.history?.[0] || '';
	if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return;

	const schemaTags: DefinitionNode[] = [];
	visit(tree, 'definition', (node: DefinitionNode) => {
		if (node.identifier?.toLowerCase() === schemaTag) schemaTags.push(node);
	});

	if (schemaTags.length === 0) {
		messageWriter.error(`This file should include an [${schemaTag}] anchor.`, tree);
		return;
	}
	const lastSchemaTag = schemaTags.at(-1)!;
	if (schemaTags.length > 1) {
		const redundantTags = schemaTags.slice(0, schemaTags.indexOf(lastSchemaTag));
		for (const tagNode of redundantTags) messageWriter.warn(`This file contains more than one [${schemaTag}] anchor, please remove duplicates.`, tagNode);
		messageWriter.warn(`This file contains more than one [${schemaTag}] anchor, using the last.`, lastSchemaTag);
	}
	const urlString = lastSchemaTag.url;
	const [url, error] = validateUrl(urlString);
	if (error) {
		messageWriter.error(`Invalid schema URL ${urlString}. \n ${error.message}`, lastSchemaTag);
		return;
	}
	const schemaValid = validateProtocol(url!);
	if (!schemaValid) {
		messageWriter.error(`Invalid schema protocol ${urlString}. \n ${url.protocol} not supported`, lastSchemaTag);
	}
});

function validateProtocol(url: URL) {
	switch (url.protocol) {
		case 'https:': return true;
		case 'file:': return true;
	}
	return false;
}
