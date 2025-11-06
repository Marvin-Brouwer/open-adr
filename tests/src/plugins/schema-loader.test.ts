import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { Settings } from 'unified'
import { VFile } from 'vfile'
import { assert, describe, test } from 'vitest'

import pluginUnderTest, { pluginName } from '../../../src/plugins/schema-loader.mts'

describe(pluginName, () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const settings: Settings & Record<string, any> = {
		trace: true,
	}
	const sut = () => remark().use({
		settings,
		plugins: [
			remarkParse,
			// TODO add functionality to check for yaml section
			remarkFrontmatter,
			pluginUnderTest,
		],
	})

	test('no remark', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/no-remark.md',
			value: `
# No Remark

This file has no remark header
`.trimStart(),
		})

		// ACT
		const file = await sut()
			.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, 'No frontmatter data found')
		// It should mark the entire file
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 1,
				offset: 0,
			},
			end: {
				column: 1,
				line: 4,
				offset: 44,
			},
		})
	})

	test('no yaml', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/no-yaml.md',
			value: `
---
---

# No yaml

This file has no yaml in the remark data
`.trimStart(),
		})

		// ACT
		const file = await sut()
			.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, 'No frontmatter data found')
		// It should mark the remark section
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 1,
				offset: 0,
			},
			end: {
				column: 1,
				line: 7,
				offset: 61,
			},
		})
	})

	test('no schema', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/no-schema.md',
			value: `
---
no: false
---

# No schema

This file has no odr: schema in the remark data
`.trimStart(),
		})

		// ACT
		const file = await sut()
			.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, `meta-data must have required property 'odr:schema'`)
		// It should mark the yaml
		// But it marks the entire block for now
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 1,
				offset: 0,
			},
			end: {
				column: 4,
				line: 3,
				offset: 17,
			},
		})
	})

	test('empty schema', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/empty-schema.md',
			value: `
---
odr:schema: ''
---

# Empty schema

This file has an invalid odr: schema in the remark data
`.trimStart(),
		})

		// ACT
		const file = await sut()
			.process(document)

		// ASSERT
		assert.equal(file.messages[0].message, 'meta-data/odr:schema schema url protocol only allows: https, or file.')
		// It should mark the yaml value
		// But it marks the entire block for now
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 1,
				offset: 0,
			},
			end: {
				column: 4,
				line: 3,
				offset: 22,
			},
		})
	})

	test('duplicate schema', async () => {
		// ARRANGE
		const document = new VFile({
			path: 'doc/odr/test/duplicate-schema.md',
			value: `
---
odr:schema: 'file:./any.json'
odr:schema: 'file:./any.json'
---

# Double schema

This file has an invalid odr: schema in the remark data
`.trimStart(),
		})

		// ACT
		const file = await sut()
			.process(document)

		// ASSERT
		assert.equal(file.messages[0].message.trim(), `
Map keys must be unique at line 2, column 1:

odr:schema: 'file:./any.json'
odr:schema: 'file:./any.json'
^
`.trim())
		// It should mark the yaml value
		assert.deepEqual(file.messages[0].place, {
			start: {
				column: 1,
				line: 3,
				offset: 0,
			},
			end: {
				column: 2,
				line: 3,
				offset: 0,
			},
		})
	})

	// TODO non-existent file
	// TODO non-readable file
	// TODO valid schema
})
