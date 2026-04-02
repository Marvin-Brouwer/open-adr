import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

const tsTypeCheckedConfigs = Array.isArray(tseslint.configs.recommendedTypeChecked)
	? tseslint.configs.recommendedTypeChecked
	: [tseslint.configs.recommendedTypeChecked]

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
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
])
