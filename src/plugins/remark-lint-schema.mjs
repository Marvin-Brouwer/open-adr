import fs from 'fs'
import path from 'path'
import { visit } from 'unist-util-visit'
import micromatch from 'micromatch'

import { schemaTag } from '../constants.mjs'
import Ajv from 'ajv'

export default function remarkLintSchema() {
  return async (tree, file) => {
    const odrSettings = file.settings?.odr || {}
    const allowedSchemas = odrSettings.allowedSchemas || []
    const includePatterns = odrSettings.include || []

    const filePath = file.path || file.history?.[0] || ''
    const fileDir = path.dirname(filePath)

    if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return

    let schemaRefNode, schemaRef
    visit(tree, 'definition', node => {
      if (node.identifier?.toLowerCase() === schemaTag) {
        schemaRefNode = node
        schemaRef = node.url
      }
    })

    if (!schemaRef) return
		let schemaUrl = undefined;
		try{
			schemaUrl = new URL(schemaRef)
		} finally {
			if(!schemaUrl) return;
		}

    if (allowedSchemas.length > 0) {
      if (!allowedSchemas.includes(schemaUrl)) {
        file.message(`Schema "${schemaUrl}" is not allowed. Allowed: ${allowedSchemas.join(', ')}`, schemaRefNode)
        return
      }
    }

		const ajv = createValidator(schemaUrl)

		const validate = await ajv.compileAsync({
			$ref: schemaUrl.toString()
		});
		// TODO this is just a chatgpt bart where we validate our schema against the document.
		// However, it's probably more robust to convert the markdown into JSON and have ajv just validate that.
		// Maybe that'll make it hard to find back the document nodes later.
		console.log(validate)
		// const isDataValid = ajv.validate(iceCreamSchema, iceCreamData);
		// TODO load schema
    const activeSchemaPath = path.resolve(fileDir, schemaRef)
    let schema
    try { schema = JSON.parse(fs.readFileSync(activeSchemaPath, 'utf8')) }
    catch (err) { file.message(`Failed to load schema file: ${activeSchemaPath}\n${err.message}`, tree); return }

    const headings = []
    visit(tree, 'heading', node => {
      const text = node.children.map(c => c.value).join('')
      headings.push({ level: node.depth, text, node })
    })

    if (Array.isArray(schema.requiredHeadings)) {
      schema.requiredHeadings.forEach((expected, i) => {
        const actual = headings[i]
        if (!actual) { file.message(`Missing heading "${expected.text}" (position ${i + 1})`, tree); return }
        if (actual.text !== expected.text) file.message(`Expected heading "${expected.text}" but found "${actual.text}"`, actual.node)
        if (actual.level !== expected.level) file.message(`Heading "${actual.text}" should be level ${expected.level}`, actual.node)
        if (expected.mustHaveList) {
          const allNodes = tree.children
          const index = allNodes.indexOf(actual.node)
          const next = allNodes[index + 1]
          if (!next || next.type !== 'list') file.message(`Section "${expected.text}" must contain a bullet list`, actual.node)
        }
      })
    }

    file.info(`Validated against schema: ${path.basename(activeSchemaPath)}`, tree)
  }
}

async function loadSchema(uri) {
	// Skip meta schemas
	if(uri.toString().startsWith('https://json-schema.org/draft/')) return { }
	if(uri.toString().startsWith('http://json-schema.org/draft/')) return { }

  const url = new URL(uri)

	switch(url.protocol) {
		case 'https:': return loadWebSchema(url);
		case 'file:': return loadModuleSchema(uri);
	}

	throw new Error(`Unsupported schema: ${url.schema}`);
}

async function loadWebSchema(uri) {

  const res = await fetch(uri);
	console.log(uri)
	if (res.ok) {
		const json = await res.json()
	console.log(res.status, json)

	// Infinite loop fix
  if (!json.$id) {
    json.$id = uri.toString();
  }
		return json;
	}
	console.log(res.status, await res.text())
  return res.json();
}

async function loadModuleSchema(uri) {

	let filePath = uri;
	console.log(filePath)
	if (uri.startsWith('file://')) filePath = 'file://' + path.resolve(uri.replace(`file://..`, '.'))
	console.log(filePath)
  const schemaExport = await import(filePath, {
  assert: { type: "json" }
});
  return schemaExport.default
}

function createValidator(url) {

	// TODO figure out why these are in spec but still "unkown keyword"
		const ajv = new Ajv({ loadSchema, strict: false })
			.addKeyword({
				keyword: "order",
				modifying: false,
				schemaType: ["number"],
				validate: () => true
			})

		return ajv;
}