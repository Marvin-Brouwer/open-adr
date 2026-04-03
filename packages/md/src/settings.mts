import type { RemarkPluginContext } from '@md-schema/remark-plugin'

export type MdSettingsDefinition = Partial<MdSettings>
export interface MdSettings {
	allowedSchemas?: string[]
	schemas: Record<string, string>
	include: string[]
}

export const mdSettingDefaults: MdSettings = Object.freeze({
	schemas: {},
	include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
})

export const applyMdSettings = (config?: MdSettingsDefinition): MdSettings => {
	if (!config) return mdSettingDefaults
	const result: MdSettings = {
		schemas: config.schemas ?? mdSettingDefaults.schemas,
		include: config.include ?? mdSettingDefaults.include,
	}
	if (config.allowedSchemas) result.allowedSchemas = config.allowedSchemas
	return result
}
export const getMdSettings = (context: RemarkPluginContext): MdSettings => {
	const userSettings = context.settings['md-schema'] as MdSettingsDefinition
	if (!userSettings) return mdSettingDefaults

	return Object.freeze(applyMdSettings(userSettings))
}
