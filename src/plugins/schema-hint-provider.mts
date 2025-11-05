import { checkFileIncluded } from '../files/file-include.mts'
import { definePlugin } from '../plugin.mts'
import { getOdrSettings } from '../settings.mts'

// TODO parse schema and figure this out
const pluginName = 'remark-plugin:odr-schema-provider'
export default definePlugin({
	pluginName,
	transform(_tree, file, settings) {
		const odrSettings = getOdrSettings(settings)

		if (!checkFileIncluded(file, odrSettings)) return

		// const activeSchemaPath = path.resolve(fileDir, schemaRefNode.url)
		// let schema
		// try { schema = JSON.parse(fs.readFileSync(activeSchemaPath, 'utf8')) }
		// catch { return }

		// const headingDescriptions: Record<string, string> = {}
		// if (Array.isArray(schema.requiredHeadings)) {
		// 	// eslint-disable-next-line
		// 	schema.requiredHeadings.forEach((h: any) => { if (h.text && h.description) headingDescriptions[h.text] = h.description })
		// }

		// visit(tree, 'heading', (node: HeadingNode) => {
		// 	const text = node.children.map(c => c.value).join('')
		// 	const desc = headingDescriptions[text]
		// 	if (desc) {
		// 		node.data = node.data || {}
		// 		node.data.hProperties = node.data.hProperties || {}
		// 		node.data.hProperties.hover = desc
		// 	}
		// })
	},
})
