# Pattern C Example: Remark Guided Docs ADR Template

## Overview
This example shows **Pattern C (Factory Functions + Fluent API)** applied to validate the real ADR document at `demo/docs/architecture/2025-11-19.remark-guided-docs.md`.

## Document Structure Being Validated

The example document has this structure:

```
Frontmatter (YAML metadata)
│
Link references (footnote-style)
│
# `ADR` Remark guided markdown          ← Main heading (required)
│
<!-- HTML comment -->                   ← Optional context
│
> [!NOTE] Note block                   ← Optional admonition
│
```yml                                  ← Optional metadata block
status: proposed
created: 2025-11-19
```
│
Body paragraphs (problem context)        ← 1-5 paragraphs
│
## Decision:                             ← Main section (required)
│ ├─ Intro paragraph
│ │
│ ├─ ### Drivers
│ │  ├─ #### Remark              ← subsection + description
│ │  ├─ #### JSON Schema         ← subsection + description
│ │  └─ #### VSCode Plugin       ← subsection + description
│ │
│ └─ ### Alternatives
│    ├─ #### Markdownlint        ← alternative + dismissal
│    └─ [other alternatives]
│
## Outcome:                              ← Optional section
│ ├─ Intro paragraph
│ │
│ └─ ### Pros and cons
│    └─ List of pros/cons
│
## References:                           ← Optional section
└─ List of links
```

## Pattern C Structure

### 1. Reusable Parts (Factories)

```typescript
// Specific pros/cons pattern
const prosConsList = () =>
  md.list({
    itemsMatch: {
      pattern: /^`(pro|con)`\s+/,
      description: 'Items must start with `pro` or `con` tag'
    }
  })
```

**Why this is good:**
- `prosConsList` is extracted as a factory function
- Can be reused in multiple templates (RFCs, proposals, etc.)
- Encapsulates the specific pattern (must start with `pro`/`con`)
- Easy to test in isolation

```typescript
// Driver sections that repeat
const driverSection = (name: string) =>
  schema.section({
    name,
    level: 3,
    optional: true
  }).children([
    md.paragraph({ optional: true })
  ])
```

**Why this is good:**
- Each driver has same structure: heading + description
- Named factory with parameter (`name`) makes it composable
- Can add multiple drivers without repetition
- Easy to change driver validation in one place

```typescript
// Alternatives with similar structure
const alternativeOption = (name: string) =>
  schema.section({
    name,
    level: 4,
    optional: true
  }).children([
    md.blockquote({ optional: true }),     // Often has dismissal reason
    md.paragraph({ optional: true })
  ])
```

**Why this is good:**
- Some alternatives have blockquotes (dismissal reasons), paragraphs, or both
- Parameterized by name
- Encapsulates the alternative structure

### 2. Composite Parts

These build on simpler factories:

```typescript
// Drivers section groups all driver entries
const decisionContent = () =>
  schema.container({ type: 'decision-content' })
    .children([
      md.paragraph({ required: true }),
      driverSection('remark'),
      driverSection('json schema'),
      driverSection('vscode: unifiedjs.vscode-remark'),
      alternativesSection()
    ])
```

**Why this is good:**
- Drivers and alternatives are grouped together
- Each driver uses the factory, avoiding repetition
- If you need to add a new driver, just add another `driverSection()` call
- Structure is completely flat and readable

### 3. Main Template (Fluent)

```typescript
export const remarkGuidedDocsADR = template()
  .add(md.frontmatter({ optional: true }))
  .add(md.linkReferences({ optional: true }))
  .add(md.heading(1, { required: true, match: /^`?ADR`?\s+/ }))
  .add(md.htmlComment({ optional: true }))
  .add(md.blockquote({ optional: true }))
  .add(md.codeBlock({ optional: true, language: 'yml' }))
  .add(md.paragraph({ minOccurrences: 1, maxOccurrences: 5 }))
  .add(
    schema.section({ name: 'Decision', level: 2, required: true })
      .children([
        md.paragraph({ required: true }),
        decisionContent()
      ])
  )
  .add(
    schema.section({ name: 'Outcome', level: 2, optional: true })
      .children([outcomeContent()])
  )
  .add(referencesSection())
```

**Why this is good:**
- Reading top-to-bottom shows document flow
- Clear what's required vs optional
- Easy to reorder sections
- Type-safe (TypeScript catches mistakes)
- No nested callbacks or complexity

## Key Pattern C Principles Applied Here

| Principle | Example |
|-----------|---------|
| **Factory functions for parts** | `prosConsList()`, `driverSection(name)`, `alternativeOption(name)` |
| **Fluent for structure** | `template().add(...).add(...).add(...)` |
| **Reusability** | `prosConsList` can be used in multiple templates |
| **Composability** | `decisionContent()` uses `driverSection()` multiple times |
| **Explicitness** | Each part is named and clear: `md.heading()`, `schema.section()` |
| **Type safety** | Full TypeScript support, IDE autocomplete |
| **No nesting depth** | Core template stays flat with `.add()` calls |
| **Children clarity** | Sections use `.children([...])` to be explicit about nesting |

## Validation Behavior

When you call `remarkGuidedDocsADR.validate(doc)`, it would:

✅ **Pass these checks:**
- Heading starts with "ADR" in level 1
- Has a Decision section with drivers and alternatives
- Drivers have proper structure
- Alternatives have proper structure
- Pros/cons list items start with `pro` or `con`
- Optional sections (Outcome, References) can be present or absent

⚠️ **Warn about (optional things missing):**
- No frontmatter metadata
- No outcome section
- No references section

❌ **Fail on these:**
- Missing main ADR heading
- Missing Decision section
- Decision section without intro paragraph
- Wrong heading levels for drivers/alternatives

## Comparison to Other Patterns

| Aspect | Pattern A (Callbacks) | Pattern B (Children) | Pattern C (Factories) |
|--------|----------------------|----------------------|----------------------|
| This example readability | Need 3-level callbacks | Medium | **Best** |
| Reusable parts | Hard to extract | Doable | **Excellent** |
| Type safety | ✅ Yes | ✅ Yes | ✅ Yes |
| Scalability | Gets deep | Gets verbose | **Scales well** |

## Why Pattern C Wins Here

1. **`prosConsList()` is reusable** - Extract once, use everywhere (ADR, RFC, decision log)
2. **`driverSection(name)` is parameterized** - Add drivers without code duplication
3. **Top-level template is readable** - Shows document flow at a glance
4. **No nesting nightmares** - `.add()` chains are clean vs callback pyramids
5. **Factory functions are testable** - Each part can be validated independently

## Extension Points

If you wanted to extend this template:

```typescript
// Add new driver
.add(driverSection('Compliance considerations'))

// Add custom section
.add(
  schema.section({ name: 'Custom Section', level: 2 })
    .children([...])
)

// Reuse prosConsList in Outcome section
.add(
  schema.section({ name: 'Outcome', level: 2 })
    .children([
      md.paragraph(),
      schema.section({ name: 'Pros and cons', level: 3 })
        .children([prosConsList()])
    ])
)
```

All of these are easy to add without restructuring the existing template!
