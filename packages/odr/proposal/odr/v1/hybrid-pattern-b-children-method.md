# Hybrid Pattern B: Fluent with `.children()`

## Overview
Explicit `.children()` method for nesting instead of callbacks. Everything uses either `.add()` (for siblings) or `.children()` (for child nodes), giving clarity about relationship type.

## Example

```typescript
const adrTemplate = template()
  .add(
    md.heading(1, { required: true, match: /^ADR / })
  )
  .add(
    md.paragraph({ required: true })
  )
  .add(
    schema.section({ level: 2, required: true })
      .children([
        md.paragraph({ required: true }),
        
        schema.section({ level: 3, name: 'Drivers', optional: true })
          .children([md.list()]),
        
        schema.section({ level: 3, name: 'Alternatives', optional: true })
          .children([md.list()])
      ])
  )
```

## Characteristics

- **Two clear verbs**: `.add()` for siblings, `.children()` for nested content
- **Explicit about relationships** - you know what's parent vs sibling
- **Mixed style** - uses fluent AND arrays, but intentionally
- **Type-safe** - full TypeScript support
- **No callbacks** - simpler mental model
- **Separated concerns** - building structure vs adding content

## Pros

- ✅ **Very explicit** - immediately clear parent/child relationships
- ✅ **Two clear operations** - `.add()` vs `.children()` are semantically different
- ✅ **Simpler than callbacks** - no callback overhead
- ✅ **Type-safe** - full IDE support
- ✅ **Less nesting depth** - arrays can feel shallower
- ✅ **Familiar pattern** - similar to HTML builders (`.children()` is common)
- ✅ **Flexible** - can use `.add()` at top level, `.children()` for containers

## Cons

- ❌ **Mixes styles** - arrays inside fluent calls
- ❌ **Still has nesting** - `.children()` creates a break
- ❌ **More verbose in some cases** - explicit `.children([])` calls
- ❌ **Array syntax** - loses some fluent feel inside children

## Implementation Pattern

```typescript
class NodeBuilder {
  private nodes: Node[] = []
  private childrenNodes: Node[] = []
  
  add(node: Node): this {
    this.nodes.push(node)
    return this
  }
  
  children(nodes: Node[]): this {
    this.childrenNodes = nodes
    return this
  }
  
  build(): Node {
    return {
      ...this.config,
      children: this.childrenNodes,
      siblings: this.nodes
    }
  }
}

class TemplateBuilder {
  private sections: Node[] = []
  
  add(node: Node): this {
    this.sections.push(node)
    return this
  }
  
  build(): Template {
    return { nodes: this.sections }
  }
}
```

## Reusability Pattern

Factory functions return builder instances to allow either `.children()` or chaining:

```typescript
const prosConsList = () => md.list()
  .item(md.paragraph())

const driverSection = () =>
  schema.section({ level: 3, name: 'Drivers', optional: true })
    .children([prosConsList()])

const alternativeSection = () =>
  schema.section({ level: 3, name: 'Alternatives', optional: true })
    .children([prosConsList()])

const adrTemplate = template()
  .add(md.heading(1, { required: true, match: /^ADR / }))
  .add(md.paragraph({ required: true }))
  .add(
    schema.section({ level: 2, required: true })
      .children([
        md.paragraph({ required: true }),
        driverSection(),
        alternativeSection()
      ])
  )
```

## Nesting Examples

```typescript
// Single level
template()
  .add(md.heading(1))
  .add(md.paragraph())

// With children
template()
  .add(
    schema.section({ level: 1 })
      .children([
        md.paragraph(),
        md.paragraph()
      ])
  )

// Deep nesting - `.children()` shows levels clearly
template()
  .add(
    schema.section({ level: 1 })
      .children([
        schema.section({ level: 2 })
          .children([
            schema.section({ level: 3 })
              .children([md.paragraph()])
          ])
      ])
  )
```

## When to Use This

- You want explicit semantics (siblings vs children are different operations)
- Arrays are okay for children but you want fluent siblings
- Clarity and "self-documenting" code is priority
- You like the idea that `.add()` and `.children()` do different things
- Your team prefers direct, clear patterns over elegant ones
