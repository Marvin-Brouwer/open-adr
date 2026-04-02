import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import { configs as tseslintConfigs } from 'typescript-eslint'

const tsTypeCheckedConfigs = Array.isArray(tseslintConfigs.recommendedTypeChecked)
	? tseslintConfigs.recommendedTypeChecked
	: [tseslintConfigs.recommendedTypeChecked]

export const lintJs = defineConfig([
	{
		plugins: {
			js,
		},
	},
	js.configs.recommended,
])

export const lintTs = defineConfig([
	...tsTypeCheckedConfigs.map(config => ({
		...config,
		files: ['**/*.{ts,mts,cts,tsx}'],
	})),
	{
		files: ['**/*.{ts,mts,cts,tsx}'],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['*.ts', '*.mts'],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
])
