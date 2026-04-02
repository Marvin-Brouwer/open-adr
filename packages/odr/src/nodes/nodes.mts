import type { Literal, Node, Parent } from 'unist'

export type DefinitionNode = Node & { identifier?: 'string', url?: string }
export type HeadingNode = Omit<Node, 'data'> & {
	children: Literal[]
	depth: number
	data: {
		hProperties: Record<string, string>
	}
}
export type SectionNode = Parent & {
	type: 'section'
	depth: number
	name: string
	children: Node[]
	data?: {
		hProperties?: Record<string, string>
	}
}
