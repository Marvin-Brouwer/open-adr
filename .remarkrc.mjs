import remarkFrontmatter from 'remark-frontmatter'
import remarkLint from 'remark-lint'
import remarkLintCheckbox from 'remark-lint-checkbox-character-style'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

import { odrLinter, odrSchema, odrSchemaInfo, odrSettings } from './dist/_module.js'

export default {
	settings: {
		odr: odrSettings({
			// allowedSchemas: ['incident.schema.json', 'project.schema.json'],
			include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
		}),
	},
	plugins: [
		// Basic remark setup
		remarkParse,
		remarkFrontmatter,
		remarkLint,
		remarkLintCheckbox,

		// Configure ODR
		remarkFrontmatter,
		odrSchema,
		odrLinter,
		odrSchemaInfo,

		// Fix for vscode markdown-previewer
		[remarkStringify, {
			checklist: true,
			fences: true,
			listItemIndent: '1',
			gfm: true,
		}],
	],
}
