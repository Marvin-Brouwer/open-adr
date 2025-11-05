import { checkFileIncluded } from '../files/file-include.mts'
import { definePlugin } from '../plugin.mts'

const pluginName = 'remark-plugin:odr-schema-linter'
export default definePlugin({
	pluginName,
	async transform(context) {
		if (!checkFileIncluded(context)) return

		// TODO this is just a chatgpt barf where we validate our schema against the document.
		// However, it's probably more robust to convert the markdown into JSON and have ajv just validate that.
		// Maybe that'll make it hard to find back the document nodes later.
		// console.log(validate);
		// const isDataValid = ajv.validate(iceCreamSchema, iceCreamData);
		// TODO load schema
		// const activeSchemaPath = path.resolve(fileDir, schemaUrl!.toString());
		// let schema;
		// try { schema = JSON.parse(fs.readFileSync(activeSchemaPath, 'utf8')); }
		// catch (err) {
		// 	file.message(`Failed to load schema file: ${activeSchemaPath}\n${(err as Error).message}`, tree);
		// 	return;
		// }

		// type Heading = { level: number, text: string, node: HeadingNode; mustHaveList?: boolean; };
		// const headings: Heading[] = [];
		// visit(tree, 'heading', (node: HeadingNode) => {
		// 	const text = node.children.map(c => c.value).join('');
		// 	headings.push({ level: node.depth, text, node });
		// });

		// if (Array.isArray(schema.requiredHeadings)) {
		// 	schema.requiredHeadings.forEach((expected: Heading, i: number) => {
		// 		const actual = headings[i];
		// 		if (!actual) { file.message(`Missing heading "${expected.text}" (position ${i + 1})`, tree); return; }
		// 		if (actual.text !== expected.text) file.message(`Expected heading "${expected.text}" but found "${actual.text}"`, actual.node);
		// 		if (actual.level !== expected.level) file.message(`Heading "${actual.text}" should be level ${expected.level}`, actual.node);
		// 		if (expected.mustHaveList) {
		// 			const allNodes = tree.children;
		// 			const index = allNodes.indexOf(actual.node);
		// 			const next = allNodes[index + 1];
		// 			if (!next || next.type !== 'list') file.message(`Section "${expected.text}" must contain a bullet list`, actual.node);
		// 		}
		// 	});
		// }

		// file.info(`Validated against schema: ${path.basename(activeSchemaPath)}`, tree);
	},
})
