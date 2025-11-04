import fs from 'fs';
import path from 'path';
import { visit } from 'unist-util-visit';
import micromatch from 'micromatch';
import Ajv from 'ajv';

import { debug, schemaTag } from '../constants.mts';
import { definePlugin } from '../plugin.mts';
import { DefinitionNode, HeadingNode } from '../nodes.mts';
import { validateUrl } from '../helpers.mts';
import { readFile } from 'fs/promises';

const ajv = createValidator();

const pluginName = 'remark-plugin-lint-schema';
export default definePlugin(pluginName, async (tree, file, settings) => {
	const odrSettings = settings.odr || {};
	const allowedSchemas = odrSettings.allowedSchemas as string[] || [];
	const includePatterns = odrSettings.include as string[] || [];

	const filePath = file.path || file.history?.[0] || '';
	const fileDir = path.dirname(filePath);

	if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) {
		if (debug.logAllFilePatternMismatch) console.warn('File doesn\'t match pattern', includePatterns, filePath);
		return;
	}

	let schemaRefNode: DefinitionNode | undefined;
	visit(tree, 'definition', (node: DefinitionNode) => {
		if (node.identifier?.toLowerCase() === schemaTag) {
			schemaRefNode = node;
		}
	});

	if (!schemaRefNode?.url) return;
	const [schemaUrl, error] = validateUrl(schemaRefNode?.url);
	// We don't need to throw, the require schema will.
	if (error) return;

	if (allowedSchemas.length > 0) {
		if (!allowedSchemas.includes(schemaRefNode?.url)) {
			file.message(`Schema "${schemaUrl}" is not allowed. Allowed: ${allowedSchemas.join(', ')}`, schemaRefNode);
			return;
		}
	}

	const validate = await ajv.compileAsync({
		$ref: schemaUrl!.toString()
	});
	// TODO this is just a chatgpt barf where we validate our schema against the document.
	// However, it's probably more robust to convert the markdown into JSON and have ajv just validate that.
	// Maybe that'll make it hard to find back the document nodes later.
	console.log(validate);
	// const isDataValid = ajv.validate(iceCreamSchema, iceCreamData);
	// TODO load schema
	const activeSchemaPath = path.resolve(fileDir, schemaUrl!.toString());
	let schema;
	try { schema = JSON.parse(fs.readFileSync(activeSchemaPath, 'utf8')); }
	catch (err) {
		file.message(`Failed to load schema file: ${activeSchemaPath}\n${(err as Error).message}`, tree);
		return;
	}

	type Heading = { level: number, text: string, node: HeadingNode; mustHaveList?: boolean; };
	const headings: Heading[] = [];
	visit(tree, 'heading', (node: HeadingNode) => {
		const text = node.children.map(c => c.value).join('');
		headings.push({ level: node.depth, text, node });
	});

	if (Array.isArray(schema.requiredHeadings)) {
		schema.requiredHeadings.forEach((expected: Heading, i: number) => {
			const actual = headings[i];
			if (!actual) { file.message(`Missing heading "${expected.text}" (position ${i + 1})`, tree); return; }
			if (actual.text !== expected.text) file.message(`Expected heading "${expected.text}" but found "${actual.text}"`, actual.node);
			if (actual.level !== expected.level) file.message(`Heading "${actual.text}" should be level ${expected.level}`, actual.node);
			if (expected.mustHaveList) {
				const allNodes = tree.children;
				const index = allNodes.indexOf(actual.node);
				const next = allNodes[index + 1];
				if (!next || next.type !== 'list') file.message(`Section "${expected.text}" must contain a bullet list`, actual.node);
			}
		});
	}

	file.info(`Validated against schema: ${path.basename(activeSchemaPath)}`, tree);
});

async function loadSchema(uri: string) {
	// Skip meta schemas
	if (uri.startsWith('https://json-schema.org/draft/')) return {};
	if (uri.startsWith('http://json-schema.org/draft/')) return {};

	const url = new URL(uri);

	switch (url.protocol) {
		case 'https:': return loadWebSchema(url);
		case 'file:': return loadFileSchema(url);
	}

	// This is validated elsewhere
	return {};
}

async function loadWebSchema(uri: URL) {

	const res = await fetch(uri);
	if (debug.logSchemaResolver) console.log(uri);
	if (res.ok) {
		const json = await res.json() as Record<string, unknown>;
		if (debug.logSchemaResolver) console.log(res.status, json);

		// Infinite loop fix
		if (!json.$id) {
			json.$id = uri.toString();
		}
		return json;
	}
	if (debug.logSchemaResolver) console.log(res.status, await res.text());
	return res.json();
}

async function loadFileSchema(url: URL) {

	if (debug.logSchemaResolver) console.log(url);
	if (url.hostname === '..') url = new URL('file://' + path.resolve(url.toString().replace('file://..', '.')));
	if (debug.logSchemaResolver) console.log(url);

	const fileContents = await readFile(url);
	return JSON.parse(fileContents.toString());
}

function createValidator() {

	// TODO figure out why these are in spec but still "unkown keyword"
	const ajv = new Ajv({ loadSchema, strict: false })
		.addKeyword({
			keyword: 'order',
			modifying: false,
			schemaType: ['number'],
			validate: () => true
		});

	return ajv;
}