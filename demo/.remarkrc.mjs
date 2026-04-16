import { mdLinter, mdSchemaLoader, mdSchemaInfo, mdSettings, mdSectionify, mdUnSectionify, preserveGithubAlerts } from '@md-schema/md'
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
		mdSchemaLoader,
		mdSectionify,
		mdLinter,
		mdSchemaInfo,
		mdUnSectionify,

		// Fix for vscode markdown-previewer
		// This is not required for using md-schema, however, it makes sure the save action in vscode
		// doesn't mess up the file to a point where the built-in previewer breaks
		preserveGithubAlerts,
		[remarkStringify, {
			checklist: true,
			fences: true,
			listItemIndent: 'one',
			gfm: true,
		}],
	],
}
