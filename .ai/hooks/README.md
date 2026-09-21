# AIDD hooks

The portable hook contract is `contract.json`; provider adapters are `.codex/hooks.json` and `.claude/settings.json`.

Hooks have four responsibilities:

- show a small session brief and verify event wiring;
- prevent direct edits to generated documents and provider skill copies;
- refresh generated terminology documents as a fallback after direct terminology SSOT edits; the normal offline-decision flow uses `term-apply`, which generates and validates them itself;
- optionally append hook-provided conversation text to ignored `chat-history/`.

Hooks do not approve work, track approval or restart state, inspect Git signatures, enforce a trust root, classify general shell commands, or run broad verification automatically. Run `node .ai/tools/aidd_hook.mjs self-test --hook` after changing hook wiring.

On Codex `SessionStart`, the Codex adapter emits both a UI/event-stream `systemMessage` and model-visible `additionalContext`. On `startup`, the context requires the first user request's `final_answer` to start with the `/hooks` review notice so Windows app users see it in the persistent final response even when the UI does not render `systemMessage`. Showing it in a collapsible `commentary` update does not satisfy the contract; if it was shown there, it is repeated in that first `final_answer`. This is a once-per-session instruction, not a per-request rule: if an earlier assistant `final_answer` already contains the notice, later responses must not repeat it. Resume, clear, and compact carry the reminder without requiring another final-answer line. The Claude adapter does not show this notice. The notice does not keep a separate AIDD approval state, wait for a reply, block work, or replace Codex's own hook trust enforcement. Repo-local Codex commands resolve the hook runner from the Git root, or from the nearest parent `.aidd-role.json` before a template has been initialized as a Git repository, so sessions started in subdirectories use the same adapter.

When a user requests AIDD requirement implementation verification, use the `aidd-requirement-verification` skill. Start with the workspace role's documented quick check and add only the changed-area behavior test. Project usage and troubleshooting are described in [the project-team skills and hooks guide](../docs/guides/project-team/04-skills-and-hooks.md).
