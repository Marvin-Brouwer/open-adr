import { RemarkPluginContext } from './plugin.mts'

export type OdrSettingsDefinition = Partial<OdrSettings>
export interface OdrSettings {
	allowedSchemas?: string[]
	include: string[]
}

const defaults: OdrSettings = {
	include: ['docs/odr/**/*.md', 'doc/odr/**/*.md'],
}

export const odrSettings = (config?: OdrSettingsDefinition): OdrSettings => Object.assign(defaults, config) as OdrSettings
export const getOdrSettings = (context: RemarkPluginContext): OdrSettings => {
	if (!context.settings.odr) return defaults
	return context.settings.odr as OdrSettings
}
