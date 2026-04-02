export { DescriptorKind, type MatchResult, type BaseDescriptorOptions } from './descriptor.mts'

export { md } from './md.mts'
export type {
	HeadingDescriptor,
	ParagraphDescriptor,
	BlockquoteDescriptor,
	CodeBlockDescriptor,
	ListDescriptor,
	FrontmatterDescriptor,
	MdDescriptor,
} from './md.mts'

export { schema } from './schema.mts'
export type {
	SectionDescriptor,
	StrictOrderDescriptor,
	OneOrMoreDescriptor,
	SchemaDescriptor,
	NodeDescriptor,
	ChildrenDef,
} from './schema.mts'

export { template } from './template.mts'
export type { ValidationResult, SchemaTemplate, TemplateConfig } from './template.mts'

export {
	getNodeText,
	asArray,
	isWhitespaceText,
	isLinkNode,
	getHeadingNode,
	hasLinkOnlyHeading,
	hasNonEmptyBody,
	splitTaggedLines,
	isUrlLike,
} from './helpers.mts'
