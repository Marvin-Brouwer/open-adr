import { VFile } from 'vfile';
import { OdrSettings } from '../plugin.mts';
import micromatch from 'micromatch';


export function checkFileIncluded(file: VFile, settings: OdrSettings) {
	const includePatterns = settings?.odr?.include as string[] || [];
	const filePath = file.path || file.history?.[0] || '';
	if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return false;
	return true;
}