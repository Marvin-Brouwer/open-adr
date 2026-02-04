import { readFileSync } from 'node:fs'

import { Ajv, type AnySchemaObject } from 'ajv'

import { odrSchemaKey } from '../../src/plugins/schema-loader.mts'

import type { PluginBody } from '../../src/move-later/remark-plugin/plugin.mts'
import type { Transformer } from 'unified'

function createValidator(references: string[]) {
	const ajv = new Ajv({
		strict: false,
	})

	// Add references directly to AJV to prevent needing a loadSchema override
	for (const uri of references) {
		const referenceSchema = JSON.parse(readFileSync(uri).toString()) as AnySchemaObject
		referenceSchema.$id = uri
		ajv.addSchema(referenceSchema, uri, false, false)
	}

	return ajv
}

export function mockSchemaPlugin(schema: AnySchemaObject, ...references: string[]): PluginBody {
	const plugin: Transformer = (tree, file, next) => {
		const ajv = createValidator(references)
		const validator = ajv.compile(schema)

		file.data[odrSchemaKey] = {
			schemaUrl: schema.$id,
			validator,
		}

		next(undefined, tree, file)
	}
	return () => plugin
}
