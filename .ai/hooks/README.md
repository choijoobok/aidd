# AIDD hooks

The portable hook contract is `contract.json`; provider adapters are `.codex/hooks.json` and `.claude/settings.json`.

Hooks have four responsibilities:

- show a small session brief and verify event wiring;
- prevent direct edits to generated documents and provider skill copies;
- refresh generated terminology documents after terminology SSOT changes;
- optionally append hook-provided conversation text to ignored `chat-history/`.

Hooks do not approve work, require a new session, inspect Git signatures, enforce a trust root, classify general shell commands, or run broad verification automatically. Run `node .ai/tools/aidd_hook.mjs self-test --hook` after changing hook wiring.

When a user requests AIDD requirement implementation verification, use the `aidd-requirement-verification` skill. For Kit source work, start with `kit.mjs check` and add the changed-area test. Run `kit.mjs smoke` only when generation, export, new-project, fixture, or provider boundaries are in scope.
