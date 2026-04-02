# Missing JSON Schema 2020-12 Features

This document outlines features from the [JSON Schema Draft 2020-12 specification](https://json-schema.org/draft/2020-12) that are not currently implemented in our schema builder.

## Currently Supported ✅

- ✅ Type validation (string, number, boolean, null, object, array)
- ✅ Composition (oneOf, anyOf, allOf, not)
- ✅ Object validation (properties, required, additionalProperties, unevaluatedProperties, patternProperties)
- ✅ Array validation (items, prefixItems, additionalItems, unevaluatedItems)
- ✅ Enum and const
- ✅ $ref for external references
- ✅ Format validators (uri, iri)
- ✅ Basic metadata ($id, title via meta parameter)

## Missing Features ❌

### String Validation

**Missing Keywords:**
- `minLength` - minimum string length
- `maxLength` - maximum string length
- `pattern` - regex pattern matching

**References:**
- [minLength spec](https://www.learnjsonschema.com/2020-12/validation/minlength/)
- [maxLength spec](https://www.learnjsonschema.com/2020-12/validation/maxlength/)

**Example:**
```json
{
  "type": "string",
  "minLength": 3,
  "maxLength": 100,
  "pattern": "^[a-zA-Z]+$"
}
```

### Number Validation

**Missing Keywords:**
- `minimum` / `maximum` - inclusive bounds
- `exclusiveMinimum` / `exclusiveMaximum` - exclusive bounds
- `multipleOf` - divisibility constraint

**References:**
- [minimum spec](https://www.learnjsonschema.com/2020-12/validation/minimum/)
- [maximum spec](https://www.learnjsonschema.com/2020-12/validation/maximum/)

**Example:**
```json
{
  "type": "number",
  "minimum": 0,
  "maximum": 100,
  "exclusiveMaximum": 101,
  "multipleOf": 5
}
```

### Array Validation

**Missing Keywords:**
- `minItems` / `maxItems` - array length bounds
- `uniqueItems` - ensure all items are unique
- `contains` / `minContains` / `maxContains` - array must contain matching items

**References:**
- [JSON Schema 2020-12 Array Keywords](https://www.learnjsonschema.com/2020-12/)

**Example:**
```json
{
  "type": "array",
  "minItems": 1,
  "maxItems": 10,
  "uniqueItems": true,
  "contains": {
    "type": "string"
  },
  "minContains": 2
}
```

### Object Validation

**Missing Keywords:**
- `minProperties` / `maxProperties` - object size bounds
- `propertyNames` - validate property name patterns
- `dependentRequired` - conditional property requirements
- `dependentSchemas` - conditional schema application

**References:**
- [dependentRequired spec](https://www.learnjsonschema.com/2020-12/validation/dependentrequired/)
- [dependentSchemas spec](https://www.learnjsonschema.com/2020-12/applicator/dependentschemas/)

**Example:**
```json
{
  "type": "object",
  "minProperties": 1,
  "maxProperties": 10,
  "propertyNames": {
    "pattern": "^[a-z]+$"
  },
  "dependentRequired": {
    "credit_card": ["billing_address"]
  },
  "dependentSchemas": {
    "credit_card": {
      "properties": {
        "billing_address": { "type": "string" }
      },
      "required": ["billing_address"]
    }
  }
}
```

### Conditional Schemas

**Missing Keywords:**
- `if` / `then` / `else` - conditional validation logic

**References:**
- [Conditional schema validation](https://json-schema.org/understanding-json-schema/reference/conditionals)

**Example:**
```json
{
  "if": {
    "properties": {
      "country": { "const": "USA" }
    }
  },
  "then": {
    "properties": {
      "postal_code": { "pattern": "^[0-9]{5}$" }
    }
  },
  "else": {
    "properties": {
      "postal_code": { "type": "string" }
    }
  }
}
```

### Internal Definitions

**Missing Keywords:**
- `$defs` - reusable schema components within a document

**Note:** We have `def()` method but it's not outputting to `$defs` keyword in the schema.

**References:**
- [$defs spec](https://www.learnjsonschema.com/2020-12/core/defs/)

**Example:**
```json
{
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" }
      }
    }
  },
  "type": "object",
  "properties": {
    "billing_address": { "$ref": "#/$defs/address" },
    "shipping_address": { "$ref": "#/$defs/address" }
  }
}
```

### Metadata & Documentation

**Missing Keywords:**
- `description` - longer documentation
- `examples` - example values
- `default` - default value
- `readOnly` / `writeOnly` - API-specific hints
- `deprecated` - deprecation marker

**References:**
- [description spec](https://www.learnjsonschema.com/2020-12/meta-data/description/)
- [title spec](https://www.learnjsonschema.com/2020-12/meta-data/title/)
- [examples spec](https://www.learnjsonschema.com/2020-12/meta-data/examples/)

**Example:**
```json
{
  "type": "string",
  "title": "Username",
  "description": "The user's unique identifier",
  "default": "guest",
  "examples": ["alice", "bob"],
  "deprecated": false
}
```

### Advanced Referencing

**Missing Keywords:**
- `$dynamicRef` / `$dynamicAnchor` - runtime schema resolution
- `$anchor` - in-document anchors

**References:**
- [$dynamicRef spec](https://www.learnjsonschema.com/2020-12/core/dynamicref/)

**Example:**
```json
{
  "$defs": {
    "node": {
      "$dynamicAnchor": "node",
      "type": "object",
      "properties": {
        "children": {
          "type": "array",
          "items": { "$dynamicRef": "#node" }
        }
      }
    }
  }
}
```

### Content Validation

**Missing Keywords:**
- `contentEncoding` - content encoding (base64, etc.)
- `contentMediaType` - MIME type
- `contentSchema` - schema for decoded content

**Example:**
```json
{
  "type": "string",
  "contentEncoding": "base64",
  "contentMediaType": "image/png"
}
```

## Priority Recommendations

Based on common use cases, the most valuable additions would be:

1. **High Priority** (very common validation needs)
   - String constraints: `minLength`, `maxLength`, `pattern`
   - Number constraints: `minimum`, `maximum`
   - Array constraints: `minItems`, `maxItems`, `uniqueItems`
   - Metadata: `description`, `default`

2. **Medium Priority** (useful for complex schemas)
   - Conditional validation: `if`/`then`/`else`
   - `$defs` support for better schema organization
   - Object constraints: `minProperties`, `maxProperties`

3. **Lower Priority** (advanced or specialized use cases)
   - Dynamic references: `$dynamicRef`, `$dynamicAnchor`
   - Content validation: `contentEncoding`, `contentMediaType`
   - Dependent schemas: `dependentRequired`, `dependentSchemas`

## References

- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)
- [JSON Schema 2020-12 Complete Reference](https://www.learnjsonschema.com/2020-12/)
- [JSON Schema Keywords](https://json-schema.org/understanding-json-schema/keywords)
- [JSON Schema Validation Spec](https://json-schema.org/draft/2020-12/json-schema-validation)
