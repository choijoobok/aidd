# AIDD project workspace contract

This exported workspace keeps project SSOT in `project/.aidd/ssot/`; generated documents under `project/docs/generated/` are read-only outputs. Update SSOT, then run `node .ai/tools/aidd.mjs generate` and `validate` for affected project work.

Use the provider's normal hook-trust UI if available, then run `node .ai/tools/aidd_hook.mjs self-test --hook` when changing hook wiring. AIDD hooks provide session context, generated-output protection, terminology refresh, and optional local logging. They do not require an approval gate, a restart, Git signing, or an external trust root.

Project terms use `term-propose`, `term-impact`, `term-decide`, and `term-close`. Keep proposed terms in analysis records until approved. `delivery-glossary` uses the DLP audience to assemble only the glossary view; an end-user delivery contains only customer-visible end-user terms and no source metadata.

For a normal change, run the affected test or direct check plus `node .ai/tools/aidd.mjs validate`. Run `node .aidd-kit-dev/tools/kit.mjs smoke` only in the Kit source when export, new-project, or provider boundaries change.

Do not treat chat history, fixtures, or generated output as product SSOT. Keep local conversation logs under ignored `chat-history/` only when enabled. Use small reversible changes and record the problem, intent, verification, risks, and rollback for significant changes.
