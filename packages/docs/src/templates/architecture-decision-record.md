# Writing an Architecture Decision Record

This guide explains how to write a proper Architecture Decision Record (ADR) using this template.
An ADR captures a single architectural decision along with its context, rationale, and consequences.

> *"Agile methods are not opposed to documentation, only to valueless documentation."*
> — Michael Nygard, [Documenting Architecture Decisions][nygard]

The goal of an ADR is to ensure that nobody is left wondering *"What were they thinking?"*
It should be written as a conversation with a future developer, kept to one or two pages, and stored alongside the code it affects.

## Title

The title of an ADR should be a short noun phrase that captures both the problem addressed and the solution chosen.
Use a sequential number prefix so records can be easily referenced and are never reused, even if an ADR is later superseded.

Examples of good titles:

- `ADR` Deployment on Ruby on Rails 3.0.10
- `ADR` LDAP for Multitenant Integration

Nygard's convention stores ADRs in the repository under a `doc/arch/` or `doc/adr/` directory.
This template enforces that titles start with "ADR" to make the intent immediately recognizable.

## Status

Use a blockquote at the top of the document to communicate the lifecycle status of the decision.
Common statuses are:

| Status | Meaning |
| --- | --- |
| **Proposed** | Under discussion, not yet agreed upon by stakeholders |
| **Accepted** | Agreed upon and in effect |
| **Deprecated** | No longer recommended, but not formally replaced |
| **Superseded** | Replaced by a newer ADR (include a reference to the replacement) |

When superseding an ADR, always keep the old record in place and mark it as superseded.
Never delete old ADRs — the historical record of *why* a decision was once made remains valuable.

> *"Don't alter existing information in an ADR. Instead, amend the ADR by adding new information, or supersede the ADR by creating a new ADR."*
> — Joel Parker Henderson, [Architecture Decision Record][jph]

## Context

The context section consists of one to five paragraphs describing the situation and problem that motivates the decision.
Write in value-neutral language — describe facts, not opinions.
A good context section explains the organizational situation, business priorities, technical constraints, and any tensions between competing forces.

Nygard describes it this way:

> *"This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts."*
> — Michael Nygard, [Documenting Architecture Decisions][nygard]

Consider articulating the problem in the form of a question so readers immediately understand what is being resolved.

## Decision

The decision section is the core of the ADR.
It describes the chosen response to the forces outlined in the context, stated in full sentences with active voice.

Use *"We will …"* phrasing to make the commitment clear and unambiguous.
Link the decision back to the forces and drivers it addresses, and name the chosen option with an explicit justification.

> *"This section describes our response to these forces. It is stated in full sentences, with active voice. 'We will …'"*
> — Michael Nygard, [Documenting Architecture Decisions][nygard]

### Drivers

Drivers are the forces and constraints that shape your decision.
They can be technological (performance requirements, compatibility), political (organizational mandates, team structure), social (skill sets, hiring plans), or project-local (deadlines, budget).

List each driver as a separate item.
Call out tensions between competing drivers explicitly — the value of your ADR comes from showing *why* the chosen path was taken despite trade-offs.
The same driver may appear in multiple ADRs, and that repetition is expected.

### Alternatives

List every option that was genuinely considered before arriving at your decision.
Make sure all alternatives are described at the same level of abstraction; do not compare a technology with a product, or an architectural style with a protocol specification.

Avoid pseudo-alternatives — options listed only to be dismissed do not strengthen your reasoning.
For each alternative, include a brief description and the primary reason it was not chosen.

> *"Make sure to list options that can solve the given problem in the given context. They should do so on the same level of abstraction."*
> — Olaf Zimmermann, [MADR Primer][madr-primer]

## Outcome

The outcome describes the resulting context after the decision has been applied.
List *all* consequences — positive, negative, and neutral — because all of them affect the team and the project going forward.

> *"All consequences should be listed here, not just the 'positive' ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future."*
> — Michael Nygard, [Documenting Architecture Decisions][nygard]

The consequences of one ADR often become the context for subsequent ADRs, forming a chain of decisions.
Include any follow-up actions, subsequent ADRs that are needed, or plans for after-action review.

### Pros and cons

If the decision warrants it, include a structured analysis of its pros and cons.
Use consistent formatting — each item should start with either **Pro** or **Con** and include a brief justification.

> *"The considered options with their pros and cons are crucial to understand the reasons for choosing a particular design."*
> — Olaf Zimmermann, [MADR Primer][madr-primer]

This section is particularly helpful when you need to revisit the decision later and want to understand the trade-offs that were accepted at the time.

## References:

Include links to related ADRs (both predecessors and successors), external resources such as RFCs, vendor documentation, spike or proof-of-concept results, and any team discussions that informed the decision.

Document when and how the decision should be revisited, and any validation mechanisms in place (such as code review checklists or automated architecture tests).

## Sources

This guide draws from the following sources:

- Michael Nygard, *"Documenting Architecture Decisions"*, November 15, 2011
  <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>
- adr.github.io — ADR organization homepage
  <https://adr.github.io/>
- Joel Parker Henderson, *"Architecture Decision Record"*
  <https://github.com/joelparkerhenderson/architecture-decision-record>
- MADR (Markdown Any Decision Records) v4.0.0
  <https://github.com/adr/madr>
- Olaf Zimmermann, *"Markdown Any Decision Records (MADR) — A Template Primer"*, November 22, 2022
  <https://www.ozimmer.ch/practices/2022/11/22/MADRTemplatePrimer.html>

[nygard]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions "Documenting Architecture Decisions"
[jph]: https://github.com/joelparkerhenderson/architecture-decision-record "Architecture Decision Record"
[madr-primer]: https://www.ozimmer.ch/practices/2022/11/22/MADRTemplatePrimer.html "MADR Template Primer"
