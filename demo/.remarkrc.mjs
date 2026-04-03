import { mdLinter, mdSchema, mdSchemaInfo, mdSettings, preserveGithubAlerts, sectionify, unsectionify } from '@md-schema/md'
import remarkFrontmatter from 'remark-frontmatter'
import remarkLint from 'remark-lint'
import remarkLintCheckbox from 'remark-lint-checkbox-character-style'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

export default {
	settings: {
		'md-schema': mdSettings({
			include: [
				'**/docs/**/*.md',
				'**/doc/**/*.md',
			],
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
		// This is not required for using md-schema, however,
		// it makes sure the save action doesn't mess up the file in vscode
		// to a point where the built-in previewer breaks
		preserveGithubAlerts,
		[remarkStringify, {
			checklist: true,
			fences: true,
			listItemIndent: 'one',
			gfm: true,
		}],
	],
}
