import stylistic from '@stylistic/eslint-plugin'
import { Config, defineConfig, globalIgnores } from 'eslint/config'
import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'

import { lintImports } from './eslint.preset.import.js'
import { lintJs } from './eslint.preset.java-script.js'
import { projectConfig } from './eslint.preset.project'
import { lintTs } from './eslint.preset.type-script.js'

export default defineConfig([
	globalIgnores(['node_modules', 'dist']),
	configureFiles([
		'remarkrc.mjs',
		'eslint.*.ts',
		'src/**/*.mts',
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
