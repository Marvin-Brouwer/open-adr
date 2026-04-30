import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { fm } from '@md-schema/builder'

export const cfm = {
	validFileOrGitRef(): ReturnType<typeof fm.custom> {
		return fm.custom({
			schema: { type: 'string' },
			validate(value, { filePath }) {
				if (typeof value !== 'string') return
				const hashMatch = /^(.+\.md)#g([0-9a-f]{4,})$/.exec(value)
				if (hashMatch) {
					const gitHash = hashMatch[2]
					const result = spawnSync('git', ['cat-file', '-e', gitHash], { stdio: 'ignore' })
					if ((result.status ?? 1) !== 0) {
						return `Git hash "${gitHash}" was not found in repository history`
					}
				}
				else {
					if (!value.endsWith('.md')) {
						return `"supersedes" must be a relative path to a .md file`
					}
					const resolved = path.resolve(path.dirname(filePath), value)
					if (!existsSync(resolved)) {
						return `File "${value}" does not exist — if it was deleted, append a git hash: ${value}#g{hash}`
					}
				}
			},
		})
	},
} as const
