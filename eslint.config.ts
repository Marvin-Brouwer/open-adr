import stylistic from '@stylistic/eslint-plugin'
import { Config, defineConfig, globalIgnores } from 'eslint/config'
import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { lintImports } from './eslint.preset.import.js'
import { lintJs } from './eslint.preset.js'
import { projectConfig } from './eslint.preset.project'

export default defineConfig([
	globalIgnores(['node_modules', 'dist']),
	configureFiles([
		'remarkrc.mjs',
		'eslint.*.ts',
		'src/**/*.mts',
	]),
	lintJs,
	// eslint-disable-next-line import/no-named-as-default-member
	tseslint.configs.recommended,
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
