# Alternative: Flat JSONPath-Based Configuration

## Overview
Instead of nested structure, use a flat array of rules where each rule targets a specific location using JSONPath-like selectors. Structure is defined implicitly through path patterns.

## Example

```typescript
const adrTemplate = schema.template({
  nodes: [
    // Top level
    md.heading(1, { 
      path: '[0]',
      required: true, 
      match: /^ADR /,
      error: 'ADR must start with "ADR " in heading'
    }),
    md.paragraph({ 
      path: '[1]',
      required: true,
      description: 'Short description'
    }),
    
    // Decision section and its children
    schema.section({ 
      path: '[2]',
      level: 2,
      name: 'Decision',
      required: true
    }),
    md.paragraph({ 
      path: '[2].children[0]',
      required: true
    }),
    schema.section({ 
      path: '[2].children[1]',
      level: 3,
      name: 'Drivers',
      optional: true
    }),
    md.list({ 
      path: '[2].children[1].children[0]',
      itemValidator: (item) => item.children[0]?.type === 'paragraph'
    }),
    
    // Alternatives
    schema.section({ 
      path: '[2].children[2]',
      level: 3,
      name: 'Alternatives',
      optional: true
    }),
    md.list({ 
      path: '[2].children[2].children[0]'
    }),
    
    // Consequences
    schema.section({ 
      path: '[3]',
      level: 2,
      name: 'Consequences'
    }),
    md.paragraph({ 
      path: '[3].children[0]'
    })
  ]
})
```

## Alternative Syntax (More Natural JSONPath)

```typescript
const adrTemplate = schema.template({
  nodes: [
    md.heading(1, { 
      path: 'root[0]',
      required: true, 
      match: /^ADR /
    }),
    md.paragraph({ 
      path: 'root[1]',
      required: true
    }),
    schema.section({ 
      path: 'root[2]',
      level: 2,
      required: true
    }),
    md.paragraph({ 
      path: 'root[2].section[0]',
      required: true
    }),
    schema.section({ 
      path: 'root[2].section[1]',
      level: 3,
      name: 'Drivers',
      optional: true
    }),
    md.list({ 
      path: 'root[2].section[1].list'
    })
  ]
})
```

## Characteristics

- **Completely flat** - no nested builders or callbacks
- **Explicit positioning** - every node knows exactly where it goes
- **JSONPath grammar** - familiar to developers/data people
- **No builder classes needed** - just objects
- **Clear data structure** - easy to serialize, inspect, iterate
- **Order-independent definition** - rules can be in any order (path defines location)
- **Single responsibility** - each rule validates one thing

## Pros

- ✅ **Zero nesting** - completely flat configuration
- ✅ **Super explicit** - exactly where each node goes
- ✅ **Easy to understand** - no mental stack to track
- ✅ **Serializable** - just plain objects, no builders
- ✅ **Easy to transform** - filter/map rules easily
- ✅ **Data-driven** - could load from JSON/YAML
- ✅ **No builder complexity** - no `.add()`, `.children()`, callbacks
- ✅ **Pattern discovery** - can see all rules at once

## Cons

- ❌ **Lost visual hierarchy** - structure not obvious from file layout
- ❌ **Path maintenance burden** - if structure changes, all paths shift
- ❌ **Not reusable** - can't extract `[2].children[1]` as a "Drivers section"
- ❌ **More error-prone** - easy to have path typos or conflicts
- ❌ **Less readable** - harder to understand document structure at glance
- ❌ **Path fragility** - rearranging document breaks paths
- ❌ **No composability** - sections can't be reused across templates
- ❌ **Verbose for deep nesting** - paths get very long
- ❌ **Hard to validate** - need to resolve all paths against actual structure

## Problems with This Approach

### Problem 1: Lost Structure
```typescript
// This is readable:
schema.section({ level: 2 })
  .children([
    md.paragraph(),
    schema.section({ level: 3 })
      .children([...])
  ])

// This is not:
md.paragraph({ path: '[2].children[0]' })
schema.section({ path: '[2].children[1]', level: 3 })
// Where's the parent-child relationship visually?
```

### Problem 2: Not Reusable
```typescript
// Fluent approach - reuse easily
const driversSection = () => 
  schema.section({ level: 3, name: 'Drivers' })
    .children([proConsList()])

// JSONPath approach - can't reuse, paths are baked in
// If you use this in multiple templates, paths are wrong
```

### Problem 3: Path Brittleness
```typescript
// Original template
nodes: [
  heading({ path: '[0]' }),
  paragraph({ path: '[1]' }),
  section({ path: '[2]' })
]

// Someone adds a new paragraph before the section
nodes: [
  heading({ path: '[0]' }),
  paragraph({ path: '[1]' }),
  paragraph({ path: '[2]' }),  // NEW - breaks everything below!
  section({ path: '[3]' })     // Now needs to be [3]
]
```

### Problem 4: Long Paths at Depth
```typescript
// Gets very verbose quickly
md.paragraph({ 
  path: 'root[0].children[0].children[1].children[0].children[2]'
})
// vs
schema.section() // Nesting shows structure naturally
  .children([...])
    // clearly one level deeper in parent-child relationship
```

## When This Could Work

These scenarios where JSONPath shines:

### 1. **Validation Rules Only** (Not Building Templates)
```typescript
const adrValidator = schema.rules([
  rule.required({ path: 'root[0]', nodeType: 'heading' }),
  rule.pattern({ path: 'root[0]', pattern: /^ADR / }),
  rule.required({ path: 'root[2].children[0]', nodeType: 'paragraph' }),
  rule.hasChild({ path: 'root[2]', name: 'Decision' })
])
```

### 2. **Complex Selectors with Fluent Fallback**
```typescript
const adrTemplate = template()
  .section({ level: 2, name: 'Decision' }, (decision) =>
    decision
      .paragraph({ required: true })
      .section({ level: 3, name: 'Drivers' })
        .validate({ path: '[0].list' })  // JSONPath for complex validation
  )
```

### 3. **Document Structure Discovery**
```typescript
// "Find where X occurs and validate it"
discover({
  path: 'root[*].section[name="Decision"]',
  validate: { required: true }
})
```

## Recommendation

**Don't go full JSONPath for structure definition.** But consider:

1. **Hybrid approach**: Use fluent for structure (gives you reusability), JSONPath for edge-case validation
2. **JSONPath for validation rules**: Extract validation into separate `rules` concept
3. **Keep fluent for templates**: It preserves hierarchy, reusability, and composability

```typescript
// Template structure (fluent - readable)
const adrTemplate = template()
  .add(md.heading(1, { required: true, match: /^ADR / }))
  .add(
    schema.section({ level: 2, required: true })
      .children([
        md.paragraph({ required: true }),
        driversSection(),
        alternativesSection()
      ])
  )

// Additional validation rules (flat - for edge cases)
const adrValidation = schema.rules([
  rule.validatePath('root[2].section[*]', { noEmptyChildren: true }),
  rule.cross('root[2]', 'root[3]', { mustReference: true })
])
```

## Summary

| Approach | Structure | Reusable | Readable | Maintainable | Best For |
|----------|-----------|----------|----------|--------------|----------|
| **Fluent** (Pattern C) | ✅ Nested | ✅ Yes | ✅ Great | ✅ Yes | Template definition |
| **JSONPath Flat** | ❌ Flat | ❌ No | ❌ Poor | ❌ No (fragile) | Validation rules only |
| **Hybrid** | ✅ Nested + Flat | ✅ Yes | ✅ Both | ✅ Yes | Best overall |

**Stick with Pattern C (Fluent + Factories).** JSONPath is useful as a tool for validation/queries, but not for defining template structure itself.
