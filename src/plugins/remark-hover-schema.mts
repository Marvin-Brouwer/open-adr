import fs from 'fs'
import path from 'path'
import { visit } from 'unist-util-visit'
import micromatch from 'micromatch'

import { schemaTag } from '../constants.mts'
import { plugin } from '../plugin.mts'
import { DefinitionNode, HeadingNode } from '../nodes.mts'

// TODO parse schema and figure this out
export default plugin((tree, file) => {
    const odrSettings = file.settings?.odr || {}
    const allowedSchemas = odrSettings.allowedSchemas || []
    const includePatterns = odrSettings.include || []

    const filePath = file.path || file.history?.[0] || ''
    const fileDir = path.dirname(filePath)
    if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return

    let schemaRefNode: DefinitionNode | undefined;
    visit(tree, 'definition', (node: DefinitionNode) => {
      if (node.identifier?.toLowerCase() === schemaTag) {
        schemaRefNode = node
      }
    })

    if (!schemaRefNode?.url) return
    if (allowedSchemas.length > 0 && !allowedSchemas.includes(path.basename(schemaRefNode.url))) return

    const activeSchemaPath = path.resolve(fileDir, schemaRefNode.url)
    let schema
    try { schema = JSON.parse(fs.readFileSync(activeSchemaPath, 'utf8')) }
    catch { return }

    const headingDescriptions: Record<string, string> = {}
    if (Array.isArray(schema.requiredHeadings)) {
      schema.requiredHeadings.forEach((h: any) => { if (h.text && h.description) headingDescriptions[h.text] = h.description })
    }

    visit(tree, 'heading', (node: HeadingNode) => {
      const text = node.children.map(c => c.value).join('')
      const desc = headingDescriptions[text]
      if (desc) {
        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}
        node.data.hProperties.hover = desc
      }
    })
  })