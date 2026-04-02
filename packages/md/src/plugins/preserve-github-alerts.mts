import type { Plugin } from 'unified'

const ALERT_ESCAPE_RE = /\\\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/g

/**
 * remark plugin that preserves GitHub alert syntax (`> [!NOTE]`, etc.)
 * through the stringify phase.
 *
 * remark-stringify escapes `[` to `\[` because it could start a link.
 * This plugin overrides the blockquote handler to restore escaped
 * GitHub alert markers after serialization.
 */
const remarkPreserveGithubAlerts: Plugin = function () {
	const data = this.data() as Record<string, unknown>
	const extensions = (data.toMarkdownExtensions ?? []) as unknown[]
	data.toMarkdownExtensions = extensions

	extensions.push({
		handlers: {
			blockquote(
				node: unknown,
				_parent: unknown,
				state: {
					enter: (name: string) => () => void
					createTracker: (info: unknown) => { move: (value: string) => void, shift: (value: number) => void, current: () => unknown }
					containerFlow: (node: unknown, info: unknown) => string
					indentLines: (value: string, map: (line: string, index: number, blank: boolean) => string) => string
				},
				info: unknown,
			): string {
				const exit = state.enter('blockquote')
				const tracker = state.createTracker(info)
				tracker.move('> ')
				tracker.shift(2)
				const value = state.indentLines(
					state.containerFlow(node, tracker.current()),
					(line: string, _index: number, blank: boolean) => '>' + (blank ? '' : ' ') + line,
				)
				exit()

				return value.replaceAll(ALERT_ESCAPE_RE, '[!$1]')
			},
		},
	})
}

export const pluginName = 'remark-plugin:preserve-github-alerts'
export default remarkPreserveGithubAlerts
