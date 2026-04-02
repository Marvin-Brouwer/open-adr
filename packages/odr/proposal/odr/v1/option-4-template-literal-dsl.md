# Option 4: Template Literal DSL (Most Experimental)

## Overview
A custom domain-specific language built using template literals. Reads like pseudo-markup language with a familiar, almost natural language syntax.

## Example

```typescript
const adrTemplate = doc`
  heading {
    level: 1
    match: /^ADR /
    required: true
    error: "ADR must start with 'ADR ' in heading"
  }
  
  paragraph {
    required: true
    description: "Short description of the decision context"
  }
  
  section "Decision" {
    required: true
    
    paragraph {
      required: true
    }
    
    section "Drivers" {
      optional: true
      
      list {
        listItem {
          strong "Item: "
          paragraph { optional: true }
        }
      }
    }
    
    section "Alternatives" {
      optional: true
      
      list {
        listItem {
          strong "Item: "
          paragraph { optional: true }
        }
      }
    }
  }
  
  section "Consequences" {
    description: "Trade-offs and implications"
    paragraph
  }
`
```

## Characteristics

- **Natural language-like** syntax
- **Hierarchical indentation** reflects document structure
- **Named sections** with string parameters
- **Property assignments** within nodes
- **Minimal boilerplate** - no commas, brackets minimal
- **Familiar to template/markup users**

## Pros

- ✅ Most readable - looks like pseudo-code/markup
- ✅ Very concise - less typing
- ✅ Natural hierarchical representation via indentation
- ✅ Easy for non-programmers to understand structure
- ✅ Fun and innovative!
- ✅ Can be extended with custom syntax
- ✅ Whitespace-sensitive makes intent clear

## Cons

- ❌ Requires custom parser (non-trivial implementation)
- ❌ No IDE/autocomplete support without special plugins
- ❌ Harder to debug (template literal is just a string)
- ❌ Not standard TypeScript - learning curve for team
- ❌ More complex error messages
- ❌ Harder to compose programmatically
- ❌ Serialization/manipulation less straightforward
- ❌ MAJOR: Parser maintenance burden

## Implementation Complexity

**Very High** - Need to write a full parser for this syntax

## Reusability Pattern

Would need special handling for reusable parts (macros or includes):

```typescript
// Hypothetical macro system
const macro proConsList = 
  list {
    listItem {
      strong "Item:"
      paragraph { optional: true }
    }
  }

const adrTemplate = doc`
  heading {
    level: 1
    match: /^ADR /
    required: true
  }
  
  section "Decision" {
    required: true
    
    paragraph { required: true }
    
    section "Drivers" {
      optional: true
      use proConsList
    }
    
    section "Alternatives" {
      optional: true
      use proConsList
    }
  }
`
```

Or simpler: define parts as strings and template them:

```typescript
const prosConsList = `
  list {
    listItem {
      strong "Item:"
      paragraph { optional: true }
    }
  }
`

const adrTemplate = doc`
  heading {
    level: 1
    match: /^ADR /
    required: true
  }
  
  section "Decision" {
    required: true
    paragraph { required: true }
    ${prosConsList}
  }
`
```

## When to Use This

- You have significant parser infrastructure already
- DSLs are a core part of your product philosophy
- Team has previous DSL implementation experience
- You want the absolute most readable format at all costs
- Targeting non-programmer template designers
- You're building this as a flagship feature worth the investment

## Risks

- ⚠️ Easy to underestimate parser complexity
- ⚠️ Debugging template literals is painful
- ⚠️ Composition/reuse becomes complex
- ⚠️ Breaking changes require parser updates
- ⚠️ TypeScript type safety is completely lost in template literal
