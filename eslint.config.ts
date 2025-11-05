import js from '@eslint/js';
import { Config, defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const customConfig = defineConfig({
	rules: {
		'quotes': [2, 'single', { 'avoidEscape': true }]
	},
});

export default defineConfig([
	globalIgnores(['node_modules', 'dist']),
	configureFiles(['**/*.{js,mjs,cjs,ts,mts,cts}']),
	jsInterop(),
	importSort(),
	// eslint-disable-next-line import/no-named-as-default-member
	tseslint.configs.recommended,
	customConfig,
]);


function configureFiles(files: Config['files']): Config {
	return {
		files,
		languageOptions: {
			globals: globals.es2015
		}
	};
}
function jsInterop(): Config[] {
	return [
		{
			plugins: {
				js,
			}
		},
		js.configs.recommended,
	];
};

function importSort(): Config[] {
	return [
		importPlugin.flatConfigs.recommended,
		importPlugin.flatConfigs.typescript,
		{
			settings: {
				'import/resolver': {
					typescript: {
						alwaysTryTypes: true
					}
				}
			},
			rules: {
				'import/order': [
					'error',
					{
						'groups': [
							'builtin',   // Node.js builtins
							'external',  // npm libs
							'internal',  // alias paths, tsconfig paths
							'parent',    // ../
							'sibling',   // ./same-folder
							'index',     // index imports
							'object',    // import a namespace
							'type'       // import type {...}
						],
						'newlines-between': 'always',
						'alphabetize': {
							order: 'asc',
							caseInsensitive: true
						}
					}
				],
				// ✅ Disable conflicting built-in sorting
				'sort-imports': 'off'
			}
		}
	];
}