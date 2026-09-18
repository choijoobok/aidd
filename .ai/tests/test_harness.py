import json
import importlib.util
import io
import os
import subprocess
import sys
import unittest
from unittest import mock
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / ".ai" / "tools" / "aidd_hook.py"
FIXTURES = ROOT / ".ai" / "tests" / "fixtures" / "hooks"
SPEC = importlib.util.spec_from_file_location("aidd_for_harness", ROOT / ".ai" / "tools" / "aidd.py")
AIDD = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(AIDD)


def load_json_without_duplicate_keys(path: Path):
    def reject_duplicates(pairs):
        value = {}
        for key, item in pairs:
            if key in value:
                raise ValueError(f"duplicate JSON key: {key}")
            value[key] = item
        return value

    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicates)


def run_hook(*args: str, payload=None) -> subprocess.CompletedProcess[str]:
    stdin = "" if payload is None else json.dumps(payload, ensure_ascii=False)
    return subprocess.run(
        [sys.executable, str(HOOK), *args],
        cwd=ROOT,
        input=stdin,
        text=True,
        capture_output=True,
        encoding="utf-8",
        check=False,
    )


def decision(result: subprocess.CompletedProcess[str]) -> str | None:
    if not result.stdout.strip():
        return None
    return json.loads(result.stdout)["hookSpecificOutput"]["permissionDecision"]


class HarnessProtectionTests(unittest.TestCase):
    def test_policy_load_failure_allows_only_runtime_recovery_file(self):
        sys.path.insert(0, str(ROOT / ".ai" / "tools"))
        try:
            import aidd_hook

            payload = {"tool_name": "Write", "tool_input": {"file_path": ".ai/tools/aidd_hook.py"}}
            with (
                mock.patch.object(aidd_hook, "load_policy", side_effect=ValueError("broken policy")),
                mock.patch.object(aidd_hook, "read_input", return_value=payload),
                mock.patch("sys.stdout", new_callable=io.StringIO) as output,
            ):
                self.assertEqual(0, aidd_hook.protect("file"))
                self.assertEqual("", output.getvalue())
        finally:
            sys.path.remove(str(ROOT / ".ai" / "tools"))

    def test_allows_canonical_ssot_write(self):
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "file",
            payload={"tool_name": "Write", "tool_input": {"file_path": "project/.aidd/ssot/requirements.json"}},
        )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def test_blocks_generated_document_write(self):
        payload = json.loads((FIXTURES / "claude-write-generated.json").read_text(encoding="utf-8"))
        result = run_hook(
            "protect",
            "--platform",
            "claude",
            "--kind",
            "file",
            payload=payload,
        )
        self.assertEqual("deny", decision(result))
        self.assertIn("파생 산출물", result.stdout)

    def test_blocks_apply_patch_to_provider_skill(self):
        patch = "*** Begin Patch\n*** Update File: .agents/skills/aidd-status/SKILL.md\n@@\n-x\n+y\n*** End Patch"
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "file",
            payload={"tool_name": "apply_patch", "tool_input": {"patch": patch}},
        )
        self.assertEqual("deny", decision(result))

    def test_allows_codex_apply_patch_command_to_canonical_file(self):
        patch = "*** Begin Patch\n*** Update File: project/.aidd/ssot/project.json\n@@\n-x\n+y\n*** End Patch"
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "file",
            payload={"tool_name": "apply_patch", "tool_input": {"command": patch}},
        )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def test_blocks_mcp_filename_in_generated_root(self):
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "file",
            payload={
                "tool_name": "mcp__fs__write",
                "tool_input": {"filename": "project/docs/generated/requirements.md", "content": "x"},
            },
        )
        self.assertEqual("deny", decision(result))

    def test_unknown_mcp_write_schema_fails_closed(self):
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "file",
            payload={"tool_name": "mcp__fs__write", "tool_input": {"opaque": "value"}},
        )
        self.assertEqual("deny", decision(result))

    def test_blocks_destructive_shell_command(self):
        payload = json.loads((FIXTURES / "codex-destructive-shell.json").read_text(encoding="utf-8"))
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "shell",
            payload=payload,
        )
        self.assertEqual("deny", decision(result))
        self.assertIn("되돌리기", result.stdout)

    def test_blocks_shell_write_to_generated_root(self):
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "shell",
            payload={"tool": {"name": "PowerShell"}, "arguments": {"cmd": "Set-Content project/docs/generated/x.md bad"}},
        )
        self.assertEqual("deny", decision(result))

    def test_blocks_common_shell_write_variants_to_generated_root(self):
        commands = (
            "'bad' | tee project/docs/generated/x.md",
            "sed -i 's/a/b/' project/docs/generated/x.md",
            "Copy-Item source.md project/docs/generated/x.md",
            "cp source.md project/docs/generated/x.md",
            "New-Item project/docs/generated/x.md -ItemType File",
        )
        for command in commands:
            with self.subTest(command=command):
                result = run_hook(
                    "protect", "--platform", "codex", "--kind", "shell",
                    payload={"tool_name": "PowerShell", "tool_input": {"command": command}},
                )
                self.assertEqual("deny", decision(result))

    def test_allows_read_only_shell_command(self):
        result = run_hook(
            "protect",
            "--platform",
            "codex",
            "--kind",
            "shell",
            payload={"tool_name": "PowerShell", "tool_input": {"command": "git diff --stat"}},
        )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("", result.stdout)

    def test_malformed_input_fails_closed(self):
        result = subprocess.run(
            [sys.executable, str(HOOK), "protect", "--platform", "claude", "--kind", "file"],
            cwd=ROOT,
            input="{bad json",
            text=True,
            capture_output=True,
            encoding="utf-8",
            check=False,
        )
        self.assertEqual("deny", decision(result))
        self.assertIn("내부 실패", result.stdout)


class HarnessWiringTests(unittest.TestCase):
    def test_session_brief_includes_current_local_actor(self):
        sys.path.insert(0, str(ROOT / ".ai" / "tools"))
        try:
            import aidd_hook

            observed = []
            def fake_run_aidd(*args):
                observed.append(args)
                return 0, "ok"

            with mock.patch.object(aidd_hook, "run_aidd", side_effect=fake_run_aidd), mock.patch(
                "sys.stdout", new_callable=io.StringIO,
            ):
                self.assertEqual(0, aidd_hook.session_brief())
            self.assertIn(("current-actor",), observed)
        finally:
            sys.path.remove(str(ROOT / ".ai" / "tools"))

    def test_local_log_masks_secrets_and_reads_stop_message(self):
        sys.path.insert(0, str(ROOT / ".ai" / "tools"))
        try:
            import aidd_hook

            self.assertIn("[REDACTED]", aidd_hook.redact_conversation("Bearer secret-token-value"))
            self.assertEqual(
                "완료했습니다.",
                aidd_hook.conversation_text({"last_assistant_message": "완료했습니다."}, "assistant"),
            )
        finally:
            sys.path.remove(str(ROOT / ".ai" / "tools"))

    def test_local_log_uses_month_and_daily_files_below_project_chat_history(self):
        sys.path.insert(0, str(ROOT / ".ai" / "tools"))
        try:
            import aidd_hook

            now = aidd_hook.datetime.now().astimezone()
            expected = ROOT / "project" / "chat-history" / now.strftime("%Y-%m") / (now.strftime("%Y-%m-%d") + ".md")
            marker = "AIDD local-log test marker"
            with mock.patch.object(aidd_hook, "read_input", return_value={"prompt": f"{marker}: Bearer secret-token-value"}):
                self.assertEqual(0, aidd_hook.local_log("codex", "user"))
            self.assertTrue(expected.exists())
            content = expected.read_text(encoding="utf-8")
            self.assertIn("· codex · 사용자", content)
            self.assertIn(marker, content)
            self.assertIn("[REDACTED]", content)
        finally:
            sys.path.remove(str(ROOT / ".ai" / "tools"))

    def test_skill_manifest_detects_stale_provider_file(self):
        sys.path.insert(0, str(ROOT / ".ai" / "tools"))
        try:
            import aidd_hook

            errors = aidd_hook.skill_manifest_errors(
                {"SKILL.md": "same"},
                {"SKILL.md": "same", "stale.md": "stale"},
                ".agents/skills",
            )
            self.assertTrue(any("stale provider skill" in item for item in errors))
        finally:
            sys.path.remove(str(ROOT / ".ai" / "tools"))

    def test_post_check_failure_is_advisory(self):
        result = subprocess.run(
            [sys.executable, str(HOOK), "post-check", "--platform", "claude"],
            cwd=ROOT,
            input="{bad json",
            text=True,
            capture_output=True,
            encoding="utf-8",
            check=False,
        )
        self.assertEqual(0, result.returncode)
        payload = json.loads(result.stdout)
        self.assertEqual("PostToolUse", payload["hookSpecificOutput"]["hookEventName"])
        self.assertIn("경고", payload["systemMessage"])

    def test_post_check_warns_when_product_source_changes(self):
        payload = json.dumps({"tool_name": "Write", "tool_input": {"file_path": "project/src/README.md"}})
        result = subprocess.run(
            [sys.executable, str(HOOK), "post-check", "--platform", "codex"],
            cwd=ROOT, input=payload, text=True, capture_output=True, encoding="utf-8", check=False,
        )
        self.assertEqual(0, result.returncode, result.stderr)
        output = json.loads(result.stdout)
        self.assertIn("문서 현행화 후보", output["systemMessage"])
        self.assertIn("document-impact", output["systemMessage"])

    def test_provider_hook_json_is_valid_and_wired(self):
        for rel in (Path(".claude/settings.json"), Path(".codex/hooks.json")):
            value = load_json_without_duplicate_keys(ROOT / rel)
            self.assertTrue({"SessionStart", "PreToolUse", "PostToolUse", "UserPromptSubmit", "Stop"}.issubset(value["hooks"]))
            encoded = json.dumps(value["hooks"], ensure_ascii=False)
            for token in ("session-brief", "self-test", "protect", "post-check", "local-log", "file", "shell", "user", "assistant"):
                self.assertIn(token, encoded, f"{rel}: {token}")
            post_matchers = " ".join(item.get("matcher", "") for item in value["hooks"]["PostToolUse"])
            self.assertIn("Bash", post_matchers, f"{rel}: source changes through shell must be observed")

    def test_common_contract_declares_recovery_and_local_log_boundaries(self):
        contract = load_json_without_duplicate_keys(ROOT / ".ai/hooks/contract.json")
        self.assertEqual(1, contract["version"])
        self.assertIn("UserPromptSubmit", contract["events"])
        self.assertIn(".ai/tools/aidd_hook.py", contract["recovery_paths"])
        self.assertEqual("project/chat-history", contract["local_conversation_log"]["root"])
        self.assertEqual("%Y-%m/%Y-%m-%d.md", contract["local_conversation_log"]["date_format"])
        self.assertIn("documentation-check --staged", contract["git_pre_commit"]["command"])
        pre_commit = (ROOT / ".githooks" / "pre-commit").read_text(encoding="utf-8")
        self.assertIn("branch-check || exit $?", pre_commit)
        self.assertIn("documentation-check --staged", pre_commit)

    def test_codex_hook_commands_resolve_repository_root(self):
        value = load_json_without_duplicate_keys(ROOT / ".codex/hooks.json")
        handlers = [
            handler
            for groups in value["hooks"].values()
            for group in groups
            for handler in group.get("hooks", [])
            if handler.get("type") == "command"
        ]
        self.assertTrue(handlers)
        for handler in handlers:
            self.assertIn("git rev-parse --show-toplevel", handler["command"])
            self.assertIn("git rev-parse --show-toplevel", handler["commandWindows"])

    @unittest.skipUnless(os.name == "nt", "Windows command regression")
    def test_codex_windows_hook_runs_from_subdirectory(self):
        value = load_json_without_duplicate_keys(ROOT / ".codex/hooks.json")
        handler = next(
            item
            for group in value["hooks"]["SessionStart"]
            for item in group.get("hooks", [])
            if "self-test --hook" in item.get("commandWindows", "")
        )
        result = subprocess.run(
            handler["commandWindows"],
            cwd=ROOT / ".agents",
            text=True,
            capture_output=True,
            encoding="utf-8",
            shell=True,
            check=False,
        )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertNotIn("can't open file", result.stderr)

    def test_harness_self_test(self):
        result = run_hook("self-test")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("passed", result.stdout)

    def test_sync_ai_runs_harness_self_test(self):
        completed = subprocess.CompletedProcess([], 0, "AIDD harness self-test passed\n", "")
        with (
            mock.patch.object(AIDD.Path, "write_text") as write_text,
            mock.patch.object(AIDD, "safe_replace_tree"),
            mock.patch.object(AIDD.subprocess, "run", return_value=completed) as run,
        ):
            AIDD.sync_ai()
        write_text.assert_not_called()
        command = run.call_args.args[0]
        self.assertEqual("self-test", command[-1])
        self.assertIn("aidd_hook.py", command[-2])

    def test_common_agent_contract_has_one_canonical_source(self):
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        claude = (ROOT / "CLAUDE.md").read_text(encoding="utf-8")
        self.assertTrue(agents.startswith("# AIDD AI 수행 계약"))
        self.assertEqual("@AGENTS.md", next(line.strip() for line in claude.splitlines() if line.strip()))
        self.assertNotIn("# AIDD AI 수행 계약", claude)
        self.assertFalse((ROOT / ".ai" / "core" / "agent-contract.md").exists())

    def test_commit_template_records_material_ai_assistance(self):
        template = (ROOT / ".ai" / "templates" / "git" / "commit-message.md").read_text(encoding="utf-8")
        self.assertIn("AI-Assisted-By: <Codex | Claude>", template)
        self.assertNotIn("\nAgent:", template)
        self.assertIn("반복", template)


if __name__ == "__main__":
    unittest.main()
