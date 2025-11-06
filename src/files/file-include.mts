import micromatch from 'micromatch'

import { debug } from '../constants.mts'
import { RemarkPluginContext } from '../plugin.mts'
import { getOdrSettings } from '../settings.mts'

export function checkFileIncluded(context: RemarkPluginContext) {
	const { file } = context
	const { include: includePatterns } = getOdrSettings(context)
	const filePath = file.path || file.history?.[0] || ''

	if (includePatterns.length > 0 && !micromatch.isMatch(filePath, includePatterns)) {
		if (debug.logAllFilePatternMismatch) context.writeTrace('ignoring file', filePath)
		return false
	}
	return true
}
