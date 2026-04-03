import type { Node } from 'unist'

export function getNodeChildren(node: Node, type: string): Node[]
export function getNodeChildren(node: Node): Node[]
export function getNodeChildren(node: Node, type?: string): Node[] {
	if (!('children' in node) || !Array.isArray(node.children)) return []
	const children = node.children as Node[]
	if (type) return children.filter(child => child.type === type)
	return children
}

export function getNodeText(node: Node | null | undefined): string {
	if (!node) return ''
	if ('value' in node && typeof node.value === 'string') return node.value
	if (node.type === 'break') return '\n'
	return getNodeChildren(node).map(child => getNodeText(child)).join('')
}

export function asArray<T>(value: T[] | undefined | null): T[] {
	return Array.isArray(value) ? value : []
}

export function isWhitespaceText(node: Node): boolean {
	return node.type === 'text' && !('value' in node && typeof node.value === 'string' ? node.value : '').trim()
}

export function isLinkNode(node: Node): boolean {
	return node.type === 'link' || node.type === 'linkReference'
}

export function getHeadingNode(sectionNode: Node): Node | undefined {
	return getNodeChildren(sectionNode).find(child => child.type === 'heading')
}

export function hasLinkOnlyHeading(sectionNode: Node, level: number): boolean {
	const heading = getHeadingNode(sectionNode)
	if (!heading) return false
	if (!('depth' in heading) || heading.depth !== level) return false

	const children = getNodeChildren(heading)
	const meaningfulChildren = children.filter(child => !isWhitespaceText(child))
	return meaningfulChildren.length === 1 && isLinkNode(meaningfulChildren[0])
}

export function hasNonEmptyBody(sectionNode: Node): boolean {
	const children = getNodeChildren(sectionNode)
	if (children.length === 0) return false
	const bodyNodes = children.filter(child => child.type !== 'heading')
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
