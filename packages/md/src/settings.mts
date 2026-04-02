import type { RemarkPluginContext } from '@md-schema/remark-plugin'

export type MdSettingsDefinition = Partial<MdSettings>
export interface MdSettings {
	allowedSchemas?: string[]
	include: string[]
}

export const mdSettingDefaults: MdSettings = Object.freeze({
	include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
})

export const applyMdSettings = (config?: MdSettingsDefinition): MdSettings => {
	if (!config) return mdSettingDefaults
	const settingEntries = (Object.entries<unknown>(config) as [keyof MdSettings, MdSettings[keyof MdSettings]][])
		.filter(([, value]) => !!value)

	const defaultsCopy = Object.assign({}, mdSettingDefaults)
	for (const [key, value] of settingEntries) {
		defaultsCopy[key] = value!
	}

	return defaultsCopy
}
export const getMdSettings = (context: RemarkPluginContext): MdSettings => {
	const userSettings = context.settings['md-schema'] as MdSettingsDefinition
	if (!userSettings) return mdSettingDefaults

	return Object.freeze(applyMdSettings(userSettings))
}
