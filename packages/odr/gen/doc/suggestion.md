# Suggested API Design for Missing Features

This document proposes API designs for implementing the high and medium priority JSON Schema features identified in [missing.md](./missing.md).

## Design Principles

1. **Fluent/Chainable API** - Continue the builder pattern
2. **Type Safety** - Leverage TypeScript types where possible
3. **Strict by Default** - Match existing philosophy
4. **Minimal Breaking Changes** - Extend, don't replace

## String Validation

### API Design

```typescript
// Chainable constraints on string builders
s.string().minLength(3)
s.string().maxLength(100)
s.string().pattern(/^[a-zA-Z]+$/)
s.string().pattern('^[a-zA-Z]+$') // String form also supported

// Combined
s.string()
  .minLength(3)
  .maxLength(100)
  .pattern(/^[a-z0-9_-]+$/)

// With required
s.required.string()
  .minLength(1)
  .maxLength(255)
```

### Usage Example

```typescript
const user = s.schema('user.json')
  .object({
    username: s.required.string()
      .minLength(3)
      .maxLength(20)
      .pattern(/^[a-zA-Z0-9_]+$/),
    email: s.required.string()
      .pattern(/^[^@]+@[^@]+\.[^@]+$/),
    bio: s.string()
      .maxLength(500),
  })
```

## Number Validation

### API Design

```typescript
// Chainable constraints on number builders
s.number().min(0)           // inclusive minimum
s.number().max(100)         // inclusive maximum
s.number().exclusiveMin(0)  // exclusive minimum
s.number().exclusiveMax(100) // exclusive maximum
s.number().multipleOf(5)    // divisibility

// Combined
s.number()
  .min(0)
  .max(100)
  .multipleOf(5)

// Alternative names (aliases)
s.number().minimum(0)       // alias for min()
s.number().maximum(100)     // alias for max()
```

### Usage Example

```typescript
const product = s.schema('product.json')
  .object({
    price: s.required.number()
      .min(0)
      .max(999999.99),
    quantity: s.required.number()
      .min(0)
      .multipleOf(1), // integers only
    discount: s.number()
      .min(0)
      .exclusiveMax(1), // 0 <= discount < 1
  })
```

## Array Validation

### API Design

```typescript
// Chainable constraints on array builders
s.array(itemSchema).minItems(1)
s.array(itemSchema).maxItems(10)
s.array(itemSchema).uniqueItems()

// Combined
s.array(s.string())
  .minItems(1)
  .maxItems(100)
  .uniqueItems()

// Contains (more advanced)
s.array(s.string())
  .contains(s.const('admin'))  // must contain "admin"
  .minContains(1)
  .maxContains(5)
```

### Usage Example

```typescript
const team = s.schema('team.json')
  .object({
    members: s.required.array(s.string())
      .minItems(1)
      .maxItems(50)
      .uniqueItems(),
    tags: s.array(s.string())
      .maxItems(10),
    roles: s.required.array(s.string())
      .contains(s.const('owner'))
      .minContains(1)
      .maxContains(1), // exactly one owner
  })
```

## Object Validation

### API Design

```typescript
// Chainable constraints on object builders
s.object(props).minProperties(1)
s.object(props).maxProperties(10)
s.object(props).propertyNames(pattern)

// Combined
s.object({
  name: s.required.string(),
})
  .minProperties(1)
  .maxProperties(100)
  .propertyNames(s.string().pattern(/^[a-z_]+$/))

// Dependent validation
s.object({
  credit_card: s.string(),
  billing_address: s.string(),
})
  .dependentRequired({
    credit_card: ['billing_address'],
  })
  .dependentSchemas({
    credit_card: s.object({
      billing_address: s.required.string(),
    }),
  })
```

### Usage Example

```typescript
const settings = s.schema('settings.json')
  .object({
    theme: s.string(),
    fontSize: s.number(),
  })
  .minProperties(1)
  .maxProperties(50)
  .propertyNames(
    s.string().pattern(/^[a-zA-Z][a-zA-Z0-9]*$/)
  )

const payment = s.schema('payment.json')
  .object({
    method: s.required.string(),
    credit_card: s.string(),
    billing_address: s.string(),
  })
  .dependentRequired({
    credit_card: ['billing_address'],
  })
```

## Metadata & Documentation

### API Design

```typescript
// Chainable metadata on any builder
s.string().description('User email address')
s.number().default(0)
s.boolean().examples([true, false])
s.string().deprecated()
s.string().readOnly()
s.string().writeOnly()

// Combined
s.string()
  .description('The user\'s email address')
  .default('user@example.com')
  .examples(['alice@example.com', 'bob@example.com'])
  .pattern(/^[^@]+@[^@]+$/)

// On objects
s.object({
  id: s.required.string()
    .description('Unique identifier')
    .readOnly(),
  password: s.required.string()
    .description('User password (hashed)')
    .writeOnly()
    .minLength(8),
  status: s.string()
    .description('Account status')
    .default('active')
    .examples(['active', 'suspended', 'deleted']),
})
```

### Usage Example

```typescript
const user = s.schema('user.json')
  .object({
    id: s.required.string()
      .description('Unique user identifier (UUID v4)')
      .readOnly()
      .pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
    email: s.required.string()
      .description('User email address')
      .examples(['user@example.com'])
      .pattern(/^[^@]+@[^@]+\.[^@]+$/),
    age: s.number()
      .description('User age in years')
      .min(0)
      .max(150)
      .default(0),
    legacy_field: s.string()
      .description('Deprecated field, use new_field instead')
      .deprecated(),
  })
```

## Conditional Validation (if/then/else)

### API Design

```typescript
// Option 1: Fluent chaining
s.object({
  country: s.required.string(),
  postal_code: s.required.string(),
})
  .if(s.object({ country: s.const('USA') }))
  .then(s.object({
    postal_code: s.string().pattern(/^[0-9]{5}$/),
  }))
  .else(s.object({
    postal_code: s.string(),
  }))

// Option 2: Dedicated method
s.object({
  country: s.required.string(),
  postal_code: s.required.string(),
})
  .conditional({
    if: s.object({ country: s.const('USA') }),
    then: s.object({ postal_code: s.string().pattern(/^[0-9]{5}$/) }),
    else: s.object({ postal_code: s.string() }),
  })

// Option 3: Helper function
s.conditional(
  s.object({ country: s.const('USA') }),  // if
  s.object({ postal_code: s.string().pattern(/^[0-9]{5}$/) }), // then
  s.object({ postal_code: s.string() }), // else (optional)
)
```

### Usage Example

```typescript
const address = s.schema('address.json')
  .object({
    country: s.required.string(),
    postal_code: s.required.string(),
  })
  .if(s.object({ country: s.const('USA') }))
  .then(s.object({
    postal_code: s.string()
      .pattern(/^[0-9]{5}(-[0-9]{4})?$/),
  }))
  .else(s.object({
    postal_code: s.string().maxLength(20),
  }))
```

## Internal Definitions ($defs)

### API Design

```typescript
// Option 1: Scoped definitions within schema
const schema = s.schema('main.json')

const addressDef = schema.def('address', s.object({
  street: s.required.string(),
  city: s.required.string(),
  zip: s.required.string(),
}))

schema.object({
  billing: s.required.refDef('address'),
  shipping: s.refDef('address'),
})

// Option 2: Direct reference to definition
schema.object({
  billing: s.required.ref(() => addressDef),
  shipping: s.ref(() => addressDef),
})

// Generated output:
// {
//   "$defs": {
//     "address": { ... }
//   },
//   "type": "object",
//   "properties": {
//     "billing": { "$ref": "#/$defs/address" },
//     "shipping": { "$ref": "#/$defs/address" }
//   }
// }
```

### Usage Example

```typescript
const doc = s.schema('document.json')

// Define reusable schemas
const address = doc.def('address', s.object({
  street: s.required.string(),
  city: s.required.string(),
  zip: s.required.string(),
}))

const person = doc.def('person', s.object({
  name: s.required.string(),
  email: s.required.string().pattern(/^[^@]+@[^@]+$/),
}))

// Use definitions
doc.object({
  author: s.required.ref(() => person),
  billing_address: s.required.ref(() => address),
  shipping_address: s.ref(() => address),
})
```

## Implementation Order Suggestion

### Phase 1: String & Number Constraints (Most Common)
1. `string().minLength()`, `string().maxLength()`, `string().pattern()`
2. `number().min()`, `number().max()`
3. `description()`, `default()` metadata

**Estimated effort:** 2-3 hours
**Value:** High - covers 80% of common validation needs

### Phase 2: Array Constraints & Metadata
1. `array().minItems()`, `array().maxItems()`, `array().uniqueItems()`
2. `examples()`, `deprecated()`, `readOnly()`, `writeOnly()`

**Estimated effort:** 2-3 hours
**Value:** Medium-High - completes common validation patterns

### Phase 3: Conditional & Advanced
1. `if()`, `then()`, `else()` conditional validation
2. `$defs` support for internal definitions
3. `object().minProperties()`, `object().maxProperties()`

**Estimated effort:** 4-5 hours
**Value:** Medium - enables complex validation scenarios

### Phase 4: Advanced Features (Optional)
1. `number().multipleOf()`, `number().exclusiveMin()`, `number().exclusiveMax()`
2. `array().contains()`, `array().minContains()`, `array().maxContains()`
3. `object().propertyNames()`, `object().dependentRequired()`, `object().dependentSchemas()`
4. Dynamic references (`$dynamicRef`, `$dynamicAnchor`)

**Estimated effort:** 6-8 hours
**Value:** Low-Medium - specialized use cases

## Questions to Resolve

1. **Naming conventions:**
   - `min()`/`max()` vs `minimum()`/`maximum()`?
   - `minLength()` vs `min()` on strings?

2. **Pattern input:**
   - Accept RegExp objects, strings, or both?
   - How to handle RegExp flags?

3. **Conditional syntax:**
   - Fluent (`if().then().else()`) vs dedicated method (`conditional()`) vs helper function?

4. **$defs integration:**
   - Should `def()` automatically add to `$defs`?
   - How to distinguish between file refs and def refs?

5. **Type inference:**
   - Should TypeScript types be inferred from constraints (e.g., `min(0)` → positive number)?
