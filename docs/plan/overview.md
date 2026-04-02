# Implementation Plan: Template-Based Schema Validation

## Goal

Replace JSON Schema + AJV validation with a TypeScript-based template system where `template()` returns `{ validate(root) }`.

## Package Structure

```
@md-schema/remark-plugin  — standalone DX wrapper (untouched)
@md-schema/builder         — template(), schema.*, md.*, helpers
@md-schema/md              — remark plugins (sectionify, loader, linter, etc.)
@md-schema/odr             — pre-baked templates only
```

```
@md-schema/remark-plugin          (no deps on other @md-schema packages)
       ↑
@md-schema/builder                (no deps on other @md-schema packages)
       ↑                    ↑
@md-schema/md                @md-schema/odr
(depends on both             (depends on builder only)
 remark-plugin + builder)
```

## Phases

| Phase | Package | Description |
|-------|---------|-------------|
| [1](./phase-1-builder.md) | `@md-schema/builder` | Types, factories (`md.*`, `schema.*`), `template()` with validate, helpers |
| [2](./phase-2-odr.md) | `@md-schema/odr` | Strip down to ADR template only, imports from builder |
| [3](./phase-3-md.md) | `@md-schema/md` | Move remark plugins from odr, refactor loader + linter |
| [4](./phase-4-cleanup.md) | All | Remove migrated code, update demo, verify pipeline |

## Key Design Decisions

- **Symbol-based discriminants** — `DescriptorKind` symbol to tag descriptor types
- **Types co-located** — each descriptor type lives in the file that implements its factory
- **Reuse `unist` types** — `Node` and `Parent` from `@types/unist`
- **`template()` owns validation** — returns `{ validate(root): ValidationResult[] }`, no separate walker export
- **No mixing** — `children` is either `NodeDescriptor[]` (array/presence-based) or `schema.strictOrder(...)` (sequential)
- **No name normalization** — section name matching is exact; template authors write what the heading says
- **Default ignored types** — `['definition', 'html']`, configurable per-template
- **Schema loading** — bare specifier (`@md-schema/odr/v1/architecture-decision-record`) or `file://` path, no JSON/AJV
- **`allowedSchemas`** — plain 1-on-1 string comparison against frontmatter value
