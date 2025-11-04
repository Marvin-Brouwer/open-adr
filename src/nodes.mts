import type { Literal, Node } from 'unist'

export type DefinitionNode = Node & { identifier?: 'string', url?: string }
export type HeadingNode = Omit<Node, 'data'> & {
	children: Literal[]
	depth: number;
	data: {
		hProperties: Record<string,string>
	}
 }