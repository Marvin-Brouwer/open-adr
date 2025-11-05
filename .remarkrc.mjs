import remarkLint from 'remark-lint'
import remarkParse from 'remark-parse'

import { odrSettings, odrSchema, odrLinter } from './dist/_module.js'
import remarkFrontmatter from './node_modules/remark-frontmatter/index.js'

export default {
	settings: {
		odr: odrSettings({
			// allowedSchemas: ['incident.schema.json', 'project.schema.json'],
			include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
		}),
	},
	plugins: [
		remarkParse,
		remarkFrontmatter,
		remarkLint,

		remarkFrontmatter,
		odrSchema,
		odrLinter,
		// odrSchemaInfo
	],
}
