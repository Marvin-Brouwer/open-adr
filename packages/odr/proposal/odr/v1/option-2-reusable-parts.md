# Option 2: Reusable Parts with Composition

## Overview
Plain objects defining document structures, with explicit focus on extractable, reusable parts. Mix of object definitions and function composition.

## Example

```typescript
// Define reusable parts
const proConsList = {
  type: 'list',
  items: [
    {
      type: 'listItem',
      children: [
        { type: 'strong', content: 'Item: ' },
        { type: 'paragraph', optional: true }
      ]
    }
  ]
}

const decisionSection = (name: string, children: any[] = []) => ({
  type: 'section',
  name,
  optional: true,
  children: [proConsList, ...children]
})

const adrTemplate = {
  title: 'ADR Document',
  structure: [
    {
      type: 'heading',
      level: 1,
      pattern: /^ADR /,
      required: true,
      error: 'ADR must start with "ADR " in heading'
    },
    {
      type: 'paragraph',
      required: true,
      description: 'Short description'
    },
    {
      type: 'section',
      name: 'Decision',
      required: true,
      children: [
        { type: 'paragraph', required: true },
        decisionSection('Drivers'),
        decisionSection('Alternatives')
      ]
    },
    {
      type: 'section',
      name: 'Consequences',
      description: 'Trade-offs and implications',
      children: [proConsList]
    }
  ]
}
```

## Characteristics

- **Plain objects** as the primary model
- **Functions as part factories** for reusable components
- **Minimal syntax**, low ceremony
- **Explicit composition** through spreading/combining
- Very readable at a glance
- Easy to reason about structure

## Pros

- ✅ Super readable - structure is immediately obvious
- ✅ Parts are obviously reusable and composable
- ✅ Minimal API surface (just object keys)
- ✅ Easy to serialize, debug, and inspect
- ✅ Can be easily documented with comments
- ✅ Functions make parameterization natural
- ✅ Least amount of boilerplate

## Cons

- ❌ Less IDE autocomplete (plain objects need type definitions)
- ❌ Easy to have typos in string keys
- ❌ Fewer compile-time guarantees without strict typing
- ❌ Need to manually write good type definitions for objects

## Implementation Complexity

**Low** - Just need good TypeScript types for the object structure

## Reusability Pattern

Parts are first-class and obviously extractable:

```typescript
// Shared pros/cons across multiple templates
const proConsList = { /* definition */ }
const itemizedList = { /* definition */ }
const decisionSection = (name: string) => ({ /* definition */ })

// Can be imported and used in different templates
const rfc = {
  structure: [
    { type: 'heading', level: 1, required: true },
    decisionSection('Rationale'),
    decisionSection('Trade-offs'),
    { type: 'section', name: 'Pros', children: [proConsList] },
    { type: 'section', name: 'Cons', children: [proConsList] }
  ]
}

const adr = {
  structure: [
    { type: 'heading', level: 1, pattern: /^ADR /, required: true },
    decisionSection('Decision'),
    decisionSection('Drivers'),
    decisionSection('Alternatives'),
    { type: 'section', name: 'Pros', children: [proConsList] }
  ]
}
```

## When to Use This

- You want the simplest, most readable format
- Reusability across templates is a priority
- You want to minimize setup/boilerplate
- Your team values explicitness over cleverness
- Easy onboarding for new contributors is important
