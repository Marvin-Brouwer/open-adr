import type { RemarkPluginContext } from '@md-schema/remark-plugin'

export interface Contributor {
	slug: string
	fullName: string
	profileUrl: string
}

export interface Contributors {
	who: Contributor[]
	source: string
}

export type MdSettingsDefinition = Partial<MdSettings>
export interface MdSettings {
	allowedSchemas?: string[]
	contributors?: Contributors
	include: string[]
}

export const mdSettingDefaults: MdSettings = Object.freeze({
	include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
})

export const applyMdSettings = (config?: MdSettingsDefinition): MdSettings => {
	if (!config) return mdSettingDefaults
	const result: MdSettings = {
		include: config.include ?? mdSettingDefaults.include,
	}
	if (config.allowedSchemas) result.allowedSchemas = config.allowedSchemas
	if (config.contributors) result.contributors = config.contributors
	return result
}
export const getMdSettings = (context: RemarkPluginContext): MdSettings => {
	const userSettings = context.settings['md-schema'] as MdSettingsDefinition
	if (!userSettings) return mdSettingDefaults

	return Object.freeze(applyMdSettings(userSettings))
}
