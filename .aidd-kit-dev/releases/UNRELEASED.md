# Unreleased changes

## KIT-CHG-008 — lightweight verification baseline

- Daily Kit work uses `kit.mjs check` plus the changed-area test file.
- `kit.mjs smoke` is reserved for export, new-project, and provider-boundary changes.
- Required hooks retain session context, generated-output protection, terminology refresh, and optional local logging.
- TAP/TIR remains a project record workflow; Git signatures, external trust roots, attestation, approval gates, and restart requirements are no longer Kit requirements.
- End-user delivery remains a glossary-only, audience-filtered DLP boundary. Proposed terms remain analysis-only until approved.

Historical `KIT-CHG`, `KIT-ADR`, and `KIT-EVD` records remain in the repository for context but are not revalidated as a release gate for this baseline.
