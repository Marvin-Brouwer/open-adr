# Standardized Documentation Templates

A collection of articles, guides, and references making the case for using standardized templates for software documentation.

---

## References

### [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

**Michael Nygard — Cognitect (2011)**

The foundational post that popularized the Architecture Decision Record (ADR) format — written itself as an ADR. Nygard argues that undocumented architectural decisions create a "blind acceptance or blind reversal" problem for future developers, and proposes a short, standardized template (Title, Context, Decision, Status, Consequences) stored in version control alongside code. The key insight is that small, modular documents have a realistic chance of being kept current, whereas large specification documents never are. Early field reports from six to ten rotating developers confirmed the format effectively transfers institutional context to newcomers.

---

### [Architectural Decision Records — ADR GitHub Organization](https://adr.github.io/)

**ADR GitHub Organization — community, curated by practitioners**

The canonical community hub for ADR tooling, templates, and background research. It collects seven competing ADR template formats, links to comparative studies, and cites adoption by the Azure Well-Architected Framework (Microsoft) and AWS Prescriptive Guidance — demonstrating that standardized decision-record templates have crossed from practitioner blogs into official enterprise guidance. The collection illustrates how a single lightweight template can anchor an entire ecosystem of tooling, process, and community practice.

---

### [Sustainable Architectural Design Decisions](https://www.infoq.com/articles/sustainable-architectural-design-decisions/)

**Uwe Zdun, Rafael Capilla, Huy Tran, Olaf Zimmermann — IEEE Software (republished on InfoQ, 2014)**

A peer-reviewed IEEE Software article drawing on more than ten industrial and eight research projects. The authors find that large decision templates (10–20 fields) are routinely neglected, causing rationale erosion; they propose lean, minimalistic documentation as the starting point, with full templates used only once a decision is stable. The research establishes five sustainability criteria for decisions and demonstrates empirically that guidance-model reuse and explicit traceability links reduce both documentation cost and maintenance effort over the long term.

---

### [Diátaxis — A Systematic Approach to Technical Documentation Authoring](https://diataxis.fr/)

**Daniele Procida — hosted by Read the Docs**

Diátaxis proposes that all technical documentation fits one of four user-need archetypes: *tutorials* (learning-oriented), *how-to guides* (task-oriented), *reference* (information-oriented), and *explanation* (understanding-oriented). By structuring documentation around these four distinct templates, teams simultaneously solve what to write, how to write it, and where to put it. Adopted in production by Vonage, Gatsby, and Cloudflare, all of whom report it made both readers and contributors more effective. The four-quadrant model also acts as a continuous quality criterion, helping authors diagnose what is wrong with existing docs rather than just identifying what is missing.

---

### [Scaling the Practice of Architecture, Conversationally](https://martinfowler.com/articles/scaling-architecture-conversationally.html)

**Andrew Harmel-Law (ThoughtWorks) — martinfowler.com (2021)**

Presents a five-element approach to decentralized software architecture, with Lightweight ADRs as the first and most essential supporting tool. Harmel-Law argues that a consistent ADR template structure is not merely a recording mechanism — it acts as "a thinking checklist" that educates less experienced developers in how to reason about architectural decisions by prompting them through context, options, consequences, and advice. He observes that a series of ADRs stored in source control becomes "decision lore … written in the hand of those who contributed most," providing onboarding value that no wiki or architecture diagram can replicate.

---

### [The C4 Model for Visualising Software Architecture](https://c4model.com/)

**Simon Brown — official website (CC BY 4.0)**

The C4 model provides a standardized, hierarchical template for architecture diagrams: four levels (System Context → Container → Component → Code) each with a defined scope, vocabulary, and permitted relationships. Brown designs the model to be notation-agnostic and tooling-agnostic, so the template is the *structure of thinking*, not a software format. By giving teams a shared, named vocabulary — what a "container" or "component" means in context — the model eliminates the most common source of confusion in architecture reviews: people talking past each other using the same words to mean different things.

---

### [How We Use Golden Paths to Solve Fragmentation in Our Software Ecosystem](https://engineering.atspotify.com/2020/08/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem/)

**Gary Niemen — Spotify Engineering Blog (2020)**

Spotify's "Golden Path" is a standardized, opinionated tutorial template that walks developers through the recommended way to build in each engineering discipline (backend, frontend, data, ML, audio, etc.). Golden Path tutorials became Spotify's most-read technical documentation and are an integral part of onboarding — every new engineer completes the relevant tutorial in their first two weeks. The documented benefits are concrete: teams "don't have to reinvent the wheel, have fewer decisions to make, and can use their productivity and creativity for higher objectives." Standardization here is maintained close to the platform teams that own the tools, keeping templates accurate and fresh.

---

### [Google Developer Documentation Style Guide](https://developers.google.com/style/highlights)

**Google — continuously maintained (CC BY 4.0)**

Google's publicly available documentation style guide provides a comprehensive, opinionated standard for all developer-facing writing: voice and tone, grammar conventions, formatting rules, and accessibility requirements. Publishing this as a public standard means external contributors and third-party teams can produce documentation indistinguishable in quality from internal Google content — consistency at scale without centralized review. The guide is notably *prescriptive*: it makes specific decisions (e.g., always use second person, always use active voice) precisely so that writers don't have to re-make those decisions for every document, reducing cognitive load and enforcing consistency across a vast, distributed authoring community.

---

### [Technical Writing Courses Overview](https://developers.google.com/tech-writing/overview)

**Google — continuously maintained**

Google's open technical writing curriculum (Technical Writing One, Technical Writing Two, Writing Helpful Error Messages, Tech Writing for Accessibility) is targeted explicitly at software engineers rather than professional writers, recognizing that engineers are the primary authors of much developer documentation. The program is structured as a reusable template for training. The existence of this curriculum reflects Google's institutional position that documentation quality is an engineering competency, not a specialist role, and that standardized training templates are necessary to scale that competency across thousands of engineers.

---

### [RFC Editor — About Us (IETF RFC Series)](https://www.rfc-editor.org/about/)

**RFC Editor / IETF — ongoing**

The Request for Comments series, originated by Steve Crocker at UCLA in 1969 as informal working notes for the ARPAnet project, is history's most consequential proof of concept for standardized documentation templates in technical communities. An RFC follows a rigorously standardized structure (abstract, status, terminology, body sections in a defined format) enforced by the RFC Production Center's professional editors. The longevity and authority of the RFC corpus — thousands of documents cited as definitive technical standards — demonstrates that a consistent template and publication process can preserve technical knowledge across decades and institutions, long outlasting the individuals who wrote each document.

---

## Common themes

| Theme | References |
|---|---|
| Templates reduce cognitive load by eliminating recurring authoring decisions | Nygard, Zdun et al., Google Style Guide, Harmel-Law |
| Templates accelerate onboarding | Spotify, Harmel-Law, Nygard |
| Minimalism is essential — templates must be short enough to actually be used | Zdun et al., Nygard, Write the Docs |
| Templates enforce shared vocabulary and prevent ambiguity | C4 model, Google Style Guide, Diátaxis |
| Templates work best when stored close to the code they describe | ADR org, Nygard, Harmel-Law |
| Standardization scales documentation quality across distributed authors | Google Style Guide, Spotify, RFC series |
| Structure helps authors diagnose problems, not only fill gaps | Diátaxis, Harmel-Law |
