# Documentation Close to Code

A collection of articles, guides, and references making the case for keeping documentation co-located with — or treated the same as — source code.

---

## References

### [Docs as Code](https://www.writethedocs.org/guide/docs-as-code/)

**Write the Docs — Eric Holscher & the Write the Docs community**

The canonical community definition of "docs as code": documentation written with the same tools and workflows as code — version control (Git), plain-text markup, code review, issue trackers, and automated tests. The guide argues this integration enables shared ownership between writers and developers, allows blocking feature merges that lack documentation, and naturally keeps docs fresh. The page collects years of conference talks from Google, Rackspace, the UK Government Digital Service, AWS, and others who adopted the approach at scale.

---

### [Code As Documentation](https://martinfowler.com/bliki/CodeAsDocumentation.html)

**Martin Fowler — Thoughtworks (2005)**

A widely-cited essay arguing that in agile methods, code is the *primary* documentation of a system — the only artifact precise and detailed enough to serve that role fully. Fowler stresses this doesn't eliminate other documentation forms, but that treating code as documentation forces developers to prioritize clarity and readability. He connects readability to code-review culture and recommends treating code quality as a team discipline rather than an individual style choice.

---

### [Docs as Code Tools and Workflows](https://idratherbewriting.com/learnapidoc/pubapis_docs_as_code.html)

**Tom Johnson — I'd Rather Be Writing (API Documentation Course)**

A detailed practical guide explaining what docs-as-code means in the API documentation space. Johnson recounts how Google's technical writers (notably Riona Macnamara) moved documentation *into the same repository as source code*, which solved scattered, hard-to-find, and out-of-date docs. Key enumerated benefits: developers contribute more naturally in familiar toolchains; continuous delivery pipelines keep docs in sync with code; collaboration is easier when docs live in the same repo as the code they describe.

---

### [Why we use a 'docs as code' approach for technical documentation](https://technology.blog.gov.uk/2017/08/25/why-we-use-a-docs-as-code-approach-for-technical-documentation/)

**Jen Lambourne — UK Government Digital Service (2017)**

A practitioner account from the UK government's digital delivery team. The team adopted docs-as-code because their agile delivery model required documentation to evolve at the same pace as features — impossible with traditional publishing systems. By managing docs in GitHub alongside code, the whole product team (developers, architects, ops) shares ownership, anyone can submit pull requests, and versioning ensures users always see the most current documentation. The post emphasizes that co-location with development tooling directly supports frequent releases and reduces documentation-code drift.

---

### [The Documentation System](https://docs.divio.com/documentation-system/)

**Daniele Procida — Divio**

Presents a structural framework for documentation (tutorials, how-to guides, reference, explanation) widely adopted in open-source projects such as Django and NumPy. While not exclusively about co-location, the system is explicitly designed to be maintained *in the same repository as code*, versioned alongside it, and kept accurate by the development team. Its widespread adoption in OSS projects provides empirical evidence that developer-maintained, repo-co-located documentation can achieve high quality when given the right structure.

---

### [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)

**Martin Fowler — Thoughtworks (updated 2024)**

While primarily about CI practices, this article makes the case that *everything needed to build and understand a system* — including configuration, schemas, and documentation — should live in the version-controlled repository. Fowler's principle: "anyone should be able to bring in a clean machine, check the sources out of the repository, issue a single command, and have a running system." Co-locating all project artifacts in version control is a foundational CI practice; documentation that must stay synchronized with code changes is no exception.

---

### [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)

**GitHub Docs — GitHub / Microsoft**

GitHub's official guidance on repository documentation reflects platform-level endorsement of co-located documentation. By automatically surfacing README files from the repo root or `docs/` directory, GitHub treats the repository itself as the canonical home for documentation. The guidance explicitly recommends relative links (not absolute URLs) so documentation travels with the cloned code, and acknowledges the `docs/` folder as a first-class documentation home — institutionalizing the idea that a project's documentation should live *in* and travel *with* the codebase.

---

### [Principles behind the Agile Manifesto](https://agilemanifesto.org/principles.html)

**The Agile Manifesto authors (Beck, Fowler et al., 2001)**

The founding document of agile software development famously states "working software over comprehensive documentation," which is often misread as anti-documentation. In reality it is a prioritization: documentation that does not directly serve the goal of working software is waste. The corollary — well understood by agile practitioners — is that documentation *co-located with code*, versioned with it, and maintained alongside it *does* serve that goal. This framing provides the intellectual root of the docs-as-code movement.

---

## Common themes

| Theme | References |
|---|---|
| Versioning docs with code prevents documentation–code drift | Write the Docs, GDS, GitHub Docs, CI |
| Developer familiarity with toolchain increases contribution | Write the Docs, I'd Rather Be Writing, GDS |
| Shared ownership between writers and developers | Write the Docs, GDS |
| CI/CD can gate releases on documentation completeness | Write the Docs, I'd Rather Be Writing |
| Code itself is the most precise form of documentation | Code As Documentation, Agile Manifesto |
| Structure enables maintainable co-located docs | The Documentation System |
