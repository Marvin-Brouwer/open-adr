import type { Node } from 'unist'

export function getNodeText(node: Node | null | undefined): string {
	if (!node) return ''
	if ('value' in node && typeof node.value === 'string') return node.value
	if (!('children' in node) || !Array.isArray(node.children)) return ''
	return (node.children as Node[]).map(child => getNodeText(child)).join('')
}

export function asArray<T>(value: T[] | undefined | null): T[] {
	return Array.isArray(value) ? value : []
}

export function isWhitespaceText(node: Node): boolean {
	return node.type === 'text' && !String(('value' in node ? node.value : '') || '').trim()
}

export function isLinkNode(node: Node): boolean {
	return node.type === 'link' || node.type === 'linkReference'
}

export function getHeadingNode(sectionNode: Node): Node | undefined {
	if (!('children' in sectionNode) || !Array.isArray(sectionNode.children)) return undefined
	return (sectionNode.children as Node[]).find(child => child.type === 'heading')
}

export function hasLinkOnlyHeading(sectionNode: Node, level: number): boolean {
	const heading = getHeadingNode(sectionNode)
	if (!heading) return false
	if (!('depth' in heading) || heading.depth !== level) return false

	const children = 'children' in heading && Array.isArray(heading.children)
		? heading.children as Node[]
		: []
	const meaningfulChildren = children.filter(child => !isWhitespaceText(child))
	return meaningfulChildren.length === 1 && isLinkNode(meaningfulChildren[0])
}

export function hasNonEmptyBody(sectionNode: Node): boolean {
	if (!('children' in sectionNode) || !Array.isArray(sectionNode.children)) return false
	const bodyNodes = (sectionNode.children as Node[]).filter(child => child.type !== 'heading')
	return bodyNodes.some((child) => {
		const text = getNodeText(child).trim()
		return !!text || child.type === 'blockquote' || child.type === 'list' || child.type === 'code'
	})
}

export function splitTaggedLines(text: string): string[] {
	return text
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(Boolean)
}

export function isUrlLike(value: string): boolean {
	return /^(https?:\/\/|\.?\.?\/)/.test(value)
}
