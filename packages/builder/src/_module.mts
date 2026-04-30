export { DescriptorKind, type MatchResult, type BaseDescriptorOptions } from './descriptor.mts'

export { fm, compileFmSchema, FmKind } from './fm.mts'
export type {
	FmDescriptor,
	FmItemDescriptor,
	FmObjectDescriptor,
	FmStringDescriptor,
	FmNumberDescriptor,
	FmBooleanDescriptor,
	FmDateDescriptor,
	FmEnumDescriptor,
	FmEnumOptions,
	FmListDescriptor,
	FmContributorsDescriptor,
	FmOptionalDescriptor,
	FmCustomDescriptor,
	FmCustomContext,
	FmSchemaOptions,
} from './fm.mts'

export { md } from './md.mts'
export type {
	HeadingDescriptor,
	ParagraphDescriptor,
	BlockquoteDescriptor,
	CodeBlockDescriptor,
	ListDescriptor,
	TableDescriptor,
	ThematicBreakDescriptor,
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
	ChildrenDefinition,
} from './schema.mts'

export { template } from './template.mts'
export type { ValidationResult, SchemaTemplate, TemplateConfig } from './template.mts'

export {
	getNodeChildren,
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
