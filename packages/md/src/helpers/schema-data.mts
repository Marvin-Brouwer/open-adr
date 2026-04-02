import { VFile } from 'vfile'

import { type MdFileMetaData, mdSchemaKey } from '../plugins/schema-loader.mts'

import type { SchemaTemplate } from '@md-schema/builder'
import type { RemarkPluginContext } from '@md-schema/remark-plugin'

export const getSchemaData = (fileOrContext: VFile | RemarkPluginContext) => {
	const file = fileOrContext instanceof VFile ? fileOrContext : fileOrContext.file
	return file.data[mdSchemaKey] as undefined | (MdFileMetaData & {
		template: SchemaTemplate
	})
}
