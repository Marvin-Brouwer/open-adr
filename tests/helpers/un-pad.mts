/**
 * ## Un pad
 *
 * Removes the left padding from each line based on the most - left character.\
 * Ignores empty lines
 */
export function unPad(text: string) {
	const lines = text
		.split('\n')
		.filter(line => line.trim() !== '')
	const tabIndentSize = lines
		.map(line => line.length - line.trimStart().length)
		.toSorted((a, b) => a - b)
		.at(0) ?? 0

	const tabIndent = '\t'.repeat(tabIndentSize)
	return text.trim().replaceAll(tabIndent, '')
}
/**
 * ## Markdown string
 *
 * Basically {@link unPad} but it adds a newline as markdown should.
 *
 * _Removes the left padding from each line based on the most-left character.\
 * Ignores empty lines_
 *
 */
export function md(markdown: string) {
	return unPad(markdown) + '\n'
}
