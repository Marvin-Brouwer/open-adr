# Phase 2: `@md-schema/odr`

## Goal

Strip `@md-schema/odr` down to pre-baked template definitions only. Move all plugin code out (Phase 3). The ADR template imports from `@md-schema/builder`.

## Files

| File | Purpose |
|------|---------|
| `src/v1/architecture-decision-record.mts` | ADR template definition — all partials, validators, and final `template()` call |
| `src/v1/helpers.mts` | ADR-specific validators: `isNamedReference`, `isObjectReference`, `prosConsParagraph`, `driverEntry`, `alternativeEntry`, `referencesList` |
| `src/_module.mts` | Minimal: no direct exports (consumers import by sub-path) |

## Package Exports

```json
{
  "exports": {
    "./v1/architecture-decision-record": {
      "import": "./dist/v1/architecture-decision-record.js",
      "types": "./dist/v1/architecture-decision-record.d.ts"
    }
  }
}
```

Usage: `import { architectureDecisionRecord } from '@md-schema/odr/v1/architecture-decision-record'`

## Template Changes from Proposal

The proposal's `example-option1-consistent.mts` is ported with these adjustments:

1. **Import source:** `./schema-builder` → `@md-schema/builder`
2. **Generic helpers moved:** `getNodeText`, `asArray`, etc. imported from `@md-schema/builder`
3. **`AstNode` type removed:** Use `Node` from `unist`, cast in match callbacks where needed
4. **`mainSection` children → `schema.strictOrder`:** Context items (blockquote, codeBlock, paragraphs) flattened into mainSection's strictOrder instead of a separate `contextSection` partial
5. **Section names match exactly:** `name: 'Decision:'` not `name: 'Decision'` (no normalization)

## Dependencies

- `@md-schema/builder: workspace:^`
- `@types/unist` (peer)

## Tests

`tests/v1/architecture-decision-record.test.ts`:
- Validate demo ADR document (sectionified) against template
- Each validator factory with isolated AST fragments
- Edge cases: missing pros, empty driver, non-link heading, etc.
