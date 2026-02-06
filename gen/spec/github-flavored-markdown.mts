import { jsonSchema } from '../json-schema-builder.mts'

const SCHEMA_VERSION = 'v1'
const SCHEMA_HOST_URL = 'https://github.com/Marvin-Brouwer/open-adr/blob/main'

const s = jsonSchema({
	outputDirectory: `./spec/gfm/${SCHEMA_VERSION}/`,
})

// Schemas
export const gfm = s.schema('./gfm.json', {
	title: 'Full md-ast, GitHub flavored markdown, document spec',
	$id: `${SCHEMA_HOST_URL}/spec/gfm/${SCHEMA_VERSION}/gfm.json`,
})

export const root = s.schema('./elements/root.json')
export const blockNode = s.schema('./elements/block-node.json')
export const inlineNode = s.schema('./elements/inline-node.json')

// Block nodes
export const paragraph = s.schema('./elements/paragraph.json')
export const heading = s.schema('./elements/heading.json')
export const thematicBreak = s.schema('./elements/thematic-break.json')
export const blockquote = s.schema('./elements/blockquote.json')
export const list = s.schema('./elements/list.json')
export const listItem = s.schema('./elements/list-item.json')
export const code = s.schema('./elements/code.json')
export const html = s.schema('./elements/html.json')
export const yaml = s.schema('./elements/yaml.json')
export const definition = s.schema('./elements/definition.json')
export const footnoteDefinition = s.schema('./elements/footnote-definition.json')
export const customBlockNode = s.schema('./elements/custom-block-node.json')

// Table nodes
export const table = s.schema('./elements/table.json')
export const tableRow = s.schema('./elements/table-row.json')
export const tableCell = s.schema('./elements/table-cell.json')

// Inline nodes
export const text = s.schema('./elements/text.json')
export const textSingleLine = s.schema('./elements/text-single-line.json')
export const strong = s.schema('./elements/strong.json')
export const emphasis = s.schema('./elements/emphasis.json')
export const strikethrough = s.schema('./elements/strikethrough.json')
export const inlineCode = s.schema('./elements/inline-code.json')
export const link = s.schema('./elements/link.json')
export const linkReference = s.schema('./elements/link-reference.json')
export const image = s.schema('./elements/image.json')
export const imageReference = s.schema('./elements/image-reference.json')
export const breakNode = s.schema('./elements/break.json')
export const footnoteReference = s.schema('./elements/footnote-reference.json')
export const customInlineNode = s.schema('./elements/custom-inline-node.json')

// gfm references root
gfm.ref(() => root)

// Root
root
	.object({
		type: s.required.const('root'),
		children: s.required.array(s.ref(() => blockNode)),
	})

// BlockNode oneOf all block types
blockNode
	.def(
		s.oneOf(
			s.ref(() => root),
			s.ref(() => paragraph),
			s.ref(() => heading),
			s.ref(() => thematicBreak),
			s.ref(() => blockquote),
			s.ref(() => list),
			s.ref(() => listItem),
			s.ref(() => table),
			s.ref(() => code),
			s.ref(() => html),
			s.ref(() => yaml),
			s.ref(() => definition),
			s.ref(() => footnoteDefinition),
			s.ref(() => customBlockNode),
		),
	)

// InlineNode oneOf all inline types
inlineNode
	.def(
		s.oneOf(
			s.ref(() => text),
			s.ref(() => textSingleLine),
			s.ref(() => strong),
			s.ref(() => emphasis),
			s.ref(() => strikethrough),
			s.ref(() => inlineCode),
			s.ref(() => link),
			s.ref(() => linkReference),
			s.ref(() => image),
			s.ref(() => imageReference),
			s.ref(() => breakNode),
			s.ref(() => footnoteReference),
			s.ref(() => customInlineNode),
		),
	)

// Paragraph
paragraph
	.object({
		type: s.required.const('paragraph'),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

// Heading
heading
	.object({
		type: s.required.const('heading'),
		depth: s.required.number(),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

// ThematicBreak
thematicBreak
	.object({
		type: s.required.const('thematicBreak'),
	})
	.order('loose')

// Blockquote
blockquote
	.object({
		type: s.required.const('blockquote'),
		children: s.required.array(s.ref(() => blockNode)),
	})
	.order('loose')

// List
list
	.object({
		type: s.required.const('list'),
		ordered: s.required.boolean(),
		start: s.required.number(),
		spread: s.required.boolean(),
		children: s.required.array(s.ref(() => listItem)),
	})
	.order('loose')

// ListItem
listItem
	.object({
		type: s.required.const('listItem'),
		checked: s.anyOf(s.required.boolean(), s.required.null()),
		spread: s.required.boolean(),
		children: s.required.array(s.ref(() => blockNode)),
	})
	.order('loose')

// Code
code
	.object({
		type: s.required.const('code'),
		lang: s.anyOf(s.required.string(), s.required.null()),
		meta: s.anyOf(s.required.string(), s.required.null()),
		value: s.required.string(),
	})
	.order('loose')

// HTML
html
	.object({
		type: s.required.const('html'),
		value: s.required.string(),
	})
	.order('loose')

// YAML
yaml
	.object({
		type: s.required.const('yaml'),
		value: s.required.string(),
	})
	.order('loose')

// Definition
definition
	.object({
		type: s.required.const('definition'),
		identifier: s.required.string(),
		url: s.required.string(),
		title: s.anyOf(s.required.string(), s.required.null()),
	})
	.order('loose')

// FootnoteDefinition
footnoteDefinition
	.object({
		type: s.required.const('footnoteDefinition'),
		identifier: s.required.string(),
		children: s.required.array(s.ref(() => blockNode)),
	})
	.order('loose')

// Table
table
	.object({
		type: s.required.const('table'),
		align: s.enum(s.const('left'), s.const('right'), s.const('center'), s.null()),
		children: s.required.array(s.ref(() => tableRow)),
	})
	.order('loose')

// TableRow
tableRow
	.object({
		type: s.required.const('tableRow'),
		children: s.required.array(s.ref(() => tableCell)),
	})
	.order('loose')

// TableCell
tableCell
	.object({
		type: s.required.const('tableCell'),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

// Custom nodes
customBlockNode
	.object({
		type: s.required.string(),
	})
	.order('loose')
	.allowAdditional()

customInlineNode
	.object({
		type: s.required.string(),
	})
	.order('loose')
	.allowAdditional()

// Inline nodes
text
	.object({
		type: s.required.const('text'),
		value: s.required.string(),
	})
	.order('loose')

textSingleLine
	.object({
		type: s.required.const('text'),
		value: s.required.string(),
	})
	.order('loose')

strong
	.object({
		type: s.required.const('strong'),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

emphasis
	.object({
		type: s.required.const('emphasis'),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

strikethrough
	.object({
		type: s.required.const('strikethrough'),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

inlineCode
	.object({
		type: s.required.const('inlineCode'),
		value: s.required.string(),
	})
	.order('loose')

link
	.object({
		type: s.required.const('link'),
		url: s.required.string(),
		title: s.oneOf(s.required.string(), s.required.null()),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

linkReference
	.object({
		type: s.required.const('linkReference'),
		identifier: s.required.string(),
		label: s.anyOf(s.required.string(), s.required.null()),
		referenceType: s.anyOf(s.required.string(), s.required.null()),
		children: s.required.array(s.ref(() => inlineNode)),
	})
	.order('loose')

image
	.object({
		type: s.required.const('image'),
		url: s.required.string(),
		alt: s.anyOf(s.required.string(), s.required.null()),
		title: s.anyOf(s.required.string(), s.required.null()),
	})
	.order('loose')

imageReference
	.object({
		type: s.required.const('imageReference'),
		identifier: s.required.string(),
		label: s.anyOf(s.required.string(), s.required.null()),
	})
	.order('loose')
	.allowAdditional()

breakNode
	.object({
		type: s.required.const('break'),
	})
	.order('loose')

footnoteReference
	.object({
		type: s.required.const('footnoteReference'),
		identifier: s.required.string(),
	})
	.order('loose')

// finally, write all schemas
await s.write()
