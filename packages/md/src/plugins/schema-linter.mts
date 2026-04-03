import { definePlugin } from '@md-schema/remark-plugin'

import { checkFileIncluded } from '../files/file-include.mts'
import { getSchemaData } from '../helpers/schema-data.mts'

export const pluginName = 'remark-plugin:md-schema-linter'
export default definePlugin({
	pluginName,
	transform(context) {
		if (!checkFileIncluded(context)) return

		const schema = getSchemaData(context)
		if (!schema) throw new Error('No schema was present to lint, please check your plugin configuration.')

		// Verify that the AST has been sectionified
		const hasSections = context.root.children.some(child => child.type === 'section')
		if (!hasSections) {
			throw new Error('Schema linter requires sectionified AST. Ensure the sectionify plugin runs before the linter.')
		}

		const results = schema.template.validate(context.root)
		for (const result of results) {
			// Fall back to the schema line position for errors on nodes
			// without a position (e.g. synthetic section nodes from sectionify)
			const node = !result.node?.position
				? schema.schemaPosition
				: result.node

			if (result.severity === 'error') {
				context.appendError(result.message, node)
			}
			else {
				context.appendWarn(result.message, node)
			}
		}
	},
})
