import path from 'node:path'

import { globSync } from 'tinyglobby'
import { defineConfig } from 'tsup'

// This is for a TSUP specific issue
// We want to pack the types next to the entry files
// the dts functionality doesn't support this on its own.
const entries = globSync([
	// Include all files because we're not bundling
	'src/templates/**/*.mts',
	// Exclude the tests, we don't need those compiled
	'!src/**/__tests__/**',
	'!src/**/*.test.*',
	'!src/**/*.spec.*',
])

const dtsEntries = Object.fromEntries(
	entries.map(file => [
		file.replace(/^src\//, '').replace(/\.mts$/, ''),
		file,
	]),
)

export default defineConfig({
	entry: entries,
	format: ['esm'],
	dts: {
		entry: dtsEntries,
	},
	clean: true,
	sourcemap: true,
	// Skip bundling node modules since we expect the consumer to install them.
	skipNodeModulesBundle: true,
	tsconfig: path.resolve(__dirname, './tsconfig.lib.json'),
	bundle: true,
	treeshake: true,
	splitting: true,
	minify: true,
	esbuildOptions(options) {
		options.outbase = './src'
		options.external = ['@md-schema/builder']
	},
})
