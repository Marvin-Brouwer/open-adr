# Documentation Types for Development Teams

A reference list of common documentation types used by software development teams, grouped by concern.

> **Meta-framework:** [Diátaxis](https://diataxis.fr/) is a widely adopted framework that classifies all documentation into four modes — tutorials, how-to guides, reference, and explanation — based on what the reader needs. It is useful for auditing and structuring any documentation set.

---

## Architecture & Design

- **ADR (Architecture Decision Record)** — Captures a significant architectural decision, its context, and consequences.
  [adr.github.io](https://adr.github.io/) · [Michael Nygard's original post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

- **Functional Design / Functional Specification** — Describes *what* a system or feature should do from a business/user perspective, without specifying *how*.
  [Wikipedia: Functional specification](https://en.wikipedia.org/wiki/Functional_specification)

- **Technical Design Document (TDD)** — Describes *how* a feature or system will be implemented; the engineering counterpart to a functional design.
  [Example: Google design doc template](https://www.industrialempathy.com/posts/design-docs-at-google/)

- **RFC (Request for Comments)** — A proposal document inviting feedback before committing to a design or change. Common in open-source projects.
  [Example: Rust RFC process](https://github.com/rust-lang/rfcs)

- **System Context / C4 Model** — Diagrams that describe a system at different levels of abstraction (context, containers, components, code).
  [c4model.com](https://c4model.com/)

- **Architecture Overview** — A narrative prose document giving the grand tour of a system: its purpose, primary components, key technology choices, and how they fit together. Sits above individual ADRs and C4 diagrams; intended for new engineers or stakeholders.
  [Example: Mailchimp Architecture Overview](https://mailchimp.com/developer/guides/getting-started/)

---

## API & Interface Documentation

- **API Reference** — Documents all endpoints, parameters, request/response shapes, and error codes of an API.
  [OpenAPI Specification](https://swagger.io/specification/) · [Stripe API docs (example)](https://stripe.com/docs/api)

- **Data Dictionary** — Defines all data fields, types, formats, and relationships used in a system.
  [Wikipedia: Data dictionary](https://en.wikipedia.org/wiki/Data_dictionary)

- **Integration Guide** — Explains how to connect to or consume a service from an external system.

- **Entity-Relationship Diagram (ERD) / Database Schema** — Documents the data model: tables, fields, types, and relationships. Often generated from migrations but valuable to maintain as a human-readable artifact.
  [Wikipedia: Entity–relationship model](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model)

- **Webhook Reference** — Documents the events a system emits, their payload shapes, and delivery guarantees. Distinct from REST API docs.

---

## Development & Contributing

- **README** — The entry point for any project: purpose, quick-start, and links to further docs.
  [makeareadme.com](https://www.makeareadme.com/)

- **Contributing Guide (CONTRIBUTING.md)** — Describes how to set up a development environment, coding standards, branching strategy, and how to submit changes.
  [GitHub docs: Setting guidelines for contributors](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors)

- **Code Style Guide / Coding Standards** — Documents language-specific conventions enforced by the team (naming, formatting, patterns to avoid).
  [Example: Google Style Guides](https://google.github.io/styleguide/)

- **Git / Branching Strategy** — Documents the team's workflow (e.g. Gitflow, trunk-based development, PR rules).
  [Atlassian: Comparing Workflows](https://www.atlassian.com/git/tutorials/comparing-workflows)

- **Changelog (CHANGELOG.md)** — A chronological log of notable changes per release.
  [keepachangelog.com](https://keepachangelog.com/)

- **Migration / Upgrade Guide** — Documents breaking changes and the steps required to move from one major version to the next. Critical for published libraries and APIs.
  [Example: Vue 2 → 3 Migration Guide](https://v3-migration.vuejs.org/)

- **Troubleshooting Guide** — A symptom-oriented reference for diagnosing and resolving common problems. User- or operator-facing; distinct from the engineer-focused runbook.

- **Code Review Guidelines** — Documents the team's review culture: what reviewers should focus on, turnaround expectations, how to give constructive feedback, and when to approve vs. request changes. Distinct from coding standards.
  [Example: Google Engineering Practices — How to do a code review](https://google.github.io/eng-practices/review/reviewer/)

---

## Testing

- **Test Strategy** — A high-level document describing the overall approach to quality for a project or organization (scope, types of testing, tools, responsibilities).
  [Wikipedia: Test strategy](https://en.wikipedia.org/wiki/Test_strategy)

- **Test Plan** — A project-level document detailing *what* will be tested, when, by whom, and with which tools.
  [Wikipedia: Test plan](https://en.wikipedia.org/wiki/Test_plan)

- **Test Approach** — A lightweight, feature- or sprint-level description of how a specific piece of work will be tested.

- **Test Cases / Test Spec** — Concrete descriptions of individual test scenarios: preconditions, steps, and expected outcomes.

---

## Operations & Incidents

- **Runbook** — Step-by-step operational procedures for running, monitoring, or recovering a system. The day-to-day companion for on-call engineers.
  [Google SRE Book: Runbooks](https://sre.google/sre-book/on-call/) · [Example runbook template](https://github.com/SkeltonThatcher/run-book-template)

- **Incident Response Playbook** — Documents the process for detecting, triaging, escalating, and resolving incidents (who does what at each severity level).
  [PagerDuty Incident Response Guide](https://response.pagerduty.com/)

- **Post-mortem / Incident Review** — A blameless retrospective written after an incident, capturing timeline, root cause, impact, and action items to prevent recurrence.
  [Google SRE: Postmortem culture](https://sre.google/sre-book/postmortem-culture/) · [GitLab postmortem template](https://handbook.gitlab.com/handbook/engineering/infrastructure/incident-management/#postmortem-process)

- **On-call Guide** — Describes expectations, escalation paths, and tooling for engineers on call.

- **SLA / SLO / SLI Definitions** — Documents the agreed service levels, objectives, and the metrics used to measure them.
  [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

- **Monitoring & Observability Guide** — Describes what is instrumented, where dashboards live, what alerts exist and their thresholds, and how to interpret log and trace data. Bridges the gap between infrastructure setup and the runbook.
  [Google SRE Book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

---

## Release & Deployment

- **Release Procedure** — Documents the steps required to build, validate, and deploy a release to production (manual steps, checklists, sign-offs).

- **Deployment Guide** — Describes *how* to deploy the system to a given environment, including configuration, secrets, and health checks.

- **Rollback Plan** — Documents how and when to revert a deployment if something goes wrong.

- **Release Notes** — User-facing summary of what changed in a given version.

- **Deprecation / EOL Notice** — Formally communicates that a feature, API version, or product is being retired: the timeline, the reason, and the recommended alternative. Distinct from a migration guide (which covers *how* to move) — this is the *announcement*.
  [Example: GitHub API deprecation notices](https://github.blog/changelog/label/deprecation/)

---

## Security & Compliance

- **Threat Model** — Documents assets, potential attack vectors, and mitigations for a system.
  [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)

- **Security Policy (SECURITY.md)** — Describes the responsible disclosure process and supported versions.
  [GitHub docs: Adding a security policy](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository)

- **Data Flow Diagram (DFD)** — Shows how data moves through a system; often required for security reviews or GDPR compliance.
  [Wikipedia: Data flow diagram](https://en.wikipedia.org/wiki/Data-flow_diagram)

- **License Notice File (NOTICE / LICENSES)** — Lists the open-source licenses of all bundled dependencies. Required by many licenses (Apache 2.0, etc.) and increasingly by enterprise procurement.
  [REUSE specification](https://reuse.software/spec/)

- **Accessibility Statement** — Declares the accessibility conformance level (e.g. WCAG 2.1 AA) of a product, known issues, and contact for support. Legally required in many jurisdictions for public-sector and consumer-facing products.
  [W3C: Developing an Accessibility Statement](https://www.w3.org/WAI/planning/statements/)

---

## Product & Requirements

- **PRD (Product Requirements Document)** — Describes the purpose, features, and constraints of a product or feature from the product owner's perspective.
  [Atlassian: How to write a PRD](https://www.atlassian.com/agile/product-management/requirements)

- **User Stories / Use Cases** — Describes functionality from the end-user's point of view; forms the basis for sprint work items.
  [Atlassian: User stories](https://www.atlassian.com/agile/project-management/user-stories)

---

## Team & Process

- **Team Handbook / Ways of Working** — Captures team norms, meeting rhythms, decision-making processes, and communication conventions.
  [Example: GitLab Handbook](https://handbook.gitlab.com/)

- **Onboarding Guide** — Helps new team members get up to speed on tooling, processes, and codebase conventions.

- **Definition of Done (DoD)** — A shared checklist of quality criteria that must be met before work is considered complete.
  [Scrum.org: Definition of Done](https://www.scrum.org/resources/blog/done-understanding-definition-done)

- **Glossary / Ubiquitous Language** — Defines domain-specific terms to ensure everyone uses consistent vocabulary.
  [Martin Fowler: Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html)

- **Definition of Ready (DoR)** — The counterpart to DoD: a checklist of criteria that must be met before a work item can enter a sprint.
  [Scrum.org: Definition of Ready](https://www.scrum.org/resources/blog/definition-ready)

---

## User-Facing Documentation

> [!NOTE] Out of scope
>
> These document types are highly valuable but are **out of scope for this library**, which focuses on team- and engineering-facing documentation.

- **Tutorial** — A learning-oriented walkthrough that guides a newcomer through a complete, working example. Success is measured by what the reader *does*.
  [Diátaxis: Tutorials](https://diataxis.fr/tutorials/)

- **How-to Guide** — A task-oriented recipe for achieving a specific goal. Assumes competence; focuses on steps, not explanation.
  [Diátaxis: How-to guides](https://diataxis.fr/how-to-guides/)

- **Explanation / Concept Guide** — An understanding-oriented piece that explains *why* something works the way it does. Provides context and background.
  [Diátaxis: Explanation](https://diataxis.fr/explanation/)

- **User Manual** — Comprehensive reference documentation for end users; covers all features of a product.
  [Wikipedia: User guide](https://en.wikipedia.org/wiki/User_guide)

- **FAQ (Frequently Asked Questions)** — Curated answers to questions that recur in support channels. Valuable as a living document updated from actual user confusion.

- **Quick Start Guide** — A minimal, opinionated path to a first success. Shorter than a tutorial; designed to reduce time-to-value.

---

## Architecture & Design (less common)

- **DACI / RACI Matrix** — Documents who is the Driver, Approver, Contributor, and Informed for decisions or work items. Reduces ambiguity in cross-team ownership.
  [Atlassian: DACI decision-making framework](https://www.atlassian.com/team-playbook/plays/daci)

- **Event Storming / Domain Story** — A workshop-output document that maps domain events, commands, and aggregates; often used in DDD contexts.
  [eventstorming.com](https://www.eventstorming.com/) · [Domain Storytelling](https://domainstorytelling.org/)

- **Fitness Functions** — Defines automated, measurable criteria that verify architectural characteristics (e.g. coupling thresholds, performance budgets) over time.
  [Building Evolutionary Architectures (O'Reilly)](https://www.oreilly.com/library/view/building-evolutionary-architectures/9781491986356/)

- **Spike Report** — Documents the findings of a time-boxed research spike: what was explored, what was learned, and what is recommended.
  [Agile Alliance: Spike](https://www.agilealliance.org/glossary/spikes/)

---

## Operations & Incidents (less common)

- **Capacity Plan** — Documents expected load, resource requirements, and scaling thresholds for a system over a time horizon.
  [Google SRE Book: Being On Call](https://sre.google/sre-book/being-on-call/)

- **Chaos Engineering Plan** — Describes experiments designed to proactively find weaknesses in a system by injecting controlled failures.
  [Principles of Chaos Engineering](https://principlesofchaos.org/)

- **Disaster Recovery Plan (DRP)** — Documents the procedures to recover systems and data after a major failure or catastrophic event.
  [Wikipedia: Disaster recovery plan](https://en.wikipedia.org/wiki/Disaster_recovery_plan)

---

## Security & Compliance (less common)

- **Privacy Impact Assessment (PIA / DPIA)** — Required under GDPR for processing activities that carry high risk; documents what data is used, why, and how it is protected.
  [GDPR.eu: Data Protection Impact Assessment](https://gdpr.eu/data-protection-impact-assessment-template/)

- **Supply Chain / Dependency Inventory (SBOM)** — A Software Bill of Materials: a machine-readable list of all components, libraries, and licenses in a product.
  [NTIA: SBOM overview](https://www.ntia.gov/page/software-bill-materials)

---

## Development & Contributing (less common)

- **Decision Log** — A running log of day-to-day decisions that are too small for a full ADR but worth recording (e.g. "we chose library X because Y").

- **Known Issues / Tech Debt Register** — A living document listing accepted technical compromises, their rationale, and a plan (or conscious decision not) to address them.

- **Proof of Concept (PoC) Report** — Documents the goal, implementation, outcomes, and limitations of an exploratory prototype.

---

## Product & Requirements (less common)

- **North Star Document** — Describes the long-term vision and strategic direction for a product; used to align teams across quarters.
  [Example: Amplitude North Star Playbook](https://amplitude.com/blog/north-star-playbook)

- **Non-Functional Requirements (NFR) Specification** — Explicitly documents quality attributes such as performance targets, availability, scalability, and accessibility requirements.
  [Wikipedia: Non-functional requirement](https://en.wikipedia.org/wiki/Non-functional_requirement)

- **Event Contract / AsyncAPI** — Describes the schema and semantics of asynchronous messages or events exchanged between services.
  [AsyncAPI Specification](https://www.asyncapi.com/)
