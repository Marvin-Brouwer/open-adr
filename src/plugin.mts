import type { Plugin, Processor, Settings, Transformer } from 'unified';
import type { Node, Parent } from 'unist';
import type { VFile } from 'vfile';
import { createMessageWriter } from './message-helper.mts';

export type RemarkPlugin = Plugin<Parameters<Transformer>, Parameters<Transformer>[0], Transformer>;

export type OdrSettings = Settings & {
	// TODO
	odr?: Record<string, unknown | undefined> | undefined;
};
export type RemarkPluginDefinition = (tree: Parent, file: VFile, settings: OdrSettings) => Node | void | Promise<Node | void>;
type PluginBody = NonNullable<Exclude<RemarkPlugin, void>>;

export const definePlugin = (name: string, pluginDefinition: RemarkPluginDefinition): RemarkPlugin => {
	const plugin: Record<string, PluginBody> = {
		[name]() {
			const processor = this as Processor;
			return async (tree, file, next) => {
				try {
					await pluginDefinition(tree as Parent, file, processor.data().settings ?? {});
				} catch (err) {
					const error = err as Error;
					const messageWriter = createMessageWriter(file);
					messageWriter.error(error.message, tree, {
						stack: error.stack,
						cause: error.cause,
					});
				}
				finally {
					next(undefined, tree, file);
				}
			};
		}
	};
	return Object.defineProperty<PluginBody>(plugin[name], 'name', { value: name });
};
