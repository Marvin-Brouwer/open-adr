# Option 1 with Argument-Based Configuration (No Fluent Chaining)

## Overview

This is **pure argument-based configuration**:
- **No fluent chaining** - everything configured through function arguments
- **Match functions** - `match(node)` returns error or undefined, not regexes
- **Minimal syntax** - `md.list(md.pattern(...))` not `md.list({ items: [...] })`
- **Composable** - reusable parts are just function factories
- **Type-safe** - full TypeScript support through interfaces

## Key Patterns

### Pattern 1: Basic Elements with Config Objects

All elements configured through argument objects with match functions:

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

**Why match functions instead of regexes:**
- More flexible: access full node structure, not just text
- Clearer error handling: return error object with severity and message
- Early exit: natural `if...return` flow
- Can combine multiple conditions easily

### Pattern 2: Lists with Validator Children

`md.list()` accepts validator children directly, no wrapper:

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
- Functions return `undefined` (valid) or error object (invalid)
- Very flexible: match any node structure
- Simple to read: direct JavaScript control flow
- Composable: `prosConsList()` factory returns this whole thing
- No regex verbosity: use JavaScript code for complex validation

### Pattern 3: Sections with Children Array

Sections use `children` property with array of child nodes:

```typescript
schema.section({
  name: 'Decision',
  level: 2,
  required: true,
  children: [
    md.paragraph({ required: true }),
    schema.section({
      name: 'Drivers',
      level: 3,
      children: [
        // drivers here
      ]
    })
  ]
})
```

**Why consistent `children` property:**
- All containers use same key
- Clear what's "inside" vs "alongside"
- Easy to pass children as config: `{ ...config, children: [...]}`

### Pattern 4: Reusable Parts (Factories)

Extracted patterns are simple factory functions returning config objects:

```typescript
const prosConsList = () =>
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

**Why this is better for abstraction:**
- Factories return plain data (config objects), not builder instances
- Easy to compose: `{ ...baseConfig, overrides }`
- Easy to serialize/deserialize as JSON
- Easy to test: assertions on config structure
- Easy to transform: standard JavaScript functions and objects

## Consistency Achieved

| Aspect | Configuration |
|--------|---------------|
| **Creating elements** | All use function call: `md.heading()`, `md.paragraph()`, `schema.section()` |
| **Configuring elements** | All use config object arg: `{ required: true, match(node) { ... } }` |
| **Validation** | All use `match(node)` functions that return `undefined` or error object |
| **Adding children** | All use `children: [...]` property in config |
| **Enforcing order** | Wrap in `schema.strictOrder([...])` |
| **Making optional** | All use `optional: true` in config |
| **Making required** | All use `required: true` in config |

**No fluent chaining anywhere** - everything is argument-based

## Type Structure (Conceptual)

```typescript
// Error result type
type ValidationError = {
  severity: 'error' | 'warning' | 'info'
  message: string
}

// Match function: returns undefined if valid, error object if invalid
type MatchFunction = (node: any) => ValidationError | undefined

// Base element configuration
interface ElementConfig {
  required?: boolean
  optional?: boolean
  description?: string
  match?: MatchFunction  // Function, not regex
}

// Heading configuration
interface HeadingConfig extends ElementConfig {
  // match function inherited
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

// Pattern validator for list items
interface PatternConfig extends ElementConfig {
  match: MatchFunction
}

// Factory functions
function template(config: TemplateConfig): Node
function md.heading(level: number, config?: HeadingConfig): Node
function md.paragraph(config?: ParagraphConfig): Node
function md.pattern(config: PatternConfig): Node
function schema.section(config: SectionConfig): Node
function md.list(...children: Node[]): Node

// Return values are just config objects
const heading = md.heading(1, { required: true })
// heading is: { type: 'heading', level: 1, required: true, match: undefined }

const list = md.list(md.pattern({ match: (node) => ... }))
// list is: { type: 'list', children: [{ type: 'pattern', match: ... }] }
```

## Advantages

✅ **Complete consistency** - no fluent chaining, everything is arguments and config objects  
✅ **Type-safe** - full TypeScript support through config interfaces  
✅ **Visual hierarchy** - indentation shows nesting, `children` array is explicit  
✅ **Match functions** - flexible validation with full node access  
✅ **Explicit ordering** - `strictOrder([...])` makes requirements clear  
✅ **Reusable factories** - extracted parts are plain functions returning configs  
✅ **Easy to abstract** - configs can be composed, merged, transformed easily  
✅ **Readable** - read top-to-bottom tells you document flow  
✅ **Testable** - factories return plain data structures, trivial to test  
✅ **Serializable** - config objects are just data, no builder state  
✅ **Composable** - mix and match parts easily: `{ ...baseConfig, overrides }`

## Example: Real-World Snippet

```typescript
// Pros/cons list with match function
const prosConsList = () =>
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

// Driver entry - minimal config
const driverEntry = (name: string) =>
  schema.section({
    name,
    level: 3,
    optional: true,
    children: [md.paragraph()]
  })

// Template using them
const adrTemplate = template({
  children: [
    md.heading(1, {
      required: true,
      match(node) {
        const text = node.children?.[0]?.value || ''
        if (!text.match(/^`?ADR`?\s+/)) {
          return { severity: 'error', message: 'Must start with ADR' }
        }
      }
    }),
    
    schema.section({
      name: 'Decision',
      level: 2,
      required: true,
      children: [
        md.paragraph({ required: true }),
        schema.section({
          name: 'Drivers',
          level: 3,
          children: [
            driverEntry('remark'),
            driverEntry('json schema'),
            driverEntry('vscode plugin')
          ]
        }),
        schema.section({
          name: 'Pros and Cons',
          level: 3,
          optional: true,
          children: [prosConsList()]
        })
      ]
    })
  ]
})
```

## Summary

This is the **cleanest, most minimal approach**:
- ✅ Argument-based (no fluent chaining)
- ✅ Match functions (flexible validation)
- ✅ Minimal syntax (`md.list(md.pattern(...))` not `md.list({ items: [...] })`)
- ✅ Completely consistent
- ✅ Type-safe throughout
- ✅ Easily composable and serializable
- ✅ Perfect for schema building and reusable parts
