import { mdLinter, mdSchema, mdSchemaInfo, mdSettings, preserveGithubAlerts, sectionify, unsectionify } from '@md-schema/md'
import remarkFrontmatter from 'remark-frontmatter'
import remarkLint from 'remark-lint'
import remarkLintCheckbox from 'remark-lint-checkbox-character-style'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

export default {
	settings: {
		'md-schema': mdSettings({
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

		// Configure md-schema
		remarkFrontmatter,
		sectionify,
		mdSchema,
		mdLinter,
		mdSchemaInfo,
		unsectionify,

		// Fix for vscode markdown-previewer
		preserveGithubAlerts,
		[remarkStringify, {
			checklist: true,
			fences: true,
			listItemIndent: 'one',
			gfm: true,
		}],
	],
}
