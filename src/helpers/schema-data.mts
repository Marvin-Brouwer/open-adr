import { VFile } from 'vfile'

import { type OdrFileMetaData, odrSchemaKey } from '../plugins/schema-loader.mts'

import type { RemarkPluginContext } from '../move-later/remark-plugin/plugin.mts'
import type { ValidateFunction } from 'ajv'

export const getSchemaData = (fileOrContext: VFile | RemarkPluginContext) => {
	const file = fileOrContext instanceof VFile ? fileOrContext : fileOrContext.file
	return file.data[odrSchemaKey] as undefined | (OdrFileMetaData & {
		validator: ValidateFunction
	})
}
