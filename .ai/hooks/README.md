# AIDD hooks

The portable hook contract is `contract.json`; the provider adapters are `.codex/hooks.json` and `.claude/settings.json` in an exported workspace.

Hooks have four operational responsibilities:

- show a small session brief and verify wiring;
- prevent direct edits to generated project documents;
- refresh generated terminology documents after terminology SSOT changes;
- optionally append hook-provided conversation text to ignored `chat-history/`.

They do not approve work, require a new session, inspect Git signatures, or enforce a trust-root. Use the provider's normal hook review UI when available. Run `node .ai/tools/aidd_hook.mjs self-test --hook` after changing hook wiring.

For Kit source work, use `kit.mjs check` for the quick structural check and `kit.mjs smoke` only for export, new-project, or provider-boundary changes.
