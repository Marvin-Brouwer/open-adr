import { definePlugin } from '@md-schema/remark-plugin'

import { checkFileIncluded } from '../files/file-include.mts'

// TODO parse schema and figure this out
const pluginName = 'remark-plugin:md-schema-provider'
export default definePlugin({
	pluginName,
	transform(context) {
		if (!checkFileIncluded(context)) return
	},
})
