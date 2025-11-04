import { VFile } from 'vfile';
import { Node, Parent } from 'unist';

export function createMessageWriter(file: VFile) {
	return {
		info(message: string, parent: Parent | Node){
			file.info(message, parent)
		},
		warn(message: string, parent: Parent | Node) {
			file.message(message, parent)
		},
		error(message:string, parent: Parent | Node) {
			const errorMessage = file.message(message, parent)
			errorMessage.fatal = true;
		}
	}
}