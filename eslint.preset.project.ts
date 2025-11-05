import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'

export const projectConfig = defineConfig([
	stylistic.configs.customize({
		semi: false,
		quotes: 'single',
		indent: 'tab',
	}),
	{
		rules: {
			'unicorn/prefer-node-protocol': ['error'],
		},
	},
])
