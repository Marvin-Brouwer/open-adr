# Open ADR (architecture decision record)

A standard template for ADRs.  
There's quite some different takes on ADRs, we've seen them ranging from simple markdown files to full on tables in word documents.  

This repository is an attempt at unifying an open standard for ADRs.

## TODO

There's still some stuff to do.

- [x] Split v1 spec into parts
- [x] See if we can add `pattern:md` templates
  This is so we can use this for tooling later.
  It will basically just be string yaml template, but the tooling will validate (and code complete) markdown.
- [ ] Create simple node package to convert yml to markdown and pdf
- [x] Add actual examples
- [ ] Setup pipeline for publishing spec
- [ ] Add usage guide
- [ ] Add documentation about what an ADR is
- [ ] Add comment documentation to spec

## TODO later

- [ ] Create visual studio code plugin
  - "new ADR" functionality
  - Actually constrain order, yaml doesn't
  - Add save-as functionality, based on node script
  - Show different status icon in "explorer view"

## Reading material

- A good list of ADR examples, and some text on what an ADR really is  
  <https://github.com/joelparkerhenderson/architecture-decision-record>
- Medium article about the basics  
  <https://medium.com/@nolomokgosi/basics-of-architecture-decision-records-adr-e09e00c636c6>
- Another article  
  <https://www.redhat.com/en/blog/architecture-decision-records>
- Some other ADR github organization  
  <https://adr.github.io/>  
  They have a merged ADR template of several existing ones, plus some kind of reference to an ISO standard. More reading is required.  
  