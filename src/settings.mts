import type { RemarkPluginContext } from './move-later/remark-plugin/plugin.mts'

export type OdrSettingsDefinition = Partial<OdrSettings>
export interface OdrSettings {
	allowedSchemas?: string[]
	include: string[]
}

export const odrSettingDefaults: OdrSettings = Object.freeze({
	include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
})

export const applyOdrSettings = (config?: OdrSettingsDefinition): OdrSettings => {
	if (!config) return odrSettingDefaults
	const settingEntries = (Object.entries<unknown>(config) as [keyof OdrSettings, OdrSettings[keyof OdrSettings]][])
		.filter(([, value]) => !!value)

	const defaultsCopy = Object.assign({}, odrSettingDefaults)
	for (const [key, value] of settingEntries) {
		defaultsCopy[key] = value!
	}

	return defaultsCopy
}
export const getOdrSettings = (context: RemarkPluginContext): OdrSettings => {
	const userSettings = context.settings.odr as OdrSettingsDefinition
	if (!userSettings) return odrSettingDefaults

	return Object.freeze(applyOdrSettings(userSettings))
}
