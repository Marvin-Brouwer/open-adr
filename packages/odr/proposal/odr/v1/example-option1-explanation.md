# Option 1 with Argument-Based Configuration

## Overview
This is **Option 1 (Argument-based API)** with:
- **No fluent chaining** - everything configured through function arguments
- **Consistent objects** - all nodes defined the same way
- **Easy to abstract** - parts are plain data structures
- **Composable** - reusable parts are just function returns
- **Type-safe** - full TypeScript support through interfaces

## Key Patterns

### Pattern 1: Basic Elements with Config Objects

All elements configured through argument objects:

```typescript
md.heading(1, {
  required: true,
  match(node) {
    const text = node.children?.[0]?.value || ''
    if (!text.match(/^`?ADR`?\s+/)) {
      return { severity: 'error', message: 'Document must start with "# `ADR` Title"' }
    }
  }
})
```

No method chaining - everything is an argument. Match functions return error objects or undefined.

### Pattern 2: Lists with Custom Item Validators

`md.list()` accepts validator children directly (no `items` wrapper):

```typescript
md.list(
  md.pattern({
    match(node) {
      const text = node.value || ''
      if (!text.match(/^`(pro|con)`\s+/)) {
        return { severity: 'error', message: 'Items must start with `pro` or `con` tag' }
      }
    }
  })
)
```

**Why this works:**
- Functions all return either undefined (valid) or error objects
- Very flexible: match any node structure you want
- Simple to read: direct control flow, early return on error
- Composable: `prosConsList()` is just a factory returning this config
- No regex verbosity: use JavaScript code for complex matching

### Pattern 3: Sections with Children Array

Sections (and containers) use `children` array in config:

```typescript
schema.section({
  name: 'Decision',
  level: 2,
  required: true,
  children: [
    // All children go in this array
    schema.strictOrder([
      md.paragraph({ required: true }),
      schema.section({ name: 'Drivers', level: 3, children: [...] }),
      schema.section({ name: 'Alternatives', level: 3, children: [...] })
    ])
  ]
})
```

**Why consistent `children` property:**
- All containers use same key
- Clear what's "inside" vs "alongside"
- Easy to pass as prop: `{ ...config, children: [...] }`

### Pattern 4: Reusable Parts (Factory Functions)

Extracted patterns are simple factory functions returning config objects:

```typescript
const driverEntry = (name: string) =>
  schema.section({
    name,
    level: 3,
    optional: true,
    children: [
      md.paragraph()
    ]
  })
```

Used multiple times without repetition:

```typescript
driverEntry('remark'),
driverEntry('json schema'),
driverEntry('vscode: unifiedjs.vscode-remark')
```

**Why this is better for abstraction:**
- Factories return plain data (config objects), not builder instances
- Easy to compose: `{ ...baseConfig, customProp: value }`
- Easy to serialize/deserialize
- Easy to test: just test the config structure
- Easy to transform: just functions and objects

## Full Document Structure

```
template()
  .children([
    // PREAMBLE (optional, in order)
    strictOrder([
      frontmatter (optional),
      linkReferences (optional)
    ]),

    // MAIN HEADING (required)
    heading(1, required, pattern: /ADR /)

    // CONTEXT (optional, in order)
    strictOrder([
      htmlComment (optional),
      blockquote (optional),
      codeBlock (optional),
      paragraph (1-5 required)
    ]),

    // DECISION (required, ordered internally)
    section "Decision"
      └─ strictOrder([
         ├─ paragraph (required)
         ├─ section "Drivers" (contains multiple driverEntry's)
         └─ section "Alternatives" (contains multiple alternativeEntry's)
         ])

    // OUTCOME (optional, ordered internally)
    section "Outcome" (optional)
      └─ strictOrder([
         ├─ paragraph (required)
         └─ section "Pros and cons"
         ])figuration |
|--------|---------------|
| **Creating elements** | All use function call: `md.heading()`, `md.paragraph()`, `schema.section()` |
| **Configuring behavior** | All use config object: `{ required: true, match: /.../, error: '...' }` |
| **Adding children** | All use `children: [...]` property |
| **Enforcing order** | Wrap in `schema.strictOrder([...])` |
| **Making optional** | All use `optional: true` in config |
| **Making required** | All use `required: true` in config |
| **Validation rules** | All use config properties: `match`, `error`, `pattern`, `itemsMatch` |

**No fluent chaining anywhere** - everything is argument-based
## Consistency Achieved

| Aspect | Consistency |
|--------|-------------|
| **Creating elements** | `.heading()`, `.paragraph()`, etc all fluent |
| **Adding children** | All use `.children([...])` |
| **Enforcing order** | Wrap in `schema.strictOrder([...])` |
| **Making optional** | `.optional(true)` on any element |
| **Making required** | `.required(true)` on any element |
| **Validation rules** | `.match()`, `.error()`, `.itemMatch()`, etc |
no fluent chaining, everything is arguments and config objects  
✅ **Type-safe** - full TypeScript support through config interfaces  
✅ **Visual hierarchy** - indentation shows nesting, `children` array is explicit  
✅ **Explicit ordering** - `strictOrder([...])` makes requirements clear  
✅ **Reusable factories** - extracted parts are just plain functions returning configs  
✅ **Easy to abstract** - configs can be composed, merged, transformed easily  
✅ **Readable** - read top-to-bottom tells you document flow  
✅ **Testable** - each factory returns plain data structures, trivial to test  
✅ **Serializable** - config objects are just data, no builder state  
✅ **Composable** - mix and match parts easily: `{ ...baseConfig, overrides }`
✅ **No callback hell** - no pyramids of callbacks/nesting  
✅ **Readable** - read top-to-bottom tells you document flow  
✅ *Type Structure (Conceptual)

```typescript
// Base element configuration
interface ElementConfig {
  required?: boolean
  optional?: boolean
  description?: string
  error?: string
}

// Heading configuration
interface HeadingConfig extends ElementConfig {
  match?: RegExp
}

// Paragraph configuration
interface ParagraphConfig extends ElementConfig {
  minOccurrences?: number
  maxOccurrences?: number
}

// Section configuration
interface SectionConfig extends ElementConfig {
  name?: string
  level?: number
  children?: Node[]
}

// List configuration
interface ListConfig extends ElementConfig {
  items?: (ItemValidator | ItemPattern)[]
}
revious Approaches

| Aspect | Fluent (No This) | Callbacks | Pattern C (Factories+Fluent) | This (Args Only) |
|--------|-----------------|-----------|-----------------------------|--------------------|
| **Reusable parts** | ❌ Harder | ⚠️ Possible | ✅ Factories | ✅ Factories |
| **Fluent API** | ✅ Yes | ✅ Yes | ⚠️ Mixed | ❌ No |
| **Consistency** | ❌ Mixed | ❌ Mixed | ⚠️ Mostly | ✅ Complete |
| **Easy to abstract** | ❌ No | ❌ No | ⚠️ Yes | ✅ Yes |
| **Type safety** | ✅ Strong | ✅ Strong | ✅ Strong | ✅ Strong |
| **Readability** | ✅ Good | ⚠️ Deep nesting | ✅ Good | ✅ Good |
| **Child definition** | `.children()` | `.children()` | `.children([...])` | `children: [...]` |
| **Serializable** | ❌ No (builder state) | ❌ No | ⚠️ Somewhat | ✅ Yes |
| **Composable** | ❌ No | ❌ No | ⚠️ Somewhat | ✅ Yes

// Return values are just config objects, not builder instances
## Why This Works Better

1. **No builder state** - Everything is just data (config objects)
2. **Easy to compose** - Mix configs: `{ ...base, overrides }`
3. **Trivially serializable** - Just pass to JSON.stringify if needed
4. **Easy to test** - Factories return plain objects, test assertions are simple
5. **Easy to transform** - Filter, map, modify configs with standard JS functions
6. **Explicit ordering** - `schema.strictOrder([...])` makes rules clear
7. **Factory abstraction** - Reusable parts are just functions, no builder magic
| Aspect | Option 1 (This) | Pattern C |
|--------|-----------------|-----------|
| **Reusable parts** | Factories ✅ | Factories ✅ |
| **Fluent API** | Everything ✅ | Top level only |
| **Consistency** | Complete ✅ | Mixed `.children()` and arrays |
| **No callbacks** | ✅ Yes | ✅ Yes |
| **Type safety** | ✅ Strong | ✅ Strong |
| **Readability** | High ✅ | High ✅ |
| **Child definition** | `.children([...])` | `.children([...])` |
| **Ordering control** | `strictOrder` ✅ | No explicit control |

## Why This Works Better Than Pure Pattern C

1. **Everything is fluent** - No breaking into arrays for structured children
2. **Explicit ordering** - `schema.strictOrder()` makes rules clear
3. **Same method everywhere** - `.children()` means "has child nodes"
4. **Flexible** - `strictOrder([...])` or plain `[...]` based on need
5. **Type-safe factories** - Reusable parts are chainable builders
6. **Clear intent** - `required()`, `optional()`, `strictOrder()` all explicit

## Real Example Snippet

```typescript
// Drivers are bu{
    name,
    level: 3,
    optional: true,
    children: [md.paragraph()]
  })

// And used multiple times
schema.section({
  name: 'Drivers',
  level: 3,
  children: [
    driverEntry('remark'),
    driverEntry('json schema'),
    driverEntry('vscode plugin')
  ]
})
```

Very readable, zero repetition, completely argument-based

Very readable, zero repetition, completely fluent.

## Extension

Adding a new driver is trivial:

```typescript
schema.section()
  .name('Drivers')
  .level(3)
  .children([
    driverEntry('remark'),
    driverEntry('json schema'),
    driverEntry('vscode plugin'),
    driverEntry('compliance considerations')  // ← Just add this
  ])
```
argument-based configuration done right**:
- ✅ No fluent chaining - just functions and config objects
- ✅ Consistent config objects for all elements
- ✅ `children: [...]` property for all nesting
- ✅ `schema.strictOrder([...])` for explicit ordering
- ✅ Reusable factory functions
- ✅ Type-safe through interfaces
- ✅ Readable hierarchical structure
- ✅ Easily composable and serializable
- ✅ Complete consistency (no mixing patterns)
- ✅ Easy to abstract and extendctions
- ✅ Type-safe and readable
- ✅ No callback nesting
- ✅ Complete consistency
