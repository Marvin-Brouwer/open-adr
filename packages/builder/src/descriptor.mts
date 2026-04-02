import type { Node } from 'unist'

export const DescriptorKind: unique symbol = Symbol('descriptor-kind')

export type MatchResult = {
	severity: 'error' | 'warning'
	message: string
} | undefined

export interface BaseDescriptorOptions {
	required?: boolean
	optional?: boolean
	match?(node: Node): MatchResult
}
