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
			include: ['**/docs/architecture/*.md', '**/doc/architecture/*.md'],
			schemas: {
				// Just an example
				'file-example': 'file://./non-existent.mjs',
				// Uses an npm package alias (see "@odr/local" in package.json)
				'@local/architecture-decision-record': 'npm://@odr/local/architecture-decision-record',
				// Uses a published npm package alias (see "@odr/v1" in package.json)
				// '@v1/architecture-decision-record': 'npm://@odr/v1/architecture-decision-record',
			},
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
