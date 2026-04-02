# Hybrid Pattern C: Factory Functions + Fluent

## Overview
Combines fluent API with factory functions for reusable parts. Reduces verbosity and improves readability by extracting common patterns as factory functions that return pre-built nodes.

## Example

```typescript
const prosConsList = () => md.list()
  .item(md.paragraph())

const decisionSection = (name: string, optional: boolean = false) =>
  schema.section({ level: 3, name, optional })
    .children([prosConsList()])

const adrTemplate = template()
  .add(md.heading(1, { required: true, match: /^ADR / }))
  .add(md.paragraph({ required: true }))
  .add(
    schema.section({ level: 2, required: true })
      .children([
        md.paragraph({ required: true }),
        decisionSection('Drivers'),
        decisionSection('Alternatives')
      ])
  )
```

## Characteristics

- **Fluent for structure** - top-level template using `.add()` and `.children()`
- **Factory functions for parts** - reusable pieces as functions returning nodes
- **Mixed patterns** - fluent + factories working together
- **Type-safe** - full TypeScript support
- **Minimal repetition** - extract patterns as functions
- **Clear separation** - structure (template) vs parts (factories)

## Pros

- ✅ **Best of both worlds** - fluent structure + reusable parts
- ✅ **Reduces repetition** - extract common patterns as functions
- ✅ **Readable at all levels** - template is readable, parts are organized
- ✅ **Type-safe** - full IDE support
- ✅ **Composable** - parts can be made of other parts
- ✅ **Easy to maintain** - update part in one place, used everywhere
- ✅ **Testable** - factories are just functions
- ✅ **Best for reusability** - exactly what you wanted

## Cons

- ❌ **Still uses arrays** in `.children()` 
- ❌ **More files** - factories scattered throughout codebase
- ❌ **Slight indirection** - need to find factory functions
- ❌ **Factory naming** - need good naming conventions

## Implementation Pattern

```typescript
class NodeBuilder {
  protected config: any
  protected childrenNodes: Node[] = []
  
  children(nodes: Node[]): this {
    this.childrenNodes = nodes
    return this
  }
  
  build(): Node {
    return { ...this.config, children: this.childrenNodes }
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

// Factory functions return complete builder chains
function md.list(): ListBuilder {
  return new ListBuilder()
}

function schema.section(config: SectionConfig): SectionBuilder {
  return new SectionBuilder(config)
}

function template(): TemplateBuilder {
  return new TemplateBuilder()
}
```

## Reusability Pattern

This shines with factory extraction:

```typescript
// Common parts library
const prosConsList = () => md.list()
  .item(md.paragraph())

const simpleSection = (name: string) =>
  schema.section({ level: 3, name })
    .children([prosConsList()])

const decisionSection = (name: string, optional: boolean = false) =>
  schema.section({ level: 3, name, optional })
    .children([implimentedContent()])

const listWithHeading = (heading: string) => [
  md.heading(4, { inline: true })
    .text(heading),
  prosConsList()
]

// Use in multiple templates
const adrTemplate = template()
  .add(md.heading(1, { required: true, match: /^ADR / }))
  .add(md.paragraph({ required: true }))
  .add(
    schema.section({ level: 2, required: true })
      .children([
        md.paragraph({ required: true }),
        decisionSection('Drivers'),
        decisionSection('Alternatives')
      ])
  )

const rfcTemplate = template()
  .add(md.heading(1, { required: true, match: /^RFC / }))
  .add(md.paragraph({ required: true }))
  .add(
    schema.section({ level: 2, required: true })
      .children([
        md.paragraph({ required: true }),
        ...listWithHeading('Pros'),
        ...listWithHeading('Cons')
      ])
  )
```

## Organization

```
proposal/
├── odr/
│   ├── v1/
│   │   ├── parts/
│   │   │   ├── lists.mts (prosConsList, itemizedList, etc)
│   │   │   ├── sections.mts (decisionSection, etc)
│   │   │   └── common.mts (shared patterns)
│   │   ├── adr.mts (ADR template definition)
│   │   ├── rfc.mts (RFC template definition)
│   │   └── templates.ts (export all templates)
```

## Examples

### Simple reusable part
```typescript
const prosConsList = () => 
  md.list()
    .item(md.strong().text('Pro: '))
    .item(md.strong().text('Con: '))
```

### Part with parameters
```typescript
const itemList = (items: string[]) => 
  md.list()
    .items(items.map(item => md.paragraph().text(item)))
```

### Composed parts
```typescript
const decisionWithPros = (name: string) =>
  schema.section({ level: 3, name })
    .children([
      md.paragraph({ required: true }),
      prosConsList()
    ])
```

### Multiple levels of composition
```typescript
const decisionArea = (required: boolean = true) =>
  schema.section({ level: 2, required })
    .children([
      md.paragraph({ required: true }),
      decisionWithPros('Drivers'),
      decisionWithPros('Alternatives')
    ])

const adrTemplate = template()
  .add(md.heading(1, { required: true, match: /^ADR / }))
  .add(decisionArea())
```

## When to Use This

- ✅ You want fluent API for clarity
- ✅ You need reusable parts (pros/cons, lists, etc)
- ✅ Reducing code repetition is important
- ✅ Your team likes both fluent APIs AND composition
- ✅ You plan to have multiple templates reusing parts
- ✅ Testing and maintaining parts is important

## This is the sweet spot because:
- 🎯 Type safety from fluent API
- 🎯 Consistency through single pattern
- 🎯 Reusability through factories
- 🎯 Most readable overall
- 🎯 Minimal verbosity
