# Metadata location

> **Status:** Open \
> **Scope:** `@md-schema/docs`, `@md-schema/md`

## Problem

ADR metadata (status, created date, deciders) needs a defined location in the document.
Currently there are two candidates, and neither is validated:

1. **Frontmatter** — the YAML block between `---` fences at the top of the file.
2. **Code block in the main section** — a fenced `` ```yml `` block below the heading.

The template currently accepts both slots as optional and unvalidated.
Only the `schema` key in frontmatter is consumed by the tooling; everything else is ignored.

## Current state

### Frontmatter

The frontmatter block is **required** but only the `schema` field is defined.
`additionalProperties: true` allows extra keys, but nothing reads them.

```yaml
---
schema: '@docs/v1/architecture-decision-record'
---
```

### Code block

The code block sits in the main section after the heading and optional blockquote.
It is **optional** and only validates `language: 'yml'` — the content is free-form.

```yml
status: proposed
created: 2025-11-19
deciders:
- marvin-brouwer
```

### Legacy YAML ADRs

The original pure-YAML format (before the markdown migration) placed all metadata under an `adr:` key:

```yaml
adr:
  subject: original draft
  status: superseded
  superseded-by: "./2025-03-25.yaml-format.adr.yaml"
  created: 2025-03-20
  deciders:
  - https://github.com/Marvin-Brouwer
```

## Options

### Option A: Frontmatter

Put all metadata in the frontmatter block alongside `schema`.

```yaml
---
schema: '@docs/v1/architecture-decision-record'
status: proposed
created: 2025-11-19
deciders:
- marvin-brouwer
---
```

**Pro:** Single source of metadata, already parsed by `getFrontMatterData()`. \
**Pro:** Consistent with how most static-site generators and markdown tooling handle metadata. \
**Pro:** The `@position` / `@positions` infrastructure already tracks per-key source positions for error reporting. \
**Con:** Frontmatter is hidden by default on GitHub — readers need to open "Raw" or click to expand. \
**Con:** The `schema` field is tooling plumbing; mixing it with document metadata muddies the purpose.

### Option B: Code block in the main section

Keep metadata in the fenced YAML code block inside the document body.

```yml
status: proposed
created: 2025-11-19
deciders:
- marvin-brouwer
```

**Pro:** Always visible when reading the document, both on GitHub and in the editor. \
**Pro:** Separates tooling config (`schema` in frontmatter) from document metadata. \
**Con:** Requires building a second YAML parser path in the linter to validate structured content inside a code block. \
**Con:** No existing infrastructure for per-key source positions inside code blocks — would need new work.

### Option C: Both (with clear separation)

Use frontmatter for tooling fields (`schema`) and the code block for document metadata (`status`, `created`, `deciders`).

**Pro:** Clean separation of concerns. \
**Pro:** Document metadata stays visible. \
**Con:** Two different places to look for "metadata". \
**Con:** Validation and cross-referencing (e.g. superseding flow) needs to bridge both locations.

## Decision

_To be decided._

## Considerations

Whichever option is chosen, the following metadata fields need to be defined and validated:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | enum | Yes | `proposed`, `accepted`, `deprecated`, `superseded` |
| `created` | date | Yes | ISO 8601 date (`YYYY-MM-DD`) |
| `deciders` | string[] | Yes | GitHub usernames or names of people involved |
| `supersedes` | string | No | See [superseding flow](./superseding.md) |

The `status` field is the most critical — the [superseding flow](./superseding.md) depends on it.
