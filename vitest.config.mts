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
	},
})
