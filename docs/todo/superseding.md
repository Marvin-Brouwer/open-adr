# Superseding flow

> **Status:** Open \
> **Scope:** `@md-schema/docs`, `@md-schema/md`, `@md-schema/builder` \
> **Depends on:** [Metadata location](./metadata.md) — status field must be validated first

## Summary

When an ADR is superseded by a newer decision, the relationship between the two documents
should be enforced by the tooling rather than left to convention.
This feature introduces a `supersedes` metadata field on the *new* ADR and validates the
bidirectional consistency between superseder and superseded document.

## Background

The legacy YAML format used a `superseded-by` field on the *old* ADR pointing forward:

```yaml
adr:
  status: superseded
  superseded-by: "./2025-03-25.yaml-format.adr.yaml"
```

This approach has a problem: the superseded document must be edited to add the reference,
but the superseding document carries no indication that it replaces anything.
There is no bidirectional check — the `superseded-by` target may not exist, and nothing
prevents a document from claiming to be superseded without a replacement.

## Design

### The `supersedes` field

Instead of `superseded-by` on the old document, a `supersedes` field is placed on the
**new** (superseding) ADR:

```yaml
supersedes: 2025-11-19.001.remark-guided-docs.md
```

Or, to pin to a specific version of the file being superseded:

```yaml
supersedes: 2025-11-19.001.remark-guided-docs.md#a1b2c3d
```

| Part | Required | Description |
| --- | --- | --- |
| filename | Yes | Relative path to the superseded ADR file |
| `#` git hash | No | Short or full commit hash, pins the superseded file to a specific version |

### Status lifecycle

The superseding flow builds on top of the `status` metadata field:

```
proposed  ──►  accepted  ──►  superseded
                         ──►  deprecated
```

A document with `status: superseded` is expected to have been replaced by another ADR
that declares `supersedes: {filename}`.

### Validation rules

#### On the superseding document (the new ADR)

| # | Rule | Severity | Condition |
| --- | --- | --- | --- |
| S1 | The file referenced by `supersedes` must exist | Error | Always |
| S2 | If a git hash is included, the file must exist in that commit | Error | When `#hash` is present |
| S3 | The superseded file's status must be `superseded` | Warning | When the superseded file has a different status |
| S3a | Offer an autofix to change the superseded file's status to `superseded` | Autofix | When rule S3 triggers and the file is not `deleted` |

#### On the superseded document (the old ADR)

| # | Rule | Severity | Condition |
| --- | --- | --- | --- |
| S4 | A file with `status: superseded` must be referenced by at least one other ADR's `supersedes` field | Error | Always |

### Autofix behavior (S3a)

When a new ADR declares `supersedes: old-adr.md` but `old-adr.md` still has
`status: accepted`, the linter should:

1. Emit a **warning** on the `supersedes` field of the new ADR.
2. Offer an **autofix** that changes the `status` field in `old-adr.md` to `superseded`.
3. Skip the autofix if the superseded file's status is `deleted` or the file cannot be written.

This makes it possible to supersede a document in a single commit: create the new ADR with
`supersedes:` and let the autofix update the old one.

### Git hash validation (S2)

When a git hash is provided (`supersedes: file.md#a1b2c3d`), the linter verifies that the
file existed at that commit. This enables:

- Traceability to the exact version of the document that was replaced.
- Confidence that the reference is not stale, even if the file has since been renamed or moved.

Implementation will likely shell out to `git show {hash}:{path}` or use a git library.
This check only runs when a hash is present — omitting the hash is valid and only checks
current file existence.

## Example

### New ADR (`2026-04-03.002.new-approach.md`)

```yaml
---
schema: '@docs/v1/architecture-decision-record'
status: accepted
created: 2026-04-03
deciders:
- marvin-brouwer
supersedes: 2025-11-19.001.remark-guided-docs.md#a1b2c3d
---
```

### Old ADR (`2025-11-19.001.remark-guided-docs.md`)

```yaml
---
schema: '@docs/v1/architecture-decision-record'
status: superseded
created: 2025-11-19
deciders:
- marvin-brouwer
---
```

If the old ADR still had `status: proposed`, the linter would warn on the new ADR's
`supersedes` field and offer to autofix the old file's status.

If the old ADR had `status: superseded` but no other ADR declared `supersedes:` pointing
to it, the linter would error on the old ADR's status field.

## Open questions

- Should `supersedes` support multiple files (array), or is one-to-one sufficient?
- Should the linter add a `note` or `info` diagnostic on the old ADR indicating *which*
  new ADR supersedes it, for discoverability?
- The git hash check requires git availability — should this be a separate opt-in rule,
  or should it gracefully degrade when git is not available?
- The metadata location must be finalized first (see [metadata.md](./metadata.md)) —
  these rules need to know where to find and write the `status` and `supersedes` fields.
