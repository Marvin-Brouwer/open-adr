import stylistic from '@stylistic/eslint-plugin'
import { Config, defineConfig, globalIgnores } from 'eslint/config'
import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'

import { lintImports } from './eslint.preset.import.js'
import { lintJs, lintTs } from './eslint.preset.lang.js'
import { projectConfig } from './eslint.preset.project'

export default defineConfig([
	globalIgnores(['node_modules', '**/node_modules', '**/dist']),
	configureFiles([
		'eslint.*.ts',
		'packages/*/src/**/*.mts',
		'demo/src/**/*.mts',
	]),
	lintJs,
	lintTs,
	stylistic.configs.recommended,
	unicorn.configs.recommended,
	lintImports,
	projectConfig,
])

function configureFiles(files: Config['files']): Config {
	return {
		files,
		languageOptions: {
			globals: globals.es2015,
		},
	}
}
