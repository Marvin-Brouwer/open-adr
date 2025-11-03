import remarkParse from 'remark-parse'
import remarkLint from 'remark-lint'

import remarkHoverSchema from './src/plugins/remark-hover-schema.mjs'
import remarkRequireSchemaAnchor from './src/plugins/remark-require-schema-anchor.mjs'
import remarkLintSchema from './src/plugins/remark-lint-schema.mjs'

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
    remarkHoverSchema
  ]
}
