import { DescriptorKind, type BaseDescriptorOptions } from './descriptor.mts'

export interface HeadingDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'heading'
	readonly level: number
}

export interface ParagraphDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'paragraph'
	readonly minOccurrences?: number
	readonly maxOccurrences?: number
}

export interface BlockquoteDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'blockquote'
}

export interface CodeBlockDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'codeBlock'
	readonly language?: string
}

export interface ListDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'list'
	readonly ordered?: boolean
	readonly minItems?: number
	readonly maxItems?: number
}

export interface TableDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'table'
}

export interface ThematicBreakDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'thematicBreak'
}

export interface FrontmatterDescriptor extends BaseDescriptorOptions {
	readonly [DescriptorKind]: 'frontmatter'
}

export type MdDescriptor
	= | HeadingDescriptor
	| ParagraphDescriptor
	| BlockquoteDescriptor
	| CodeBlockDescriptor
	| ListDescriptor
	| TableDescriptor
	| ThematicBreakDescriptor
	| FrontmatterDescriptor

type HeadingOptions = Omit<HeadingDescriptor, typeof DescriptorKind | 'level'>
type ParagraphOptions = Omit<ParagraphDescriptor, typeof DescriptorKind>
type BlockquoteOptions = Omit<BlockquoteDescriptor, typeof DescriptorKind>
type CodeBlockOptions = Omit<CodeBlockDescriptor, typeof DescriptorKind>
type ListOptions = Omit<ListDescriptor, typeof DescriptorKind>
type TableOptions = Omit<TableDescriptor, typeof DescriptorKind>
type ThematicBreakOptions = Omit<ThematicBreakDescriptor, typeof DescriptorKind>
type FrontmatterOptions = Omit<FrontmatterDescriptor, typeof DescriptorKind>

export const md = {
	heading(level: number, options?: HeadingOptions): HeadingDescriptor {
		return { ...options, [DescriptorKind]: 'heading', level }
	},
	paragraph(options?: ParagraphOptions): ParagraphDescriptor {
		return { ...options, [DescriptorKind]: 'paragraph' }
	},
	blockquote(options?: BlockquoteOptions): BlockquoteDescriptor {
		return { ...options, [DescriptorKind]: 'blockquote' }
	},
	codeBlock(options?: CodeBlockOptions): CodeBlockDescriptor {
		return { ...options, [DescriptorKind]: 'codeBlock' }
	},
	list(options?: ListOptions): ListDescriptor {
		return { ...options, [DescriptorKind]: 'list' }
	},
	table(options?: TableOptions): TableDescriptor {
		return { ...options, [DescriptorKind]: 'table' }
	},
	thematicBreak(options?: ThematicBreakOptions): ThematicBreakDescriptor {
		return { ...options, [DescriptorKind]: 'thematicBreak' }
	},
	frontmatter(options?: FrontmatterOptions): FrontmatterDescriptor {
		return { ...options, [DescriptorKind]: 'frontmatter' }
	},
} as const
