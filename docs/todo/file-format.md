# File format validation

> **Status:** Open \
> **Scope:** `@md-schema/builder`, `@md-schema/docs`, `@md-schema/md`

## Summary

Add the ability for schemas to define and validate the filename format of documents they apply to.
This would allow templates to enforce naming conventions at lint time, catching misnamed files early.

## Motivation

The ADR template specifies a filename convention:

```
{creationDate}.{counter}.{slug}.md
```

For example: `2025-11-19.001.remark-guided-docs.md`

This convention is currently documented in the [writer's guide](../../packages/docs/src/templates/architecture-decision-record.md#filename) but not enforced by tooling.
Misnamed files go undetected until a human reviewer catches them.

## Design considerations

### Where to define the format

The filename pattern should be part of the template definition, so each schema can declare its own convention.
A possible API:

```ts
export default template({
	filename: schema.filename({
		pattern: /^\d{4}-\d{2}-\d{2}\.\d{3}\.[a-z0-9-]+$/,
		description: '{creationDate}.{counter}.{slug}',
		example: '2025-11-19.001.remark-guided-docs',
	}),
	children: [ ... ],
})
```

### Validation rules

| Rule | Severity | Description |
| --- | --- | --- |
| Filename does not match pattern | Error | The file's basename (without extension) must match the declared pattern |
| Creation date is not a valid ISO 8601 date | Error | The date segment must be a real date |
| Counter is not sequential | Warning | If other ADRs exist for the same date, the counter should follow sequentially |
| Slug does not match title | Warning | The slug portion should be derivable from the document's h1 heading |

### Cross-file validation

Some rules (counter sequencing, slug-to-title matching) require knowledge of either sibling files
or the document's own AST. This means filename validation may need to run:

- **Per-file:** Pattern matching, date validity.
- **Cross-file:** Counter sequencing (requires scanning the directory for same-date files).
- **AST-aware:** Slug-to-title matching (requires the parsed heading).

### Open questions

- Should the pattern be a regex, a structured format descriptor, or both?
- Should counter validation be an error or a warning? Strict sequencing may be impractical during rebases.
- How should renamed files be handled — warn on mismatch or offer an autofix?
- Should the creation date be cross-checked against the `created` metadata field (once [metadata](./metadata.md) is finalized)?
