import remarkParse from 'remark-parse'
import remarkLint from 'remark-lint'

// eslint-disable-next-line
import { odrSchema, odrLinter, odrSchemaInfo } from './dist/_module.js'
import remarkFrontmatter from './node_modules/remark-frontmatter/index.js'

export default {
	settings: {
		odr: {
			// allowedSchemas: ['incident.schema.json', 'project.schema.json'],
			include: ['docs/odr/**/*.md', 'doc/odr/**/*.md']
		}
	},
	plugins: [
		remarkParse,
		remarkFrontmatter,
		remarkLint,

		remarkFrontmatter,
		odrSchema,
		odrLinter,
		// odrSchemaInfo
	]
}
