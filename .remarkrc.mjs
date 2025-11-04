import remarkParse from 'remark-parse'
import remarkLint from 'remark-lint'

import { odrRequireSchema, odrLintSchema, odrSchemaInfo } from './dist/_module.js'

export default {
  settings: {
    odr: {
      // allowedSchemas: ['incident.schema.json', 'project.schema.json'],
      include: ['docs/odr/**/*.md', 'doc/odr/**/*.md']
    }
  },
  plugins: [
    remarkParse,
    remarkLint,

    odrRequireSchema,
    odrLintSchema,
    // odrSchemaInfo
  ]
}
