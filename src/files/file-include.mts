import micromatch from 'micromatch';
import { VFile } from 'vfile';

import { PluginSettings } from '../plugin.mts';
import { getSettings } from '../settings.mts';

export function checkFileIncluded(file: VFile, settings: PluginSettings) {
	const { include: includePatterns } = getSettings(settings);
	const filePath = file.path || file.history?.[0] || '';
	if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return false;
	return true;
}