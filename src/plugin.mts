import type { Plugin, Transformer } from 'unified'
import type { Node, Parent } from 'unist';
import type { VFile } from 'vfile';

export type RemarkPlugin = Plugin<Parameters<Transformer>, Parameters<Transformer>[0], Transformer>;

export type OdrFile = VFile & {
	// TODO
	settings?: Record<string, any>
}
export type RemarkPluginDefinition = (tree: Parent, file: OdrFile) => Node | void | Promise<Node | void>

export function plugin(pluginDefinition: RemarkPluginDefinition): RemarkPlugin {
	return () => (tree, file, next) => {
		Promise.resolve(pluginDefinition(tree as Parent, file as OdrFile))
			.then(node => next(undefined, node ?? undefined, file))
			.catch(e => next(e, tree, file))
	}
}