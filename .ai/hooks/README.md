# AIDD hooks

The portable hook contract is `contract.json`; provider adapters are `.codex/hooks.json` and `.claude/settings.json`. Runtime hooks live in `.ai/hooks/*.mjs`.

Hook isolation is the first and overriding rule. Every provider, event, and responsibility owns a dedicated `.mjs` process. Runtime hooks never import or call another AIDD hook and never use a shared dispatcher or runtime library. Deliberate code duplication is preferred over runtime coupling. Existing registration slots stay fixed because Codex trust keys include event, group, and handler positions. If a provider cannot give a new hook an independent source without shifting another hook's slot or approval hash, do not add it and report the provider limitation.

Hooks have four responsibilities:

- show a small session brief and verify event wiring;
- prevent direct edits to generated documents and provider skill copies;
- refresh generated terminology documents as a fallback after direct terminology SSOT edits; the normal offline-decision flow uses `term-apply`, which generates and validates them itself;
- stage each `UserPromptSubmit` by provider, session, and turn, then append the staged prompt and final `Stop` response as one provider-labelled, locked block in `chat-history/YYYY-MM/raw/YYYY-MM-DD.md`. A user-only or assistant-only block is never written. `AIDD_CONVERSATION_LOG_FILE` can select one alternate sink for tests or an explicitly configured deployment.

Hooks do not approve work, track approval or restart state, inspect Git signatures, enforce a trust root, classify general shell commands, or run broad verification automatically. Run `node .ai/tools/aidd_hook.mjs self-test --hook` after changing hook wiring.

On Codex `SessionStart`, the dedicated reminder hook emits both a UI/event-stream `systemMessage` and model-visible `additionalContext`. On `startup`, the context requires the first user request's `final_answer` to start with the `/hooks` review notice so Windows app users see it in the persistent final response even when the UI does not render `systemMessage`. Showing it in a collapsible `commentary` update does not satisfy the contract; if it was shown there, it is repeated in that first `final_answer`. This is a once-per-session instruction, not a per-request rule: if an earlier assistant `final_answer` already contains the notice, later responses must not repeat it. Resume, clear, and compact carry the reminder without requiring another final-answer line. The Claude adapter does not show this notice. The notice does not keep a separate AIDD approval state, wait for a reply, block work, or replace Codex's own hook trust enforcement.

When a user requests AIDD requirement implementation verification, use the `aidd-requirement-verification` skill. Start with the workspace role's documented quick check and add only the changed-area behavior test. Project usage and troubleshooting are described in [the project-team skills and hooks guide](../docs/guides/project-team/04-skills-and-hooks.md).
