import path from 'node:path'

import { defineConfig } from 'tsup'

export default defineConfig({
	entry: [
		'src/**/*.mts',
		'!src/**/__tests__/**',
		'!src/**/*.test.*',
		'!src/**/*.spec.*',
	],
	format: ['esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	skipNodeModulesBundle: true,
	tsconfig: path.resolve(__dirname, './tsconfig.lib.json'),
	bundle: true,
	treeshake: true,
	splitting: true,
	minify: false,
	esbuildOptions(options) {
		options.outbase = './src'
	},
})
