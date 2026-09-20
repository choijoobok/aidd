# AIDD hooks

The portable hook contract is `contract.json`; provider adapters are `.codex/hooks.json` and `.claude/settings.json`.

Hooks have four responsibilities:

- show a small session brief and verify event wiring;
- prevent direct edits to generated documents and provider skill copies;
- refresh generated terminology documents after terminology SSOT changes;
- optionally append hook-provided conversation text to ignored `chat-history/`.

Hooks do not approve work, require a new session, inspect Git signatures, enforce a trust root, classify general shell commands, or run broad verification automatically. Run `node .ai/tools/aidd_hook.mjs self-test --hook` after changing hook wiring.

On every Codex session start, the Codex adapter displays a prominent `systemMessage` asking the user to open `/hooks` in Codex CLI and confirm that the workspace hooks were reviewed and trusted. The Claude adapter does not show this notice. The notice does not keep a separate AIDD approval state or replace Codex's own hook trust enforcement.

When a user requests AIDD requirement implementation verification, use the `aidd-requirement-verification` skill. Start with the workspace role's documented quick check and add only the changed-area behavior test. Project usage and troubleshooting are described in [the project-team skills and hooks guide](../docs/guides/project-team/04-skills-and-hooks.md).
