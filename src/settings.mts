import { PluginSettings } from './plugin.mts'

export type OdrSettingsDefinition = Partial<OdrSettings>;
export type OdrSettings = {
	allowedSchemas?: string[],
	include: string[];
};

const defaults: OdrSettings = {
	include: ['docs/odr/**/*.md', 'doc/odr/**/*.md']
}

export const odrSettings = (config?: OdrSettingsDefinition): OdrSettings => Object.assign(defaults, config) as OdrSettings
export const getSettings = (settings: PluginSettings): OdrSettings => {
	if (!settings.odr) return defaults
	return settings.odr
}