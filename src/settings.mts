import type { RemarkPluginContext } from './plugin.mts'

export type OdrSettingsDefinition = Partial<OdrSettings>
export interface OdrSettings {
	allowedSchemas?: string[]
	include: string[]
}

const defaults: OdrSettings = Object.freeze({
	include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
})

export const odrSettings = (config?: OdrSettingsDefinition): OdrSettings => Object.assign({}, defaults, config) as OdrSettings
export const getOdrSettings = (context: RemarkPluginContext): OdrSettings => {
	const userSettings = context.settings.odr as OdrSettingsDefinition
	if (!userSettings) return defaults

	return {
		include: userSettings.include ?? defaults.include,
		allowedSchemas: userSettings.allowedSchemas ?? defaults.allowedSchemas,
	} as OdrSettings
}
