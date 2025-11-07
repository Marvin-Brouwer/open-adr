import js from '@eslint/js'
import { defineConfig } from 'eslint/config'

export const lintJs = defineConfig([
	{
		plugins: {
			js,
		},
	},
	js.configs.recommended,
])
