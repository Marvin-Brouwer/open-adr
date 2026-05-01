import type { Node } from 'unist'

export const DescriptorKind: unique symbol = Symbol('descriptor-kind')

export type MatchResult = {
	severity: 'error' | 'warning'
	message: string
} | undefined

export interface MatcherObject {
	readonly min: number
	readonly max: number
	readonly message?: string | ((context: { name?: string }) => string)
	with(message: string | ((context: { name?: string }) => string)): MatcherObject
	validate(function_: (node: Node) => MatchResult): MatcherObject
	test(node: Node): MatchResult
}

export interface BaseDescriptorOptions {
	name?: string
	description?: string
	url?: string
	match?: MatcherObject | ((node: Node) => MatchResult)
}
