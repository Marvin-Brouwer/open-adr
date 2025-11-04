import remarkParse from 'remark-parse'
import remarkLint from 'remark-lint'

import { remarkSchemaInfo , remarkRequireSchemaAnchor, remarkLintSchema } from './dist/_module.js'

export default {
  settings: {
    odr: {
      allowedSchemas: ['incident.schema.json', 'project.schema.json'],
      include: ['docs/odr/**/*.md']
    }
  },
  plugins: [
    remarkParse,
    remarkLint,

    remarkRequireSchemaAnchor,
    remarkLintSchema,
    remarkSchemaInfo
  ]
}
