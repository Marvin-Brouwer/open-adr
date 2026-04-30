import { DescriptorKind, type BaseDescriptorOptions, type MatchResult } from './descriptor.mts'

import type { MdDescriptor } from './md.mts'

export type SchemaDescriptor = SectionDescriptor | OneOrMoreDescriptor | SectionMapDescriptor
export type NodeDescriptor = MdDescriptor | SchemaDescriptor
export type ChildrenDefinition = NodeDescriptor[] | StrictOrderDescriptor

export interface SectionDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'section'
	readonly level: number
	readonly children: ChildrenDefinition
}

export interface StrictOrderDescriptor {
	readonly [DescriptorKind]: 'strictOrder'
	readonly items: readonly NodeDescriptor[]
}

export interface OneOrMoreDescriptor {
	readonly [DescriptorKind]: 'oneOrMore'
	readonly item: NodeDescriptor
}

export interface SectionMapDescriptor {
	readonly [DescriptorKind]: 'sectionMap'
	readonly sections: readonly SectionDescriptor[]
}

type SectionOptions = Omit<SectionDescriptor, typeof DescriptorKind>

export const schema = {
	section(options: SectionOptions): SectionDescriptor {
		return { ...options, [DescriptorKind]: 'section' }
	},
	strictOrder(...items: NodeDescriptor[]): StrictOrderDescriptor {
		return { [DescriptorKind]: 'strictOrder', items }
	},
	oneOrMore(item: NodeDescriptor): OneOrMoreDescriptor {
		return { [DescriptorKind]: 'oneOrMore', item }
	},
	sectionMap(...sections: SectionDescriptor[]): SectionMapDescriptor {
		return { [DescriptorKind]: 'sectionMap', sections }
	},
	error(message: string): MatchResult {
		return { severity: 'error', message }
	},
	warning(message: string): MatchResult {
		return { severity: 'warning', message }
	},
} as const
