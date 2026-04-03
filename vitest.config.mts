import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		exclude: [...configDefaults.exclude, '**/node_modules/**'],
		server: {
			deps: {
				fallbackCJS: true,
			},
		},
		// Ensure each package's tests run in their own isolated thread
		// to prevent Symbol identity issues across workspace packages
		pool: 'threads',
		reporters: [
			// Show in terminal
			['default'],
			// Export to junit format for GitHub actions
			['junit'],
		],
		coverage: {
			enabled: false,
			reporter: [
				// Show in terminal
				'text',
				// Export to cobertura format for GitHub actions
				'cobertura',
			],
			include: [
				'packages/*/src',
			],
			exclude: [
				'packages/*/src/_module.mts',
			],
		},
	},
})
