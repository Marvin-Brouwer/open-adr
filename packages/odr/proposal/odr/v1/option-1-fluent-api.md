# Option 1: Fluent/Chainable API (Document-Focused)

## Overview
A chainable, fluent API that builds document templates through method calls. Similar to the existing builder pattern but focused on document structure rather than JSON schema generation.

## Example

```typescript
const adrTemplate = template('ADR')
  .title({
    required: true,
    pattern: /^ADR /,
    description: 'Main title starting with ADR'
  })
  .section('Decision', {
    required: true,
    children: [
      part.paragraph({ required: true }),
      part.optional.section('Drivers', { children: [part.list()] }),
      part.optional.section('Alternatives', { children: [part.list()] })
    ]
  })
  .section('Consequences', {
    description: 'Trade-offs and implications',
    children: [
      part.list({ items: [
        part.listItem({ children: [part.paragraph()] })
      ]})
    ]
  })
```

## Characteristics

- **Method chaining** for readability
- **Type-safe** in TypeScript
- **IDE autocomplete** friendly
- **Composable** through method parameters
- Similar to existing builder patterns in the codebase
- Familiar for developers used to fluent APIs

## Pros

- ✅ Very discoverable through IntelliSense
- ✅ Natural progression (reads like building a document)
- ✅ Already have builder infrastructure you understand
- ✅ Easy to add validation through method parameters
- ✅ Can be extended with new methods easily

## Cons

- ❌ More verbose than plain objects
- ❌ Requires more upfront builder class setup
- ❌ Can become unwieldy with deep nesting
- ❌ Method names need to be carefully chosen to avoid conflicts
- ❌ Harder to serialize (need custom toJSON)

## Implementation Complexity

**Medium** - Would leverage existing builder patterns from `json-schema-builder.mts`

## Reusability Pattern

Parts would be defined as pre-built objects or factory functions:

```typescript
const proConsList = (name: string) =>
  part.section(name, {
    children: [
      part.list({
        items: [
          part.listItem({
            children: [
              part.strong({ content: 'Item: ' }),
              part.paragraph({ optional: true })
            ]
          })
        ]
      })
    ]
  })

const adrTemplate = template('ADR')
  .section('Decision', {
    children: [
      part.paragraph({ required: true }),
      ...proConsList('Drivers'),
      ...proConsList('Alternatives')
    ]
  })
```

## When to Use This

- You want consistent experience with existing builder infrastructure
- Your team is comfortable with fluent APIs
- You need strong IDE support and type safety
- You're okay with slightly more verbose definitions
