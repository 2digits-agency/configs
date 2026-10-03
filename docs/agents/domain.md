# Domain docs

## Before exploring

Single-context layout for the entire monorepo:

- Read root `GLOSSARY.md`.
- Read relevant decisions in `docs/adr/`.

If absent, proceed silently. `/domain-modeling` creates these lazily when terms or decisions are resolved.

## File structure

- `GLOSSARY.md`: shared domain vocabulary.
- `docs/adr/NNNN-short-title.md`: architectural decisions.

## Vocabulary

Use glossary terms in issue titles, proposals, hypotheses, and test names.
If a needed concept is missing, reconsider the term or note the gap for `/domain-modeling`.

## ADR conflicts

Explicitly flag proposals that contradict an ADR, identifying the decision and reason to reopen it.
