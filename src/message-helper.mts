import path from 'node:path'

import { Node, Parent, Position } from 'unist'
import { VFile } from 'vfile'

export type MessageWriter = ReturnType<typeof createMessageWriter>
export function createMessageWriter(root: Node, file: VFile, pluginName: string, traceEnabled: boolean) {
	return {
		writeTrace(...arguments_: Parameters<typeof console.log>) {
			if (!traceEnabled) return
			console.info(`[${pluginName}]`, ...arguments_)
		},
		appendInfo(message: string, location?: Parent | Node | Position) {
			file.info(message, location as Node ?? root)
		},
		appendWarn(message: string, location?: Parent | Node | Position) {
			file.message(message, location as Node ?? root)
		},
		appendError(message: string, location?: Parent | Node | Position, data?: { stack?: string, cause?: string | unknown, file?: string, note?: string }) {
			const errorMessage = file.message(message, location as Node ?? root)
			errorMessage.fatal = true
			errorMessage.cause = data?.cause
			errorMessage.stack = data?.stack
			if (data?.file)
				errorMessage.file = path.resolve(file.cwd, file.dirname!, data?.file.replace('file://', ''))
			// errorMessage.source = (data?.file ?? file.path).replace('file://', '');
			errorMessage.note = data?.note
			errorMessage.url = errorMessage.file
		},
	}
}
