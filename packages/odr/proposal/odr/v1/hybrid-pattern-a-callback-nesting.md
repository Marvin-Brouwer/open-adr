# Hybrid Pattern A: Callback-based Nesting

## Overview
A callback-based approach that creates scoped builders for nested sections. Provides consistency by using the same `.add()` pattern at all nesting levels, with implicit hierarchy through callback structure.

## Example

```typescript
const adrTemplate = template({
  nodes: [
    md.heading(1, { required: true, match: /^ADR / }),
    md.paragraph({ required: true }),
    
    schema.section({ level: 2, required: true }, (section) =>
      section
        .add(md.paragraph({ required: true }))
        .add(
          schema.section({ level: 3, name: 'Drivers', optional: true }, (drivers) =>
            drivers.add(md.list())
          )
        )
        .add(
          schema.section({ level: 3, name: 'Alternatives', optional: true }, (alt) =>
            alt.add(md.list())
          )
        )
    )
  ]
})
```

## Characteristics

- **Callback creates scoped builder** → nesting is implicit in code indentation/structure
- **All nodes use same `.add()` pattern** → complete consistency
- **Type-safe** - full TypeScript support
- **Hierarchical structure** reflected in code structure
- **No array mixing** - everything is fluent
- **Familiar pattern** - common in many builder libraries

## Pros

- ✅ **Complete consistency** - everything uses `.add()` 
- ✅ **Visual hierarchy** - indentation matches document structure
- ✅ **Type-safe** - full IDE support and compile-time checks
- ✅ **No context switching** - same pattern at every level
- ✅ **Clean callback syntax** - scope feels natural
- ✅ **Builder state is scoped** - no confusion about what belongs where

## Cons

- ❌ **Callbacks add nesting depth** - can get deep
- ❌ **More verbose than arrays** - more typing
- ❌ **Parameter handling** - passing config to section, then builder to callback
- ❌ **Slightly less explicit** - callback is implicit scope

## Implementation Pattern

```typescript
class SectionBuilder {
  private children: Node[] = []
  
  add(node: Node): this {
    this.children.push(node)
    return this
  }
  
  build(): Section {
    return { type: 'section', children: this.children }
  }
}

function section(config: SectionConfig, callback: (builder: SectionBuilder) => void): Section {
  const builder = new SectionBuilder()
  callback(builder)
  return { ...config, children: builder.build().children }
}
```

## Reusability Pattern

Factory functions return complete nodes, can be added directly:

```typescript
const prosConsList = () => md.list()
  .item(md.paragraph())

const decisionSection = (name: string, optional: boolean = false) =>
  schema.section({ level: 3, name, optional }, (s) =>
    s.add(prosConsList())
  )

const adrTemplate = template({
  nodes: [
    md.heading(1, { required: true, match: /^ADR / }),
    md.paragraph({ required: true }),
    
    schema.section({ level: 2, required: true }, (section) =>
      section
        .add(md.paragraph({ required: true }))
        .add(decisionSection('Drivers'))
        .add(decisionSection('Alternatives'))
    )
  ]
})
```

## Nesting Examples

```typescript
// Simple nesting
schema.section({ level: 2 }, (s) =>
  s.add(md.paragraph())
)

// Deep nesting - callback style makes hierarchy clear
schema.section({ level: 2 }, (s1) =>
  s1
    .add(md.paragraph())
    .add(
      schema.section({ level: 3 }, (s2) =>
        s2
          .add(md.paragraph())
          .add(
            schema.section({ level: 4 }, (s3) =>
              s3.add(md.paragraph())
            )
          )
      )
    )
)
```

## When to Use This

- You want maximum consistency (same pattern everywhere)
- Your team likes fluent APIs with callbacks
- Readability through indentation is important
- You don't mind slight verbosity for clarity
- Callback-based builders are common in your codebase already
