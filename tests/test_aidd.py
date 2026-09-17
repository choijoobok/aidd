import copy
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("aidd", ROOT / "tools" / "aidd.py")
AIDD = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(AIDD)


class AiddTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = AIDD.load_records()

    def test_canonical_graph_and_outputs_are_current(self):
        errors, _warnings = AIDD.validate(self.data)
        self.assertEqual([], errors)

    def test_generation_is_deterministic(self):
        self.assertEqual(AIDD.render_documents(self.data), AIDD.render_documents(self.data))

    def test_every_requirement_has_module_and_verification(self):
        for requirement in self.data["requirements"]["requirements"]:
            self.assertTrue(requirement["modules"], requirement["id"])
            self.assertTrue(requirement["verification"], requirement["id"])

    def test_module_status_view(self):
        text = AIDD.status_text(self.data, "module", "MOD-AI")
        self.assertIn("REQ-013", text)
        self.assertIn("AI 플랫폼 어댑터", text)

    def test_planned_release_is_blocked_without_evidence(self):
        release = self.data["releases"]["releases"][0]
        self.assertTrue(AIDD.release_blockers(self.data, release))

    def test_technology_gates_precede_feature_development(self):
        policy = self.data["technology"]["policy"]
        sequence = " ".join(policy["sequence"])
        self.assertLess(sequence.index("TG-001"), sequence.index("TG-002"))
        self.assertLess(sequence.index("TG-002"), sequence.index("기능 증분 계획"))
        gates = {item["id"]: item for item in self.data["technology"]["gates"]}
        self.assertIn("현행 유지안을 포함한 실행 가능한 후보 비교", gates["TG-001"]["required_evidence"])
        self.assertTrue(gates["TG-002"]["required_evidence"])

    def test_deployment_gate_precedes_technology_selection(self):
        policy = self.data["deployment"]["policy"]
        sequence = " ".join(policy["sequence"])
        self.assertLess(sequence.index("DG-001"), sequence.index("TG-001"))
        self.assertLess(sequence.index("TG-001"), sequence.index("TG-002"))
        required_fields = {
            "environment", "hosting", "runtime", "topology", "scaling", "dbms",
            "state", "workload", "availability", "security_operations",
        }
        for profile in self.data["deployment"]["profiles"]:
            self.assertTrue(required_fields.issubset(profile), profile["id"])
            self.assertTrue(all(profile[field] for field in required_fields), profile["id"])

    def test_design_risk_catalog_covers_runtime_hazards(self):
        patterns = {item["id"]: item for item in self.data["deployment"]["risk_patterns"]}
        expected = {f"DPR-{number:03d}" for number in range(1, 9)}
        self.assertTrue(expected.issubset(patterns))
        for pattern_id in expected:
            pattern = patterns[pattern_id]
            for field in ("design_questions", "failure_modes", "candidate_controls", "verification"):
                self.assertTrue(pattern[field], f"{pattern_id}.{field}")

    def test_passed_test_requires_structured_evidence(self):
        changed = copy.deepcopy(self.data)
        changed["tests"]["test_cases"][0]["evidence"] = []
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("TC-001 passed without structured evidence" in item for item in errors))

    def test_failed_test_keeps_matching_failure_evidence(self):
        test = next(item for item in self.data["tests"]["test_cases"] if item["id"] == "TC-020")
        evidence = next(item for item in self.data["evidence"]["evidence"] if item["id"] == "EVD-018")
        self.assertEqual("failed", test["status"])
        self.assertEqual("failed", evidence["status"])
        self.assertIn("EVD-018", test["evidence"])

    def test_approved_gate_requires_evidence_and_approval(self):
        changed = copy.deepcopy(self.data)
        gate_run = changed["gate_runs"]["gate_runs"][0]
        gate_run["status"] = "approved"
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("GTR-001 is approved without evaluation, commit, or approval" in item for item in errors))
        self.assertTrue(any("GTR-001 is approved with incomplete criteria" in item for item in errors))

    def test_release_is_blocked_by_unapproved_required_gate(self):
        changed = copy.deepcopy(self.data)
        for item in changed["changes"]["changes"]:
            if item["id"] == "CHG-004":
                item["status"] = "done"
        blockers = AIDD.release_blockers(changed, changed["releases"]["releases"][0])
        self.assertIn("CHG-004의 TG-002가 승인되지 않았습니다", blockers)

    def test_unknown_open_item_link_is_rejected(self):
        changed = copy.deepcopy(self.data)
        changed["open_items"]["open_items"][0]["links"] = ["REQ-999"]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("OI-001 references unknown linked item REQ-999" in item for item in errors))

    def test_unknown_deliverable_source_is_rejected(self):
        changed = copy.deepcopy(self.data)
        changed["deliverables"]["deliverables"][0]["source"] = ["missing.json"]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("DLV-BRIEF references unknown canonical source missing.json" in item for item in errors))

    def test_unknown_merge_module_is_rejected(self):
        changed = copy.deepcopy(self.data)
        changed["merges"]["merges"] = [{
            "id": "MRG-001", "commit": "a", "parents": ["b", "c"], "changed_files": [],
            "affected_modules": ["MOD-999"], "conflict_resolution_notes": "검토함",
            "additional_testing": "불필요", "status": "assessed",
        }]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("MRG-001 references unknown affected module MOD-999" in item for item in errors))

    def test_post_merge_argument_is_accepted(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools" / "aidd.py"), "record-merge", "0"],
            cwd=ROOT, capture_output=True, text=True, check=False,
        )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("not a merge commit", result.stdout)

    def test_project_init_creates_git_and_hooks_without_a_commit(self):
        with tempfile.TemporaryDirectory() as directory:
            temp_root = Path(directory)
            (temp_root / "tools").mkdir()
            (temp_root / ".githooks").mkdir()
            shutil.copy2(ROOT / "tools" / "aidd.py", temp_root / "tools" / "aidd.py")
            shutil.copy2(ROOT / ".githooks" / "post-merge", temp_root / ".githooks" / "post-merge")
            shutil.copy2(ROOT / ".githooks" / "pre-commit", temp_root / ".githooks" / "pre-commit")
            (temp_root / "README.md").write_text("기준선 전 파일\n", encoding="utf-8")

            result = subprocess.run(
                [sys.executable, str(temp_root / "tools" / "aidd.py"), "project-init"],
                cwd=temp_root, capture_output=True, text=True, encoding="utf-8", check=False,
            )
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertIn("자동 스테이징하거나 커밋하지 않았고", result.stdout)
            self.assertTrue((temp_root / ".git").is_dir())
            self.assertEqual(".githooks", subprocess.run(
                ["git", "config", "--get", "core.hooksPath"], cwd=temp_root, capture_output=True,
                text=True, encoding="utf-8", check=True,
            ).stdout.strip())
            self.assertEqual(0, subprocess.run(
                ["git", "diff", "--cached", "--quiet"], cwd=temp_root, capture_output=True,
                text=True, encoding="utf-8", check=False,
            ).returncode)
            self.assertNotEqual("", subprocess.run(
                ["git", "status", "--porcelain"], cwd=temp_root, capture_output=True,
                text=True, encoding="utf-8", check=True,
            ).stdout.strip())
            self.assertNotEqual(0, subprocess.run(
                ["git", "rev-parse", "HEAD"], cwd=temp_root, capture_output=True,
                text=True, encoding="utf-8", check=False,
            ).returncode)

    def test_merge_commit_creates_assessment_record(self):
        with tempfile.TemporaryDirectory() as directory:
            temp_root = Path(directory)
            (temp_root / "tools").mkdir()
            (temp_root / ".aidd" / "ssot").mkdir(parents=True)
            shutil.copy2(ROOT / "tools" / "aidd.py", temp_root / "tools" / "aidd.py")
            (temp_root / ".aidd" / "ssot" / "merges.json").write_text(
                '{"schema_version": 1, "merges": []}\n', encoding="utf-8",
            )
            (temp_root / ".aidd" / "ssot" / "modules.json").write_text(
                '{"schema_version": 1, "modules": [{"id": "MOD-CHG"}]}\n', encoding="utf-8",
            )

            def git(*args):
                return subprocess.run(
                    ["git", *args], cwd=temp_root, capture_output=True, text=True,
                    encoding="utf-8", errors="replace", check=True,
                )

            git("init", "-b", "main")
            git("config", "user.name", "AIDD Test")
            git("config", "user.email", "aidd@example.invalid")
            (temp_root / "base.txt").write_text("기준\n", encoding="utf-8")
            git("add", ".")
            git("commit", "-m", "기준")
            git("checkout", "-b", "feature")
            (temp_root / "feature.txt").write_text("기능\n", encoding="utf-8")
            git("add", "feature.txt")
            git("commit", "-m", "기능")
            git("checkout", "main")
            (temp_root / "main.txt").write_text("메인\n", encoding="utf-8")
            git("add", "main.txt")
            git("commit", "-m", "메인")
            git("merge", "--no-ff", "feature", "-m", "병합")

            result = subprocess.run(
                [sys.executable, str(temp_root / "tools" / "aidd.py"), "record-merge", "0"],
                cwd=temp_root, capture_output=True, text=True, check=False,
            )
            self.assertEqual(0, result.returncode, result.stderr)
            payload = json.loads((temp_root / ".aidd" / "ssot" / "merges.json").read_text(encoding="utf-8"))
            self.assertEqual(1, len(payload["merges"]))
            record = payload["merges"][0]
            self.assertEqual("needs_assessment", record["status"])
            self.assertEqual(2, len(record["parents"]))
            self.assertIn("feature.txt", record["changed_files"])
            self.assertEqual("pending", record["additional_testing"])

            assessment = subprocess.run(
                [
                    sys.executable, str(temp_root / "tools" / "aidd.py"), "assess-merge",
                    "--merge", record["id"], "--modules", "MOD-CHG", "--notes", "양쪽 변경 상호작용 검토",
                    "--additional-testing", "MOD-CHG 회귀 테스트 필요",
                ],
                cwd=temp_root, capture_output=True, text=True, check=False,
            )
            self.assertEqual(0, assessment.returncode, assessment.stderr)
            assessed = json.loads((temp_root / ".aidd" / "ssot" / "merges.json").read_text(encoding="utf-8"))["merges"][0]
            self.assertEqual("assessed", assessed["status"])
            self.assertEqual(["MOD-CHG"], assessed["affected_modules"])
            self.assertEqual("MOD-CHG 회귀 테스트 필요", assessed["additional_testing"])

    def test_github_workflow_runs_deterministic_checks(self):
        workflow = (ROOT / ".github" / "workflows" / "aidd.yml").read_text(encoding="utf-8")
        for command in (
            "python tools/aidd.py generate", "python tools/aidd.py sync-ai",
            "git diff --exit-code", "python tools/aidd.py validate",
            "python tools/aidd.py identity-check --warning-only", "python -m unittest discover -s tests -v",
        ):
            self.assertIn(command, workflow)
        self.assertIn("fetch-depth: 0", workflow)

    def test_module_delivery_plan_is_traceable_and_visible(self):
        plan = self.data["delivery_plan"]
        self.assertTrue(plan["milestones"])
        self.assertTrue(plan["work_items"])
        self.assertTrue(plan["interfaces"])
        self.assertTrue(plan["dependencies"])
        text = AIDD.status_text(self.data, "module", "MOD-AI")
        self.assertIn("WRK-006", text)
        self.assertIn("IFC-002", text)
        self.assertIn("DPN-003", text)
        self.assertIn("모듈 의존성", text)

    def test_decision_supersession_accepts_history_and_rejects_cycles(self):
        changed = copy.deepcopy(self.data)
        changed["decisions"]["decisions"].append({
            "id": "ADR-099", "title": "합성 대체 결정", "status": "accepted", "date": "2026-09-18",
            "context": "기존 전제가 바뀌었다.", "options": ["유지", "대체"], "decision": "대체한다.",
            "consequences": ["이력을 보존한다."], "rollback": "이전 결정을 재평가한다.",
            "supersedes": "ADR-003", "requirements": ["REQ-006"],
        })
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertFalse(any("ADR-099" in item for item in errors), errors)
        changed["decisions"]["decisions"][-1]["supersedes"] = "ADR-099"
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("supersession cycle" in item for item in errors))

    def test_development_check_blocks_until_required_gates_are_approved(self):
        changed = copy.deepcopy(self.data)
        change = next(item for item in changed["changes"]["changes"] if item["id"] == "CHG-001")
        blockers = AIDD.development_blockers(changed, change)
        self.assertEqual(3, len(blockers))
        for run in changed["gate_runs"]["gate_runs"]:
            if run["change"] == "CHG-001":
                run["status"] = "approved"
        self.assertEqual([], AIDD.development_blockers(changed, change))

    def test_guides_are_generated_from_structured_records(self):
        documents = AIDD.render_documents(self.data)
        for filename, heading in (
            ("operator-guide.md", "AIDD 운영자 가이드와 런북"),
            ("user-manual.md", "AIDD 사용자 매뉴얼"),
            ("security-guide.md", "AIDD 보안 모델과 검증 가이드"),
        ):
            self.assertIn(filename, documents)
            self.assertIn(heading, documents[filename])

    def test_cross_agent_evaluation_harness_keeps_live_runs_pending(self):
        evaluation = self.data["evaluations"]
        self.assertEqual({"codex", "claude"}, set(evaluation["policy"]["platforms"]))
        self.assertEqual([], evaluation["runs"])
        coverage = AIDD.evaluation_coverage(self.data)
        self.assertEqual(len(evaluation["scenarios"]) * 2, len(coverage))
        self.assertTrue(all(row[3] == "미실행" for row in coverage))
        prompt = AIDD.evaluation_prompt(self.data, "EVS-001")
        self.assertIn("모호한 신규 서비스 요청", prompt)
        self.assertIn("기대 행동", prompt)
        self.assertIn("금지 행동", prompt)

    def test_passed_agent_evaluation_rejects_critical_violation(self):
        changed = copy.deepcopy(self.data)
        scenario = changed["evaluations"]["scenarios"][0]
        changed["evaluations"]["runs"] = [{
            "id": "EVR-001", "scenario": scenario["id"], "platform": "codex", "status": "passed",
            "rubric_results": [{"criterion": item, "score": 2} for item in scenario["rubric"]],
            "critical_violations": ["승인되지 않은 요구사항 확정"], "summary": "합성 결과",
            "evidence": "EVD-016", "executed_at": "2026-09-18T01:25:44+09:00",
        }]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("EVR-001 passed with critical violations" in item for item in errors))

    def test_unknown_work_dependency_is_rejected(self):
        changed = copy.deepcopy(self.data)
        changed["delivery_plan"]["work_items"][0]["depends_on"] = ["WRK-999"]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("WRK-001 references unknown work dependency WRK-999" in item for item in errors))

    def test_repository_ruleset_matches_required_ci_check(self):
        repository = self.data["repository"]
        ruleset = json.loads((ROOT / repository["ruleset"]).read_text(encoding="utf-8"))
        contexts = {
            check["context"]
            for rule in ruleset["rules"] if rule["type"] == "required_status_checks"
            for check in rule["parameters"]["required_status_checks"]
        }
        self.assertEqual(set(repository["required_checks"]), contexts)
        pull_request = next(rule for rule in ruleset["rules"] if rule["type"] == "pull_request")
        self.assertTrue(pull_request["parameters"]["allowed_merge_methods"])
        self.assertEqual(0, pull_request["parameters"]["required_approving_review_count"])
        self.assertFalse(pull_request["parameters"]["require_last_push_approval"])
        self.assertEqual("blocked", repository["status"])
        self.assertEqual("failed", repository["remote_verification"]["status"])

    def test_collaboration_profiles_switch_solo_team_and_back(self):
        changed = copy.deepcopy(self.data)
        self.assertEqual("CBP-SOLO", AIDD.selected_collaboration_profile_id(changed))
        solo_rules = AIDD.build_github_ruleset(changed)
        solo_pr = next(rule for rule in solo_rules["rules"] if rule["type"] == "pull_request")
        self.assertEqual(0, solo_pr["parameters"]["required_approving_review_count"])

        selected = AIDD.apply_collaboration_member(
            changed["collaboration"], "HUM-002", "팀원", ["개발자"], "active",
            "팀원이 합류했다.", "프로젝트 책임자", "2026-09-18T02:00:00+09:00",
        )
        self.assertEqual("CBP-TEAM", selected)
        self.assertEqual("CBP-TEAM", AIDD.selected_collaboration_profile_id(changed))
        self.assertEqual("CBP-SOLO", changed["collaboration"]["transitions"][-1]["from"])
        self.assertEqual("CBP-TEAM", changed["collaboration"]["transitions"][-1]["to"])
        team_rules = AIDD.build_github_ruleset(changed)
        team_pr = next(rule for rule in team_rules["rules"] if rule["type"] == "pull_request")
        self.assertEqual(1, team_pr["parameters"]["required_approving_review_count"])
        self.assertTrue(team_pr["parameters"]["require_last_push_approval"])

        selected = AIDD.apply_collaboration_member(
            changed["collaboration"], "HUM-002", None, [], "inactive",
            "팀원이 프로젝트에서 이탈했다.", "프로젝트 책임자", "2026-09-19T09:00:00+09:00",
        )
        self.assertEqual("CBP-SOLO", selected)
        self.assertEqual("CBP-SOLO", AIDD.selected_collaboration_profile_id(changed))
        self.assertEqual("CBP-TEAM", changed["collaboration"]["transitions"][-1]["from"])
        self.assertEqual("CBP-SOLO", changed["collaboration"]["transitions"][-1]["to"])
        self.assertEqual("2026-09-19T09:00:00+09:00", changed["collaboration"]["participants"][-1]["left_at"])

    def test_team_branch_policy_blocks_main_but_allows_a_working_branch(self):
        changed = copy.deepcopy(self.data)
        AIDD.apply_collaboration_member(
            changed["collaboration"], "HUM-002", "팀원", ["개발자"], "active",
            "팀원이 합류했다.", "프로젝트 책임자", "2026-09-18T02:00:00+09:00",
        )
        change = next(item for item in changed["changes"]["changes"] if item["id"] == "CHG-008")
        main_blockers = AIDD.branch_policy_blockers(changed, change, branch="main", repository_root=ROOT)
        self.assertTrue(any("직접 커밋할 수 없습니다" in item for item in main_blockers))
        self.assertEqual([], AIDD.branch_policy_blockers(
            changed, change, branch="feature/CHG-008-identity", repository_root=ROOT,
        ))
        self.assertEqual([], AIDD.branch_policy_blockers(
            self.data, change, branch="main", repository_root=ROOT,
        ))

    def test_collaboration_profile_mismatch_is_rejected(self):
        changed = copy.deepcopy(self.data)
        changed["collaboration"]["policy"]["current_profile"] = "CBP-TEAM"
        changed["collaboration"]["transitions"][-1]["to"] = "CBP-TEAM"
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("does not match active participants" in item for item in errors))

    def test_collaboration_rejects_removing_the_final_owner_atomically(self):
        collaboration = copy.deepcopy(self.data["collaboration"])
        before = copy.deepcopy(collaboration)
        with self.assertRaisesRegex(ValueError, "최소 1명"):
            AIDD.apply_collaboration_member(
                collaboration, "HUM-001", None, [], "inactive",
                "마지막 책임자 이탈", "프로젝트 책임자", "2026-09-20T09:00:00+09:00",
            )
        self.assertEqual(before, collaboration)

        changed = copy.deepcopy(self.data)
        changed["collaboration"]["participants"][0]["roles"] = ["개발자"]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertIn("collaboration has no active owner", errors)

    def test_git_identity_audit_recognizes_baseline_and_flags_unknown(self):
        registered, unknown = AIDD.audit_git_identities(self.data)
        self.assertEqual([], unknown)
        self.assertTrue(any(item["mapping"] == "IDM-001" and item["participant"] == "HUM-001" for item in registered))

        synthetic = [{"name": "미등록 사용자", "email": "unknown@example.invalid", "roles": ["author"]}]
        registered, unknown = AIDD.audit_git_identities(self.data, synthetic)
        self.assertEqual([], registered)
        self.assertEqual("미등록 사용자", unknown[0]["name"])

    def test_unregistered_git_identity_blocks_high_risk_work_and_release(self):
        changed = copy.deepcopy(self.data)
        changed["collaboration"]["identity_mappings"] = []
        change = next(item for item in changed["changes"]["changes"] if item["id"] == "CHG-008")
        self.assertTrue(any("미등록 Git 신원" in item for item in AIDD.development_blockers(changed, change)))
        release = changed["releases"]["releases"][0]
        self.assertTrue(any("미등록 Git 신원" in item for item in AIDD.release_blockers(changed, release)))
        errors, warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertFalse(any("C2 or C3 change is complete" in item for item in errors))
        self.assertTrue(any("미등록 Git 신원" in item for item in warnings))

    def test_bot_identity_mapping_does_not_change_human_profile(self):
        payload = copy.deepcopy(self.data["collaboration"])
        AIDD.apply_collaboration_identity(
            payload, "IDM-002", "bot", None, "AIDD Bot", "bot@example.invalid", ["aidd-bot"],
            "CI 서비스 계정", "프로젝트 책임자", "2026-09-18T02:00:00+09:00",
        )
        changed = copy.deepcopy(self.data)
        changed["collaboration"] = payload
        self.assertEqual("CBP-SOLO", AIDD.selected_collaboration_profile_id(changed))
        registered, unknown = AIDD.audit_git_identities(
            changed, [{"name": "AIDD Bot", "email": "bot@example.invalid", "roles": ["committer"]}],
        )
        self.assertEqual([], unknown)
        self.assertEqual("bot", registered[0]["principal_type"])
        self.assertIsNone(registered[0]["participant"])

    def test_identity_mapping_rejects_duplicate_alias_atomically(self):
        payload = copy.deepcopy(self.data["collaboration"])
        before = copy.deepcopy(payload)
        with self.assertRaisesRegex(ValueError, "이미 IDM-001"):
            AIDD.apply_collaboration_identity(
                payload, "IDM-002", "bot", None, "joobok", "bbundoli@naver.com", [],
                "중복 매핑 시도", "프로젝트 책임자", "2026-09-18T02:00:00+09:00",
            )
        self.assertEqual(before, payload)

    def test_inactive_participant_identity_flags_post_departure_commit(self):
        payload = copy.deepcopy(self.data["collaboration"])
        AIDD.apply_collaboration_member(
            payload, "HUM-002", "이탈 팀원", ["개발자"], "active",
            "팀원 합류", "프로젝트 책임자", "2026-09-18T02:00:00+09:00",
        )
        AIDD.apply_collaboration_identity(
            payload, "IDM-002", "human", "HUM-002", "Former Dev", "former@example.invalid", [],
            "팀원 신원", "프로젝트 책임자", "2026-09-18T02:01:00+09:00",
        )
        AIDD.apply_collaboration_member(
            payload, "HUM-002", None, [], "inactive",
            "팀원 이탈", "프로젝트 책임자", "2026-09-18T03:00:00+09:00",
        )
        changed = copy.deepcopy(self.data)
        changed["collaboration"] = payload
        registered, unresolved = AIDD.audit_git_identities(changed, [{
            "name": "Former Dev", "email": "former@example.invalid", "roles": ["author"],
            "latest_commit_at": "2026-09-18T04:00:00+09:00",
        }])
        self.assertEqual([], registered)
        self.assertEqual("inactive_participant_activity", unresolved[0]["issue"])
        self.assertIn("이탈 후 커밋", AIDD.identity_issue_text(unresolved[0]))

    def test_methodology_catalog_covers_traditional_and_ai_methods(self):
        methods = self.data["methodologies"]["methods"]
        categories = {item["category"] for item in methods}
        self.assertIn("전통적 프로젝트 관리", categories)
        self.assertIn("전통적 시스템공학", categories)
        self.assertIn("AI 주도 명세 개발", categories)
        for method in methods:
            self.assertTrue(method["adopted_controls"], method["id"])
            self.assertTrue(method["aidd_mapping"], method["id"])
            self.assertTrue(method["sources"], method["id"])
        known_methods = {item["id"] for item in methods}
        profile = self.data["methodologies"]["profiles"][0]
        self.assertTrue(set(profile["selected_methods"]).issubset(known_methods))
        self.assertTrue(profile["mandatory_controls"])


if __name__ == "__main__":
    unittest.main()
