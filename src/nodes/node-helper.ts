import { Node } from 'unist'
import { visit, type Test } from 'unist-util-visit'

export function scan<TNode extends Node>(tree: Node, test: Test) {
	return new Promise<TNode[]>((resolve) => {
		const results: TNode[] = []
		visit(tree, test, x => results.push(x as TNode))
		resolve(results)
	})
};
