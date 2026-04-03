import path from 'node:path'

import { VFile } from 'vfile'

import type { Node, Parent, Position } from 'unist'

export type MessageWriter = ReturnType<typeof createMessageWriter>
export function createMessageWriter(root: Node, file: VFile, pluginName: string, traceEnabled: boolean) {
	return {
		writeTrace(...arguments_: Parameters<typeof console.log>) {
			if (!traceEnabled) return

			console.info(`[${pluginName}]`, ...arguments_)
		},
		/**
		 * Add hover information to nodes in the markdown file.
		 * This is used to provide additional context to users when they hover over a node in the markdown file.
		 *
		 * **NOTE:** Currently this is the same as appendInfo since unified-language-server doesn't support hint diagnostics,
		 * the difference is that we don't output this on CLI mode.
		 */
		appendDescription(message: string, location?: Parent | Node | Position, url?: string) {
			if (process.stdout.isTTY) return

			const info = file.info(message, location as Node ?? root)
			// remark extension doesn't support url in info messages
			if (url) info.note = `Read more: ${url}`
			if (url) info.url = url
		},
		appendInfo(message: string, location?: Parent | Node | Position, url?: string) {
			const info = file.info(message, location as Node ?? root)
			// remark extension doesn't support url in info messages
			if (url) info.note = url
			if (url) info.url = url
		},
		appendWarn(message: string, location?: Parent | Node | Position) {
			file.message(message, location as Node ?? root)
		},
		appendError(message: string, location?: Parent | Node | Position, data?: { stack?: string, cause?: unknown, file?: string, note?: string, expectedValues?: string[] }) {
			const errorMessage = file.message(message, location as Node ?? root)
			errorMessage.fatal = true
			errorMessage.cause = data?.cause
			errorMessage.stack = data?.stack
			if (data?.file) {
				const filePath = data.file.replace('file://', '')
				const absoluteFilePath: string = path.resolve(file.cwd, file.dirname!, filePath)
				errorMessage.file = absoluteFilePath
			}
			// errorMessage.source = (data?.file ?? file.path).replace('file://', '');
			errorMessage.note = data?.note
			errorMessage.url = errorMessage.file
			errorMessage.expected = data?.expectedValues
		},
	}
}
