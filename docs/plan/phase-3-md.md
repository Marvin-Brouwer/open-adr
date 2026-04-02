# Phase 3: `@md-schema/md`

## Goal

New package containing remark plugins. Code moved from current `@md-schema/odr`. Loader and linter refactored for template-based validation.

## Files Moved From `@md-schema/odr`

| Source | Destination | Changes |
|--------|-------------|---------|
| `plugins/sectionify.mts` | `plugins/sectionify.mts` | None |
| `plugins/unsectionify.mts` | `plugins/unsectionify.mts` | None |
| `plugins/schema-hint-provider.mts` | `plugins/schema-hint-provider.mts` | None |
| `plugins/schema-loader.mts` | `plugins/schema-loader.mts` | Major refactor |
| `plugins/schema-linter.mts` | `plugins/schema-linter.mts` | Major refactor |
| `files/file-include.mts` | `files/file-include.mts` | None |
| `helpers/front-matter.mts` | `helpers/front-matter.mts` | None |
| `settings.mts` | `settings.mts` | Adapted for template identifiers |
| `constants.mts` | `constants.mts` | None |
| `nodes/` | `nodes/` | None |

## Schema Loader Refactor

### What changes

- **Remove:** AJV, JSON Schema loading, `createValidator()`, `loadWebSchema()`, `loadFileSchema()`
- **Add:** template module resolution

### Schema resolution

1. Check if value starts with `file://` → resolve path, `import(pathToFileURL(resolved))` (must be compiled `.mjs`/`.js`)
2. Otherwise → treat as bare specifier, `import(value)` (Node.js module resolution)

### Module expectations

Imported module must export a `SchemaTemplate` (default or named `template` export).

### Stored data

`file.data['odr:schema'] = { schemaUrl, template }` instead of `{ schemaUrl, validator }`.

### `allowedSchemas`

Plain string comparison: `allowedSchemas.includes(schemaUrl)` where `schemaUrl` is the raw frontmatter value.

## Schema Linter Refactor

### What changes

- **Remove:** AJV error iteration, `formatMessage()`, `getExpectedValues()`, `trailJsonPath` usage
- **Add:** call `template.validate(context.root)`, map results to remark messages

### Implementation

```ts
const results = schemaData.template.validate(context.root)
for (const result of results) {
  if (result.severity === 'error') {
    context.appendError(result.message, result.node)
  } else {
    context.appendWarn(result.message, result.node)
  }
}
```

### Sectionify prerequisite

Check that AST contains section nodes. If not, throw: `"Schema linter requires sectionified AST. Ensure the sectionify plugin runs before the linter."`

## Dependencies

- `@md-schema/remark-plugin: workspace:^`
- `@md-schema/builder: workspace:^`
- `micromatch`, `yaml`, `ajv` (only for `front-matter.mts` YAML validation)

## Tests

Moved from `packages/odr/tests/`, adapted:
- `schema-loader.test.ts` — bare specifier resolution, file:// loading, invalid module, allowedSchemas
- `schema-linter.test.ts` — template-based validation, error/warning mapping, sectionify prerequisite
- `sectionify.test.ts`, `unsectionify.test.ts`, `file-include.test.ts`, `settings.test.ts` — as-is
