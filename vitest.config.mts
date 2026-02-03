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
		outputFile: {
			junit: './testresults/junit-report.xml',
		},
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
				'src',
			],
			exclude: [
				'src/_module.mts',
			],
		},
	},
})
