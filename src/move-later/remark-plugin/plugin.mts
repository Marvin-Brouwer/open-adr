import { VFile } from 'vfile'

import { createMessageWriter, type MessageWriter } from './message-helper.mts'

import type { Plugin, Settings, Transformer } from 'unified'
import type { Node, Parent } from 'unist'

/**
 * ## [remark `plugin`](https://github.com/remarkjs/remark?tab=readme-ov-file#plugins)
 */
export type RemarkPlugin = Plugin<Parameters<Transformer>, Parameters<Transformer>[0], Transformer>

// See: <https://github.com/sindresorhus/type-fest/blob/main/source/empty-object.d.ts>
declare const emptyObjectSymbol: unique symbol

/**
 * ## Untyped settings for [remark `plugins`](https://github.com/remarkjs/remark?tab=readme-ov-file#plugins)
 *
 * @todo When splitting into a separate library, update code comment to include good example.
 * @todo When splitting into a separate library, create docs to illustrate best practices as done in the odr library.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemarkPluginSettings = Settings & Readonly<Record<string, Readonly<any>>> & {
	[emptyObjectSymbol]: never
}

/**
 * {@inheritdoc RemarkPluginDefinition.transform}
 */
export type RemarkTransformDefinition = RemarkPluginDefinition['transform']

/**
 * ## [Remark `plugin`](https://github.com/remarkjs/remark?tab=readme-ov-file#plugins) context
 */
export type RemarkPluginContext = {
	/** The initial document root node, at the time of invocation */
	root: Parent
	/** The current document being transformed */
	file: VFile
	/** The settings as configured by the user */
	settings: RemarkPluginSettings
} & MessageWriter

export type PluginBody = NonNullable<Exclude<RemarkPlugin, void>>

/**
 * ## Define a [remark `plugin`](https://github.com/remarkjs/remark?tab=readme-ov-file#plugins)
 *
 * The plugin comes with explicit type information **and** an uncaught error handler to prevent the processor from crashing. \
 * A basic plugin will look like:
 *
 * ```ts
 * // basic-example.mts
 * const pluginName = `remark-plugin:basic-example`
 * export default definePlugin({
 * 	pluginName,
 * 	transform(tree, file, settings) {
 * 		// This plugin does nothing yet...
 * 	}
 * })
 * ```
 *
 * **NOTE:** The {@link RemarkTransformDefinition} may be both async or non-async. \
 * Both are handled the same.
 *
 * @field pluginName The plugin's name, use vite-plugin like naming convention e.g.: `remark-plugin:your-name-here`
 * @field transform The actual definition of your plugin, see: {@link RemarkTransformDefinition}
 */
export type RemarkPluginDefinition = {
	/**
	 * ## The plugin's name
	 *
	 * Use vite-plugin like naming convention e.g.: `remark-plugin:your-name-here`
	 */
	pluginName: string
	/**
	 * ## Logic of a [remark `plugin`](https://github.com/remarkjs/remark?tab=readme-ov-file#plugins) transformer
	 *
	 * A basic plugin will look like:
	 *
	 * ```ts
	 * // basic-example.mts
	 * const pluginName = `remark-plugin:basic-example`
	 * export default definePlugin({
	 * 	pluginName,
	 * 	transform(tree, file, settings) {
	 * 		const exampleSettings = getExampleSettings(settings);
	 * 		// This plugin does nothing yet...
	 * 	}
	 * })
	 * ```
	 *
	 * @param context TODO think of a good description
	 */
	transform(context: RemarkPluginContext): Node | void | Promise<Node | void>
}

/**
 * ## Define a [remark `plugin`](https://github.com/remarkjs/remark?tab=readme-ov-file#plugins)
 *
 * The plugin comes with explicit type information **and** an uncaught error handler to prevent the processor from crashing. \
 * A basic plugin will look like:
 *
 * ```ts
 * // basic-example.mts
 * const pluginName = `remark-plugin:basic-example`
 * export default definePlugin({
 * 	pluginName,
 * 	transform(tree, file, settings) {
 * 		// This plugin does nothing yet...
 * 	}
 * })
 * ```
 *
 * **NOTE:** The {@link RemarkTransformDefinition} may be both async or non-async. \
 * Both are handled the same.
 *
 * @param pluginDefinition The actual definition of your plugin, see: {@link RemarkPluginDefinition}
 */
export const definePlugin = (pluginDefinition: RemarkPluginDefinition): RemarkPlugin => {
	const { pluginName } = pluginDefinition

	const plugin: Record<string, PluginBody> = {
		[pluginName]() {
			const settings = (this.data().settings ?? {}) as RemarkPluginSettings
			return async (tree, file, next) => {
				const messageWriter = createMessageWriter(
					tree, file, pluginName,
					settings['trace'] as unknown as boolean ?? false,
				)
				const context = {
					...messageWriter,
					root: tree as Parent,
					file,
					settings,
				}
				try {
					await pluginDefinition.transform(context)
				}
				catch (error_) {
					const error = error_ as Error
					messageWriter.appendError(error.message, tree, {
						stack: error.stack,
						cause: error.cause,
					})
				}
				finally {
					next(undefined, tree, file)
				}
			}
		},
	}
	return Object.defineProperty<PluginBody>(plugin[pluginName], 'name', { value: pluginName })
}
