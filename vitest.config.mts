import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		exclude: [...configDefaults.exclude, '**/node_modules/**'],
		server: {
			deps: {
				fallbackCJS: true,
			},
		},
	},
})
