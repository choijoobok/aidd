# AIDD project workspace contract

This exported workspace keeps project SSOT in `project/.aidd/ssot/`; generated documents under `project/docs/generated/` are read-only outputs. Update SSOT, then run `node .ai/tools/aidd.mjs generate` and `validate` for affected project work.

Run `node .ai/tools/aidd_hook.mjs self-test --hook` when changing hook wiring. AIDD hooks provide session context, generated-output protection, terminology refresh, and optional local logging. They do not require an approval gate, a restart, Git signing, an external trust root, or broad shell inspection.

Project terms use `term-propose`, `term-impact`, `term-decide`, and `term-close`. Keep proposed terms in analysis records until approved. `delivery-glossary` uses the DLP audience to assemble only the glossary view; an end-user delivery contains only customer-visible end-user terms and no source metadata.

For a normal change, run the affected test or direct check plus `node .ai/tools/aidd.mjs validate`. When the user asks whether AIDD requirements are faithfully implemented, use the `aidd-requirement-verification` skill. Do not add security, permission, identity, or signature checks unless the applicable requirement or the user asks for them. In Kit source, run `kit.mjs smoke` only when generation, fixture, export, new-project, or provider boundaries change.

Do not treat chat history, fixtures, or generated output as product SSOT. Keep local conversation logs under ignored `chat-history/` only when enabled. Use small reversible changes and record the problem, intent, verification, risks, and rollback for significant changes.
