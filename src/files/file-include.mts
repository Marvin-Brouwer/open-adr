import micromatch from 'micromatch'
import { VFile } from 'vfile'

import { OdrSettings } from '../settings.mts'

export function checkFileIncluded(file: VFile, { include: includePatterns }: OdrSettings) {
	const filePath = file.path || file.history?.[0] || ''
	if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) return false
	return true
}
