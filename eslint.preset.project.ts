import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export const projectConfig = defineConfig([
	stylistic.configs.customize({
		semi: false,
		quotes: 'single',
		indent: 'tab',
	}),
	{
		rules: {
			'@stylistic/indent-binary-ops': ['off'],
			'unicorn/prefer-node-protocol': ['error'],
		},
	},
	{
		files: ['**/*.{ts,mts,cts,tsx}'],
		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			'@typescript-eslint/switch-exhaustiveness-check': ['error', {
				/** If 'true', allow 'default' cases on switch statements with exhaustive cases. */
				allowDefaultCaseForExhaustiveSwitch: true,
				/** If 'true', the 'default' clause is used to determine whether the switch statement is exhaustive for union type */
				considerDefaultExhaustiveForUnions: false,
			}],
			'@typescript-eslint/semi': ['off'],
		},
	},
])
