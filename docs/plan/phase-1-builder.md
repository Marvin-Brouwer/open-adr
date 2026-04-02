# Phase 1: `@md-schema/builder`

## Goal

Create the `packages/builder/` package providing the full schema builder API: factories, validation engine, and reusable helpers.

## New Package: `packages/builder/`

### Source Files

| File | Purpose |
|------|---------|
| `src/descriptor.mts` | Shared `DescriptorKind` symbol, `MatchResult` type, `BaseDescriptorOptions` interface |
| `src/md.mts` | `md.*` factories + descriptor types (`HeadingDescriptor`, `ParagraphDescriptor`, etc.) |
| `src/schema.mts` | `schema.*` factories + descriptor types (`SectionDescriptor`, `StrictOrderDescriptor`, `OneOrMoreDescriptor`) |
| `src/template.mts` | `template()` function returning `{ validate(root): ValidationResult[] }` — the matching algorithm is private to this file |
| `src/helpers.mts` | Reusable node helpers for template authors |
| `src/_module.mts` | Re-exports `{ template, schema, md }` and all helpers |

### Config Files

`package.json`, `tsconfig.json`, `tsconfig.lib.json`, `tsconfig.test.json`, `tsconfig.config.json`, `tsup.config.mts`

## API Surface

### `md.*` factories

```ts
md.heading(level, options?)    → HeadingDescriptor
md.paragraph(options?)         → ParagraphDescriptor      // supports minOccurrences/maxOccurrences
md.blockquote(options?)        → BlockquoteDescriptor
md.codeBlock(options?)         → CodeBlockDescriptor       // supports language filter
md.list(options?)              → ListDescriptor
md.frontmatter(options?)       → FrontmatterDescriptor
```

### `schema.*` factories

```ts
schema.section(options)        → SectionDescriptor         // { level, name?, children, match? }
schema.strictOrder(...items)   → StrictOrderDescriptor     // variadic
schema.oneOrMore(item)         → OneOrMoreDescriptor
```

### `template()` factory

```ts
template(config) → SchemaTemplate { validate(root: Parent): ValidationResult[] }
```

Config accepts `children: ChildrenDef` and optional `ignoreTypes: string[]` (default: `['definition', 'html']`).

### Helpers

Generic helpers for template authors:

- `getNodeText(node)` — recursively extract text
- `asArray<T>(value)` — normalize to array
- `isWhitespaceText(node)` — whitespace-only text node check
- `isLinkNode(node)` — link or linkReference check
- `getHeadingNode(sectionNode)` — find heading child in section
- `hasLinkOnlyHeading(sectionNode, level)` — heading is a single link
- `hasNonEmptyBody(sectionNode)` — section has substantive content
- `splitTaggedLines(text)` — split into trimmed non-empty lines
- `isUrlLike(value)` — basic URL pattern check

## Validation Algorithm

### `strictOrder` mode

Walk descriptors and AST children sequentially:
- Match current descriptor against current (non-ignored) AST child
- If match → validate and advance both pointers
- If no match + optional → advance descriptor only
- If no match + required → error
- `oneOrMore` → consume consecutive matches (min 1)
- `minOccurrences`/`maxOccurrences` → consume range
- Remaining unmatched AST children → warnings

### Regular array mode

Presence-based lookup (order doesn't matter):
- For each descriptor, search children for a type match
- Sections matched by type + level + name (if set)
- Required descriptors with no match → error
- Unmatched AST children → warnings

## Tests

| File | Coverage |
|------|----------|
| `tests/md.test.ts` | Factory output shapes, DescriptorKind tags |
| `tests/schema.test.ts` | Section, strictOrder, oneOrMore factories |
| `tests/helpers.test.ts` | All helper functions |
| `tests/template.test.ts` | Full validation: strictOrder, array, oneOrMore, occurrences, match callbacks, ignored nodes, nesting, missing/extra nodes |
