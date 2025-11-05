import path from 'node:path';

import { Node, Parent, Position } from 'unist';
import { VFile } from 'vfile';

export type MessageWriter = ReturnType<typeof createMessageWriter>;
export function createMessageWriter(file: VFile) {
	return {
		info(message: string, parent: Parent | Node) {
			file.info(message, parent);
		},
		warn(message: string, parent: Parent | Node) {
			file.message(message, parent);
		},
		error(message: string, parent: Parent | Node | Position, data?: { stack?: string, cause?: string | unknown, file?: string, note?: string; }) {
			const errorMessage = file.message(message, parent as Node);
			errorMessage.fatal = true;
			errorMessage.cause = data?.cause;
			errorMessage.stack = data?.stack;
			if (data?.file)
				errorMessage.file = path.resolve(file.cwd, file.dirname!, data?.file.replace('file://', ''));
			// errorMessage.source = (data?.file ?? file.path).replace('file://', '');
			errorMessage.note = data?.note;
			errorMessage.url = errorMessage.file;
		}
	};
}