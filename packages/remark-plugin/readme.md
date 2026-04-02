# `@md-schema/remark-plugin`

A simple wrapper around the remark plugin system.

## Why?

Writing remark plugins had some patterns allowing you to write differently structured plugins, with different levels of usefulness. \
This utility creates a unified way of writing plugins + adds an inline documented, user-friendly, context wrapper.

## How?

```typescript
export const pluginName = 'remark-plugin:example'
export default definePlugin({
	pluginName,
	// Any uncaught error in this plugin will be written as an error on the file instead of crashing the remark server.
	async transform(context) {
		// The context object there is inline documented 
		// - It wraps built-in `root` and `file`
		// - It auto-includes the remark settings
		// - It adds a MessageWriter type for helpful error and warning writing
		
	}
})
```
