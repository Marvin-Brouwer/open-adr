# Phase 4: Cleanup & Integration

## Goal

Remove migrated code from `@md-schema/odr`, update demo configuration, verify the full pipeline works end-to-end.

## Tasks

### 1. Remove migrated code from `packages/odr/`

Delete source files that moved to `@md-schema/md`:
- `src/plugins/` (all 5 plugins)
- `src/files/`
- `src/helpers/` (front-matter, json-path, schema-data)
- `src/nodes/`
- `src/settings.mts`
- `src/constants.mts`

Delete migrated test files from `tests/`.

### 2. Clean up `packages/odr/package.json`

- Remove dependencies that moved to `@md-schema/md` (`ajv`, `micromatch`, `remark`, `remark-frontmatter`, `remark-lint`, `remark-parse`, `remark-stringify`, `unified-language-server`, `unist-util-visit`, `yaml`)
- Add `@md-schema/builder: workspace:^`
- Update exports map for sub-path template exports

### 3. Update demo `.remarkrc.mjs`

Change imports from `@md-schema/odr` to `@md-schema/md`:
```js
import { sectionify, unsectionify, odrSchema, odrLinter } from '@md-schema/md'
```

### 4. Update demo ADR frontmatter

```yaml
odr:schema: @md-schema/odr/v1/architecture-decision-record
```

### 5. Update root `tsconfig.json`

Add references to new packages:
```json
{ "path": "./packages/builder" },
{ "path": "./packages/md" }
```

### 6. Verify full pipeline

Parse → frontmatter → sectionify → load template → validate → unsectionify

### 7. Keep as reference

- `packages/odr/spec/` — JSON schema spec files (documentation)
- `packages/odr/proposal/` — design exploration (documentation)
- `packages/odr/gen/` — JSON schema generators (may be removed later)
