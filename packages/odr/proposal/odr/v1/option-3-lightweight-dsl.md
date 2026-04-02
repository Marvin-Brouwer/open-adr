# Option 3: Lightweight DSL with Objects

## Overview
A structured object-based format that works like a declarative domain-specific language. Emphasizes clarity and structure with a consistent, predictable schema.

## Example

```typescript
const adrSpec = {
  title: 'Architecture Decision Record',
  description: 'Template for documenting architectural decisions',
  
  structure: [
    {
      node: 'heading',
      level: 1,
      match: /^ADR /,
      required: true,
      error: 'ADR must start with "ADR " in heading level 1',
      help: 'e.g., "# ADR 001: Use TypeScript for new services"'
    },
    {
      node: 'paragraph',
      required: true,
      description: 'Brief description of the decision context'
    },
    {
      node: 'section',
      name: 'Decision',
      level: 2,
      required: true,
      children: [
        {
          node: 'paragraph',
          required: true
        },
        {
          node: 'section',
          name: 'Drivers',
          level: 3,
          optional: true,
          children: [
            {
              node: 'list',
              children: [
                {
                  node: 'listItem',
                  children: [{ node: 'paragraph' }]
                }
              ]
            }
          ]
        },
        {
          node: 'section',
          name: 'Alternatives',
          level: 3,
          optional: true,
          children: [
            {
              node: 'list',
              children: [
                {
                  node: 'listItem',
                  children: [{ node: 'paragraph' }]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      node: 'section',
      name: 'Consequences',
      level: 2,
      children: [
        {
          node: 'paragraph'
        }
      ]
    }
  ]
}
```

## Characteristics

- **Consistent structure** - every node follows same pattern
- **Explicit node types** via `node` property
- **Clear parent-child relationships** through `children` arrays
- **Validation metadata** bundled with structure
- **Error messages and help text** built-in
- **Predictable schema** makes parsing/validation easier

## Pros

- ✅ Very consistent API - once you understand one node, you understand all
- ✅ Easy to build tooling around (parser, validator, visualizer)
- ✅ Natural fit for most document structures
- ✅ Clear metadata (required, optional, validation rules)
- ✅ Easy to generate or transform
- ✅ Works well for generating error messages
- ✅ Straightforward serialization to JSON

## Cons

- ❌ Slightly more verbose than pure composition
- ❌ `node` property feels redundant with TypeScript types
- ❌ Need to repeat structure for lists quite a bit
- ❌ May feel boilerplate-heavy for simple templates

## Implementation Complexity

**Low-Medium** - Just TypeScript interfaces, no special builder needed

## Reusability Pattern

Define reusable "part templates" as constants:

```typescript
// Reusable parts library
const proConsList = {
  node: 'list',
  children: [
    {
      node: 'listItem',
      children: [
        { node: 'strong', content: 'Item: ' },
        { node: 'paragraph' }
      ]
    }
  ]
}

const decisionSection = (name: string, withProCons: boolean = false) => ({
  node: 'section',
  name,
  optional: true,
  children: [
    { node: 'paragraph' },
    ...(withProCons ? [proConsList] : [])
  ]
})

const adrSpec = {
  title: 'Architecture Decision Record',
  structure: [
    {
      node: 'heading',
      level: 1,
      match: /^ADR /,
      required: true
    },
    {
      node: 'section',
      name: 'Decision',
      required: true,
      children: [
        { node: 'paragraph', required: true },
        decisionSection('Drivers'),
        decisionSection('Alternatives'),
        decisionSection('Consequences')
      ]
    }
  ]
}
```

## When to Use This

- You want a balance of structure and simplicity
- You plan to build tooling around these templates
- Consistency matters more than minimal syntax
- You need rich metadata (errors, help text) attached to nodes
- You want a "grammar" that's easy to explain to others
