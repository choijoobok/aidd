import copy
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("aidd", ROOT / ".ai" / "tools" / "aidd.py")
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

    def test_project_workspace_separates_product_records_documents_and_source(self):
        self.assertEqual(ROOT / "project", AIDD.PROJECT)
        self.assertEqual(ROOT / "project" / ".aidd" / "ssot", AIDD.SSOT)
        self.assertEqual(ROOT / "project" / "docs" / "generated", AIDD.GENERATED)
        self.assertEqual(ROOT / ".ai" / "templates" / "project-skeleton", AIDD.PROJECT_SKELETON)
        self.assertTrue((ROOT / "project" / "README.md").is_file())
        self.assertTrue((ROOT / "project" / "src" / "README.md").is_file())

    def test_project_home_site_is_generated_from_the_project_introduction(self):
        home = AIDD.render_documents(self.data)["site/index.html"]
        self.assertIn(self.data["project"]["introduction"], home)
        self.assertIn(self.data["project"]["intent"], home)
        self.assertIn('class="brand" href="index.html"', home)
        self.assertIn("생성 문서", home)

    def test_document_portals_have_tree_search_and_offline_assets(self):
        documents = AIDD.render_documents(self.data)
        self.assertIn("site/design/index.html", documents)
        self.assertIn("site/user/index.html", documents)
        self.assertIn("site/operations/index.html", documents)
        self.assertIn("data-tree-filter", documents["site/design/index.html"])
        self.assertIn("data-page-link", documents["site/user/index.html"])
        self.assertIn('href="../index.html"', documents["site/operations/index.html"])
        for asset in ("guide.css", "delivery.css", "delivery.js", "icons.js"):
            self.assertIn(f"site/assets/{asset}", documents)
        self.assertIn("본문 검색", documents["site/index.html"])

    def test_documentation_contract_is_rendered_and_retrospectively_applied(self):
        documents = AIDD.render_documents(self.data)
        standard = documents["foundation/documentation-standard.md"]
        requirements = documents["requirements.md"]
        self.assertIn("프로젝트 문서 포맷 기준", standard)
        self.assertIn("DOC-REQ", standard)
        self.assertIn("기능 요건 정의서 공통 항목", requirements)
        self.assertIn(self.data["project"]["introduction"], requirements)
        report = AIDD.document_impact_text(self.data, ["project/src/example.py"])
        self.assertIn("문서 현행화 영향 후보", report)
        self.assertIn("기능 요건 → 화면 요건 → 사용자 매뉴얼", report)

    def _documentation_gate_fixture(self, documentation_status="current", action="update_now"):
        changed = copy.deepcopy(self.data)
        surface = {
            "id": "SURF-TEST-001", "module": "MOD-DOC", "type": "api", "key": "GET /example",
            "title": "예시 API", "source_patterns": ["project/src/api/**"],
            "documentation_status": documentation_status,
            "documentation_sources": ["project/.aidd/ssot/modules/MOD-DOC.json"],
        }
        changed["system_surfaces"]["surfaces"].append(surface)
        change = next(item for item in changed["changes"]["changes"] if item["id"] == "CHG-013")
        change["delivery_path"] = {
            "kind": "existing_change", "analysis": "complete", "design": "complete",
            "documentation": action, "surfaces": [surface["id"]], "documentation_work": [],
            "decided_by": "고객", "reason": "기존 API 변경",
        }
        return changed, change

    def test_new_capability_requires_analysis_design_and_documented_surfaces(self):
        changed, change = self._documentation_gate_fixture(documentation_status="undocumented", action="deferred")
        change["delivery_path"]["kind"] = "new_capability"
        change["delivery_path"]["analysis"] = "not_applicable"
        change["delivery_path"]["design"] = "not_applicable"
        blockers = AIDD.delivery_path_blockers(changed, change)
        self.assertTrue(any("신규 기능은 요구분석" in item for item in blockers))
        self.assertTrue(any("신규 기능은 설계" in item for item in blockers))
        self.assertTrue(any("나중으로 미룰 수 없습니다" in item for item in blockers))
        self.assertTrue(any("최신 상태가 아닙니다" in item for item in blockers))

    def test_existing_documented_surface_requires_staged_document_update(self):
        changed, _change = self._documentation_gate_fixture()
        _report, blockers = AIDD.documentation_commit_check(changed, ["project/src/api/orders.py"])
        self.assertTrue(any("staged 변경에 포함되지 않았습니다" in item for item in blockers))
        _report, blockers = AIDD.documentation_commit_check(changed, [
            "project/src/api/orders.py", "project/.aidd/ssot/modules/MOD-DOC.json",
        ])
        self.assertEqual([], blockers)

    def test_undocumented_existing_surface_can_defer_only_with_dated_work(self):
        changed, change = self._documentation_gate_fixture(documentation_status="undocumented", action="deferred")
        blockers = AIDD.delivery_path_blockers(changed, change)
        self.assertTrue(any("연결된 WRK가 없습니다" in item for item in blockers))
        work = {
            "id": "WRK-999", "title": "예시 API 문서화", "type": "documentation-reconciliation",
            "status": "todo", "module": "MOD-DOC", "change": "CHG-013", "requirements": ["REQ-035"],
            "depends_on": [], "owner": "문서화", "surfaces": ["SURF-TEST-001"],
            "target_docs": ["DOC-REQ"], "due_milestone": "MLS-001",
            "acceptance_criteria": ["API 계약을 정본화한다"], "evidence": [],
        }
        changed["delivery_plan"]["work_items"].append(work)
        change["delivery_path"]["documentation_work"] = ["WRK-999"]
        self.assertEqual([], AIDD.delivery_path_blockers(changed, change))
        _report, blockers = AIDD.documentation_commit_check(changed, ["project/src/api/orders.py"])
        self.assertEqual([], blockers)

    def test_legacy_source_needs_surface_or_active_inventory_plan(self):
        changed = copy.deepcopy(self.data)
        _report, blockers = AIDD.documentation_commit_check(changed, ["project/src/legacy/order.py"])
        self.assertTrue(any("레거시 문서화 계획" in item for item in blockers))
        changed["delivery_plan"]["work_items"].append({
            "id": "WRK-998", "type": "documentation-reconciliation", "status": "todo",
            "target_docs": ["DOC-LEG"], "due_milestone": "MLS-001",
        })
        changed["system_surfaces"]["legacy_plans"].append({
            "id": "LDP-999", "status": "in_progress", "source_roots": ["project/src/legacy"],
            "work_items": ["WRK-998"],
        })
        _report, blockers = AIDD.documentation_commit_check(changed, ["project/src/legacy/order.py"])
        self.assertEqual([], blockers)

    def test_system_surfaces_are_module_sharded_and_rendered(self):
        fragments = self.data["system_surfaces"].get("_module_fragments", [])
        self.assertEqual(
            {item["id"] for item in self.data["modules"]["modules"]},
            {fragment["module"] for _path, fragment in fragments},
        )
        self.assertIn("시스템 표면과 문서 현행화", AIDD.render_documents(self.data)["system-surface-coverage.md"])

    def test_workboard_is_the_small_active_view_not_a_daily_history(self):
        documents = AIDD.render_documents(self.data)
        board = self.data["workboard"]
        self.assertEqual("WB-001", board["id"])
        self.assertIn("현재 작업 보드", documents["workboard.md"])
        self.assertIn("project/work-log/YYYY-MM/YYYY-MM-DD/HUM-001.md", documents["workboard.md"])

    def test_work_log_actor_uses_verified_active_participant_not_raw_git_name(self):
        with mock.patch.object(AIDD, "git", side_effect=lambda *args: {
            ("config", "--get", "user.name"): "joobok",
            ("config", "--get", "user.email"): "bbundoli@naver.com",
        }[args]):
            actor = AIDD.configured_work_log_actor(self.data)
        self.assertEqual("HUM-001", actor["id"])
        self.assertEqual("IDM-001", actor["mapping"])
        self.assertEqual("bbundoli@naver.com", actor["git_email"])

    def test_work_log_rejects_unmapped_git_identity(self):
        with mock.patch.object(AIDD, "git", side_effect=lambda *args: {
            ("config", "--get", "user.name"): "Unknown",
            ("config", "--get", "user.email"): "unknown@example.invalid",
        }[args]):
            with self.assertRaisesRegex(ValueError, "매핑되지 않았습니다"):
                AIDD.configured_work_log_actor(self.data)

    def test_current_actor_reports_identity_without_claiming_work_ownership(self):
        with mock.patch.object(AIDD, "git", side_effect=lambda *args: {
            ("config", "--get", "user.name"): "joobok",
            ("config", "--get", "user.email"): "joobok.choi@mobyus.com",
        }[args]):
            report = AIDD.current_actor_text(self.data)
        self.assertIn("HUM-001", report)
        self.assertIn("joobok.choi@mobyus.com", report)
        self.assertIn("점유·잠금·자동 pull 검사는 사용하지 않는다", report)

    def test_workload_coverage_requires_every_change_requirement_and_delivery_area(self):
        report, blockers = AIDD.workload_coverage_text(self.data, "CHG-011")
        self.assertEqual([], blockers)
        self.assertIn("배분 가능", report)
        self.assertIn("design, implementation, test, documentation, migration, operations, training", report)

        incomplete = copy.deepcopy(self.data)
        work = next(item for item in incomplete["delivery_plan"]["work_items"] if item["id"] == "WRK-012")
        work["requirements"].remove("REQ-025")
        work["coverage"].remove("documentation")
        report, blockers = AIDD.workload_coverage_text(incomplete, "CHG-011")
        self.assertIn("REQ-025", report)
        self.assertTrue(any("필요한 작업 영역" in item for item in blockers))

    def test_team_self_assignment_allows_only_the_current_participant(self):
        team = copy.deepcopy(self.data)
        team["collaboration"]["policy"]["current_profile"] = "CBP-TEAM"
        team["collaboration"]["work_assignment_policy"]["mode"] = "self_assignment"
        self.assertIsNone(AIDD.may_allocate_work(team, "HUM-001", "HUM-001"))
        self.assertIn("자신에게만", AIDD.may_allocate_work(team, "HUM-001", "HUM-002"))

    def test_team_transition_requires_an_active_pm(self):
        collaboration = copy.deepcopy(self.data["collaboration"])
        with self.assertRaisesRegex(ValueError, "PM 역할"):
            AIDD.apply_collaboration_member(
                collaboration, "HUM-002", "개발자 2", ["개발자"], "active",
                "팀 합류", "프로젝트 책임자", "2026-09-18T18:00:00+09:00",
            )
        AIDD.apply_collaboration_member(
            collaboration, "HUM-001", None, ["고객", "소유자", "개발자", "PM"], "active",
            "팀 전환 전 PM 지정", "프로젝트 책임자", "2026-09-18T18:00:01+09:00",
        )
        profile = AIDD.apply_collaboration_member(
            collaboration, "HUM-002", "개발자 2", ["개발자"], "active",
            "팀 합류", "프로젝트 책임자", "2026-09-18T18:00:02+09:00",
        )
        self.assertEqual("CBP-TEAM", profile)

    def test_offline_coordination_is_only_valid_for_self_assignment(self):
        changed = copy.deepcopy(self.data)
        changed["collaboration"]["work_assignment_policy"]["offline_coordination_required"] = True
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertIn("offline coordination must only be required for self-assignment", errors)
        changed["collaboration"]["work_assignment_policy"]["mode"] = "self_assignment"
        changed["collaboration"]["work_assignment_policy"]["offline_coordination_required"] = False
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertIn("self-assignment must require offline coordination", errors)

    def test_assignment_audit_and_delivery_plan_coverage_are_visible(self):
        collaboration = AIDD.render_collaboration_governance(self.data)
        delivery = AIDD.render_delivery_plan(self.data)
        self.assertIn("APE-001", collaboration)
        self.assertIn("WAE-001", collaboration)
        self.assertIn("요구사항", delivery)
        self.assertIn("포괄 범위", delivery)
        self.assertIn("REQ-034", delivery)
        self.assertIn("design, implementation, test, documentation, migration, operations", delivery)

    def test_project_bootstrap_creates_a_safe_blank_product_workspace(self):
        with tempfile.TemporaryDirectory() as directory:
            temp_root = Path(directory)
            shutil.copytree(ROOT / ".ai" / "tools", temp_root / ".ai" / "tools")
            shutil.copytree(ROOT / ".ai" / "templates", temp_root / ".ai" / "templates")

            result = subprocess.run(
                [
                    sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "project-bootstrap",
                    "--project-id", "ERP-CORE", "--name", "기존 ERP", "--mode", "existing-system",
                    "--source-location", "D:/workspace/legacy-erp",
                ],
                cwd=temp_root, capture_output=True, text=True, encoding="utf-8", check=False,
            )
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertIn("자동으로 이동하거나 덮어쓰지 않았습니다", result.stdout)
            project_record = json.loads((temp_root / "project" / ".aidd" / "ssot" / "project.json").read_text(encoding="utf-8"))
            self.assertEqual("ERP-CORE", project_record["project_id"])
            self.assertEqual("bootstrap", project_record["phase"])
            self.assertEqual("D:/workspace/legacy-erp", project_record["existing_source"])
            self.assertTrue((temp_root / "project" / "src" / "README.md").is_file())
            self.assertTrue((temp_root / "project" / "docs" / "generated").is_dir())
            self.assertTrue((temp_root / "project" / ".aidd" / "schemas" / "artifact.schema.json").is_file())
            documentation = json.loads((temp_root / "project" / ".aidd" / "ssot" / "documentation.json").read_text(encoding="utf-8"))
            self.assertEqual("draft", documentation["policy"]["status"])
            workboard = json.loads((temp_root / "project" / ".aidd" / "ssot" / "workboard.json").read_text(encoding="utf-8"))
            self.assertEqual("WB-001", workboard["id"])

            validation = subprocess.run(
                [sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "validate"],
                cwd=temp_root, capture_output=True, text=True, encoding="utf-8", check=False,
            )
            self.assertEqual(0, validation.returncode, validation.stderr)
            self.assertIn("착수 상태", validation.stdout)

            status = subprocess.run(
                [sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "status", "--level", "executive"],
                cwd=temp_root, capture_output=True, text=True, encoding="utf-8", check=False,
            )
            self.assertEqual(0, status.returncode, status.stderr)
            self.assertIn("프로젝트 착수 대기 상태", status.stdout)

            duplicate = subprocess.run(
                [
                    sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "project-bootstrap",
                    "--project-id", "OTHER", "--name", "덮어쓰기 시도",
                ],
                cwd=temp_root, capture_output=True, text=True, encoding="utf-8", check=False,
            )
            self.assertEqual(2, duplicate.returncode)
            self.assertIn("덮어쓰지 않습니다", duplicate.stderr)

    def test_every_requirement_has_module_and_verification(self):
        for requirement in self.data["requirements"]["requirements"]:
            self.assertTrue(requirement["modules"], requirement["id"])
            self.assertTrue(requirement["verification"], requirement["id"])

    def test_module_status_view(self):
        text = AIDD.status_text(self.data, "module", "MOD-AI")
        self.assertIn("REQ-013", text)
        self.assertIn("AI 플랫폼 어댑터", text)

    def test_executive_status_groups_deferred_work(self):
        text = AIDD.status_text(self.data, "executive", include_runtime_identity=False)
        self.assertIn("미룬 결정과 재검토", text)
        self.assertIn("기한 미정", text)
        self.assertIn("OI-001", text)

    def test_impact_analysis_separates_direct_and_transitive_records(self):
        text = AIDD.impact_text(self.data, "REQ-012")
        self.assertIn("직접 영향 대상", text)
        self.assertIn("간접 영향 대상", text)
        self.assertIn("CHG-005", text)

    def test_requirements_are_stored_in_module_specification_fragments(self):
        fragments = self.data["requirements"].get("_module_fragments", [])
        self.assertEqual("module-sharded", self.data["requirements"].get("storage"))
        self.assertEqual([], self.data["requirements"].get("_root_requirements"))
        self.assertEqual(
            {item["id"] for item in self.data["modules"]["modules"]},
            {fragment["module"] for _path, fragment in fragments},
        )
        for path, fragment in fragments:
            self.assertEqual(fragment["module"], path.stem)
            for requirement in fragment["requirements"]:
                self.assertIn(fragment["module"], requirement["modules"])

    def test_module_documents_are_generated_for_each_module(self):
        documents = AIDD.render_documents(self.data)
        for module in self.data["modules"]["modules"]:
            filename = f"modules/{module['id']}.md"
            self.assertIn(filename, documents)
            self.assertIn(module["name"], documents[filename])
            self.assertIn("요구사항 상세", documents[filename])

    def test_new_module_creates_an_empty_fragment_without_changing_existing_modules(self):
        with tempfile.TemporaryDirectory() as directory:
            temp_ssot = Path(directory) / "ssot"
            shutil.copytree(ROOT / "project" / ".aidd" / "ssot", temp_ssot)
            original_ssot = AIDD.SSOT
            original_spec_dir = AIDD.MODULE_SPEC_DIR
            original_ui_spec_dir = AIDD.UI_MODULE_SPEC_DIR
            original_surface_spec_dir = AIDD.SYSTEM_SURFACE_SPEC_DIR
            try:
                AIDD.SSOT = temp_ssot
                AIDD.MODULE_SPEC_DIR = temp_ssot / "modules"
                AIDD.UI_MODULE_SPEC_DIR = temp_ssot / "ui-modules"
                AIDD.SYSTEM_SURFACE_SPEC_DIR = temp_ssot / "system-surfaces"
                message = AIDD.add_module(
                    "MOD-ORDERS", "주문", "주문 수명주기를 관리한다.", ["MOD-GOV"], "planned", True,
                )
                self.assertIn("MOD-ORDERS", message)
                loaded = AIDD.load_records()
                module = next(item for item in loaded["modules"]["modules"] if item["id"] == "MOD-ORDERS")
                self.assertEqual("planned", module["status"])
                fragment = json.loads((temp_ssot / "modules" / "MOD-ORDERS.json").read_text(encoding="utf-8"))
                self.assertEqual([], fragment["requirements"])
                ui_fragment = json.loads((temp_ssot / "ui-modules" / "MOD-ORDERS.json").read_text(encoding="utf-8"))
                self.assertEqual({"screens": [], "manuals": []}, {
                    "screens": ui_fragment["screens"], "manuals": ui_fragment["manuals"],
                })
                surface_fragment = json.loads((temp_ssot / "system-surfaces" / "MOD-ORDERS.json").read_text(encoding="utf-8"))
                self.assertEqual([], surface_fragment["surfaces"])
            finally:
                AIDD.SSOT = original_ssot
                AIDD.MODULE_SPEC_DIR = original_spec_dir
                AIDD.UI_MODULE_SPEC_DIR = original_ui_spec_dir
                AIDD.SYSTEM_SURFACE_SPEC_DIR = original_surface_spec_dir

    def test_development_foundation_records_and_views_are_structured(self):
        self.assertIn("STD-001", {item["id"] for item in self.data["foundation"]["standards"]})
        self.assertIn("GPH-001", {item["id"] for item in self.data["foundation"]["golden_paths"]})
        self.assertIn("UXB-001", {item["id"] for item in self.data["ui_system"]["baselines"]})
        self.assertIn("RUN-001", {item["id"] for item in self.data["operations"]["runbooks"]})
        self.assertEqual({"DLP-001", "DLP-002"}, {
            item["id"] for item in self.data["delivery_profiles"]["delivery_profiles"]
        })
        documents = AIDD.render_documents(self.data)
        for filename in (
            "foundation/development-standards.md", "foundation/golden-paths.md",
            "foundation/exceptions.md", "ui/baseline-and-patterns.md",
            "ui/component-registry.md", "operations/runbooks.md", "deliverables/manifest.md",
        ):
            self.assertIn(filename, documents)

    def test_foundation_validation_rejects_unknown_links_and_unsafe_delivery_policy(self):
        changed = copy.deepcopy(self.data)
        changed["foundation"]["standards"][0]["technology_baseline"] = "TSB-UNKNOWN"
        changed["foundation"]["exceptions"].append({
            "id": "EXC-TEST", "status": "approved", "standard": "STD-001", "scope": "합성 범위",
            "reason": "만료 검증", "owner": "테스트", "expires_at": "2020-01-01T00:00:00+09:00",
            "approval": "APR-UNKNOWN", "compensating_controls": ["수동 검토"],
        })
        changed["delivery_profiles"]["delivery_profiles"][1]["release_rules"]["allow_mockups"] = True
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("unknown technology baseline" in item for item in errors), errors)
        self.assertTrue(any("has expired but is still active" in item for item in errors), errors)
        self.assertTrue(any("cannot allow mockups" in item for item in errors), errors)

    def test_exception_and_gate_exception_require_valid_unexpired_approval(self):
        changed = copy.deepcopy(self.data)
        changed["approvals"]["approvals"].extend([
            {
                "id": "APR-EXC-REJECTED", "subject_type": "standard-exception", "subject": "REQ-001",
                "decision": "rejected", "approver": "검토자", "role": "고객", "decided_at": "2026-09-18T00:00:00+09:00",
                "comment": "거절",
            },
            {
                "id": "APR-GATE-TEST", "subject_type": "gate-run", "subject": "GTR-001",
                "decision": "approved", "approver": "검토자", "role": "고객", "decided_at": "2026-09-18T00:00:00+09:00",
                "comment": "예외 승인",
            },
        ])
        changed["foundation"]["exceptions"].append({
            "id": "EXC-REJECTED", "status": "approved", "standard": "STD-001", "scope": "합성 범위",
            "reason": "승인 대조", "owner": "테스트", "expires_at": "2099-01-01T00:00:00+09:00",
            "approval": "APR-EXC-REJECTED", "compensating_controls": ["수동 검토"],
        })
        changed["foundation"]["exceptions"].append({
            "id": "EXC-DRAFT", "status": "draft", "standard": "STD-001", "scope": "합성 범위",
            "reason": "아직 검토 중", "owner": "테스트", "expires_at": "2099-01-01T00:00:00+09:00",
            "approval": None, "compensating_controls": ["수동 검토"],
        })
        changed["gate_runs"]["gate_runs"][0]["exceptions"] = [{
            "id": "GEX-TEST", "owner": "테스트", "expires": "2020-01-01T00:00:00+09:00",
            "compensating_control": "수동 검토", "approved_by": "APR-GATE-TEST",
        }]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("EXC-REJECTED references an approval" in item for item in errors), errors)
        self.assertTrue(any("expired gate exception GEX-TEST" in item for item in errors), errors)
        self.assertFalse(any("EXC-DRAFT references an approval" in item for item in errors), errors)

    def test_release_profile_requires_actual_capture_evidence(self):
        changed = copy.deepcopy(self.data)
        changed["ui_modules"]["screens"].append({"id": "SCR-REL", "status": "verified"})
        release = copy.deepcopy(changed["releases"]["releases"][0])
        release["delivery_profile"] = "DLP-002"
        release["screens"] = ["SCR-REL"]
        release["manuals"] = []
        blockers = AIDD.release_blockers(changed, release, include_runtime_identity=False)
        self.assertTrue(any("실제 화면 캡처 증거" in item for item in blockers), blockers)
        changed["evidence"]["evidence"].append({
            "id": "EVD-FAKE-CAPTURE", "type": "ui-capture", "status": "passed", "capture_kind": "actual",
            "screens": ["SCR-REL"], "environment": "production", "commit": "a" * 40,
            "artifacts": ["README.md"], "artifact_hashes": {"README.md": "b" * 64},
        })
        blockers = AIDD.release_blockers(changed, release, include_runtime_identity=False)
        self.assertTrue(any("실제 화면 캡처 증거" in item for item in blockers), blockers)

    def test_actual_capture_hash_must_match_file_content(self):
        artifact = ROOT / ".ai" / "tests" / "fixtures" / "hooks" / "__capture-test__.png"
        artifact.write_bytes(b"synthetic-capture-bytes")
        relative = artifact.relative_to(ROOT).as_posix()
        capture = {
            "type": "ui-capture", "status": "passed", "capture_kind": "actual", "screens": ["SCR-TEST"],
            "environment": "test", "commit": "a" * 40, "artifacts": [relative],
            "artifact_hashes": {relative: "0" * 64},
        }
        try:
            self.assertFalse(AIDD.is_verified_actual_capture(capture, "SCR-TEST"))
            capture["artifact_hashes"][relative] = AIDD.sha256_file(artifact)
            self.assertTrue(AIDD.is_verified_actual_capture(capture, "SCR-TEST"))
        finally:
            artifact.unlink(missing_ok=True)

    def test_approved_ui_foundation_requires_subject_matched_approval(self):
        changed = copy.deepcopy(self.data)
        changed["ui_system"]["baselines"].append({
            "id": "UXB-APPROVED", "title": "승인 기준선", "status": "approved", "scope": "합성",
            "technology_baseline": "TSB-001", "reason": None, "approval": None,
        })
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("UXB-APPROVED is approved or later without a valid approval" in item for item in errors), errors)

    def test_validate_detects_obsolete_generated_ui_file(self):
        stale = AIDD.GENERATED / "ui" / "modules" / "__obsolete-test__.html"
        stale.parent.mkdir(parents=True, exist_ok=True)
        stale.write_text("obsolete", encoding="utf-8")
        try:
            errors, _warnings = AIDD.validate(self.data, check_adapters=False)
            self.assertTrue(any("obsolete generated document" in item and stale.name in item for item in errors), errors)
        finally:
            stale.unlink(missing_ok=True)

    def test_manual_must_reference_screen_in_same_ui_fragment(self):
        changed = copy.deepcopy(self.data)
        changed["ui_modules"] = {
            "fragments": [
                (AIDD.SSOT / "ui-modules" / "MOD-AI.json", {
                    "module": "MOD-AI", "screens": [],
                    "manuals": [{"id": "MAN-CROSS", "screen": "SCR-CROSS"}],
                }),
                (AIDD.SSOT / "ui-modules" / "MOD-ARCH.json", {
                    "module": "MOD-ARCH", "screens": [{"id": "SCR-CROSS", "module": "MOD-ARCH"}], "manuals": [],
                }),
            ],
            "screens": [{"id": "SCR-CROSS", "module": "MOD-ARCH"}],
            "manuals": [{"id": "MAN-CROSS", "screen": "SCR-CROSS"}],
        }
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("MAN-CROSS is stored in MOD-AI" in item for item in errors), errors)

    def test_ui_module_records_generate_screen_mockup_and_manual(self):
        changed = copy.deepcopy(self.data)
        changed["ui_system"]["baselines"].append({
            "id": "UXB-TEST", "title": "테스트 UI", "status": "draft", "scope": "합성 화면",
            "requirements": ["REQ-032"], "technology_baseline": "TSB-001", "tokens": [],
            "application_shell": "단일 화면", "navigation": "없음", "states": [],
            "accessibility": ["키보드 사용"], "responsive_rules": [], "reason": None,
            "owner": "테스트", "supersedes": None, "replaced_by": None,
        })
        changed["ui_system"]["components"].append({
            "id": "CMP-TEST", "title": "테스트 버튼", "status": "draft", "responsibility": "동작 실행",
            "contract": "disabled 상태를 지원한다.", "implementation_path": None,
            "standards": ["STD-001"], "tests": ["TC-025"], "modules": ["MOD-ARCH"],
            "requirements": ["REQ-032"], "owner": "테스트", "supersedes": None, "replaced_by": None,
        })
        changed["ui_system"]["patterns"].append({
            "id": "UIP-TEST", "title": "테스트 패턴", "status": "draft", "baseline": "UXB-TEST",
            "purpose": "생성 검증", "states": ["loading", "empty", "error", "forbidden"],
            "accessibility": ["제목 구조"], "components": ["CMP-TEST"], "requirements": ["REQ-032"],
            "owner": "테스트", "supersedes": None, "replaced_by": None,
        })
        screen = {
            "id": "SCR-TEST", "title": "합성 화면", "module": "MOD-ARCH", "status": "draft",
            "requirements": ["REQ-032"], "route": "/test", "baseline": "UXB-TEST", "pattern": "UIP-TEST",
            "components": ["CMP-TEST"], "layout": "단일 열", "actions": ["저장"], "states": {},
            "accessibility": [], "acceptance_tests": ["TC-025"], "approval": None,
        }
        manual = {
            "id": "MAN-TEST", "title": "합성 화면 사용법", "screen": "SCR-TEST", "status": "draft",
            "audience": "테스트 사용자", "prerequisites": [], "steps": ["저장을 선택한다."],
            "expected_results": ["완료된다."], "error_recovery": ["다시 시도한다."], "capture_slots": [], "evidence": [],
        }
        changed["ui_modules"] = {"fragments": [], "screens": [screen], "manuals": [manual]}
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertEqual([], errors)
        documents = AIDD.render_documents(changed)
        self.assertIn("ui/modules/MOD-ARCH/SCR-TEST/requirements.md", documents)
        self.assertIn("검토용 목업", documents["ui/modules/MOD-ARCH/SCR-TEST/mockup.html"])
        self.assertIn("manuals/modules/MOD-ARCH/MAN-TEST.md", documents)
        screen["status"] = "approved"
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("missing required states" in item for item in errors), errors)

    def test_module_fragment_mismatch_is_rejected(self):
        changed = copy.deepcopy(self.data)
        path, fragment = changed["requirements"]["_module_fragments"][0]
        fragment["module"] = "MOD-UNKNOWN"
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("unknown module" in item for item in errors))

    def test_assumption_requires_gate_and_resolution_history(self):
        changed = copy.deepcopy(self.data)
        changed["assumptions"]["assumptions"] = [{
            "id": "ASM-001", "statement": "임시 가정", "rationale": "검증 전 진행", "modules": ["MOD-ARCH"],
            "links": ["REQ-009"], "due_gate": "TG-001", "status": "open", "resolution": None,
        }]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertEqual([], errors)
        changed["assumptions"]["assumptions"][0]["status"] = "confirmed"
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("without a resolution" in item for item in errors))

    def test_gate_review_change_options_and_verification_load_are_checked(self):
        changed = copy.deepcopy(self.data)
        change = changed["changes"]["changes"][0]
        change["options"] = [
            {"id": "now", "selected": True}, {"id": "later", "selected": False}, {"id": "not_now", "selected": False},
        ]
        change["scope_delta"] = {"requirements": 1, "work_items": 2}
        changed["gate_runs"]["gate_runs"][0]["review"] = {
            "redteam_findings": ["경계 누락 가능성"],
            "decision_card": [{"decision": "업무 영향으로 설명", "reversal_cost": "medium"}],
            "reverse_questions": [{"question": "현업 예외가 있나요?", "status": "open"}],
        }
        changed["delivery_plan"]["work_items"][0]["verification_load"] = {
            "fix_rounds": 1, "unverified_rules": 0, "quality_fails": 0, "spec_defects": 0, "redteam_fixes": 1,
        }
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertEqual([], errors)
        changed["delivery_plan"]["work_items"][0]["verification_load"]["fix_rounds"] = -1
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("verification load fix_rounds" in item for item in errors))

    def test_rule_mutation_requires_evidence_when_applicable(self):
        changed = copy.deepcopy(self.data)
        test = changed["tests"]["test_cases"][0]
        test["rule_mutation"] = {"applicable": True, "rules": ["중복을 거부한다"], "evidence": []}
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("applicable rule mutation" in item for item in errors))

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

    def test_pending_merge_recheck_is_briefed_and_blocks_release(self):
        changed = copy.deepcopy(self.data)
        changed["merges"]["merges"] = [{
            "id": "MRG-001", "commit": "a", "parents": ["b", "c"], "changed_files": [],
            "affected_modules": ["MOD-CHG"], "conflict_resolution_notes": "상호작용 검토",
            "additional_testing": "회귀 테스트 필요", "status": "assessed",
            "rechecks": [{
                "id": "MRC-001", "type": "test", "title": "병합 후 회귀 테스트",
                "modules": ["MOD-CHG"], "tests": ["TC-006"], "blocking": True,
                "status": "pending", "reviewed_by": None, "reviewed_at": None,
                "result": None, "evidence": [],
            }],
        }]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertEqual([], errors)
        briefing = AIDD.status_text(changed, "executive", include_runtime_identity=False)
        self.assertIn("MRG-001/MRC-001", briefing)
        blockers = AIDD.release_blockers(changed, changed["releases"]["releases"][0], include_runtime_identity=False)
        self.assertIn("MRG-001의 MRC-001 병합 후 재검토가 완료되지 않았습니다", blockers)

    def test_completed_merge_recheck_requires_known_reviewer_and_test_evidence(self):
        changed = copy.deepcopy(self.data)
        changed["merges"]["merges"] = [{
            "id": "MRG-001", "commit": "a", "parents": ["b", "c"], "changed_files": [],
            "affected_modules": ["MOD-CHG"], "conflict_resolution_notes": "상호작용 검토",
            "additional_testing": "회귀 테스트 필요", "status": "assessed",
            "rechecks": [{
                "id": "MRC-001", "type": "test", "title": "병합 후 회귀 테스트",
                "modules": ["MOD-CHG"], "tests": ["TC-006"], "blocking": True,
                "status": "completed", "reviewed_by": "HUM-999", "reviewed_at": None,
                "result": None, "evidence": [],
            }],
        }]
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertTrue(any("MRC-001 has no known reviewer" in item for item in errors))
        self.assertTrue(any("MRC-001 is completed without reviewer time and result" in item for item in errors))
        self.assertTrue(any("MRC-001 test completion has no evidence" in item for item in errors))

    def test_post_merge_argument_is_accepted(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / ".ai" / "tools" / "aidd.py"), "record-merge", "0"],
            cwd=ROOT, capture_output=True, text=True, check=False,
        )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("not a merge commit", result.stdout)

    def test_project_init_creates_git_and_hooks_without_a_commit(self):
        with tempfile.TemporaryDirectory() as directory:
            temp_root = Path(directory)
            (temp_root / ".ai" / "tools").mkdir(parents=True)
            (temp_root / ".githooks").mkdir()
            shutil.copy2(ROOT / ".ai" / "tools" / "aidd.py", temp_root / ".ai" / "tools" / "aidd.py")
            shutil.copy2(ROOT / ".githooks" / "post-merge", temp_root / ".githooks" / "post-merge")
            shutil.copy2(ROOT / ".githooks" / "pre-commit", temp_root / ".githooks" / "pre-commit")
            (temp_root / "README.md").write_text("기준선 전 파일\n", encoding="utf-8")

            result = subprocess.run(
                [sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "project-init"],
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
            (temp_root / ".ai" / "tools").mkdir(parents=True)
            (temp_root / "project" / ".aidd" / "ssot").mkdir(parents=True)
            shutil.copy2(ROOT / ".ai" / "tools" / "aidd.py", temp_root / ".ai" / "tools" / "aidd.py")
            (temp_root / "project" / ".aidd" / "ssot" / "merges.json").write_text(
                '{"schema_version": 1, "merges": []}\n', encoding="utf-8",
            )
            (temp_root / "project" / ".aidd" / "ssot" / "modules.json").write_text(
                '{"schema_version": 1, "modules": [{"id": "MOD-CHG"}]}\n', encoding="utf-8",
            )
            (temp_root / "project" / ".aidd" / "ssot" / "tests.json").write_text(
                '{"schema_version": 1, "test_cases": [{"id": "TC-006"}]}\n', encoding="utf-8",
            )
            (temp_root / "project" / ".aidd" / "ssot" / "evidence.json").write_text(
                '{"schema_version": 1, "evidence": [{"id": "EVD-001"}]}\n', encoding="utf-8",
            )
            (temp_root / "project" / ".aidd" / "ssot" / "collaboration.json").write_text(
                '{"schema_version": 1, "participants": [{"id": "HUM-001"}]}\n', encoding="utf-8",
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
                [sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "record-merge", "0"],
                cwd=temp_root, capture_output=True, text=True, check=False,
            )
            self.assertEqual(0, result.returncode, result.stderr)
            payload = json.loads((temp_root / "project" / ".aidd" / "ssot" / "merges.json").read_text(encoding="utf-8"))
            self.assertEqual(1, len(payload["merges"]))
            record = payload["merges"][0]
            self.assertEqual("needs_assessment", record["status"])
            self.assertEqual(2, len(record["parents"]))
            self.assertIn("feature.txt", record["changed_files"])
            self.assertEqual("pending", record["additional_testing"])

            assessment = subprocess.run(
                [
                    sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "assess-merge",
                    "--merge", record["id"], "--modules", "MOD-CHG", "--notes", "양쪽 변경 상호작용 검토",
                    "--additional-testing", "MOD-CHG 회귀 테스트 필요",
                ],
                cwd=temp_root, capture_output=True, text=True, check=False,
            )
            self.assertEqual(0, assessment.returncode, assessment.stderr)
            assessed = json.loads((temp_root / "project" / ".aidd" / "ssot" / "merges.json").read_text(encoding="utf-8"))["merges"][0]
            self.assertEqual("assessed", assessed["status"])
            self.assertEqual(["MOD-CHG"], assessed["affected_modules"])
            self.assertEqual("MOD-CHG 회귀 테스트 필요", assessed["additional_testing"])

            recheck = subprocess.run(
                [
                    sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "add-merge-recheck",
                    "--merge", record["id"], "--type", "test", "--title", "병합 후 회귀 테스트",
                    "--module", "MOD-CHG", "--test", "TC-006", "--blocking",
                ], cwd=temp_root, capture_output=True, text=True, check=False,
            )
            self.assertEqual(0, recheck.returncode, recheck.stderr)
            pending = json.loads((temp_root / "project" / ".aidd" / "ssot" / "merges.json").read_text(encoding="utf-8"))["merges"][0]["rechecks"][0]
            self.assertEqual("pending", pending["status"])
            self.assertIsNone(pending["reviewed_by"])

            completed = subprocess.run(
                [
                    sys.executable, str(temp_root / ".ai" / "tools" / "aidd.py"), "complete-merge-recheck",
                    "--merge", record["id"], "--recheck", pending["id"], "--reviewed-by", "HUM-001",
                    "--result", "회귀 테스트 통과, 추가 수정 없음", "--evidence", "EVD-001",
                ], cwd=temp_root, capture_output=True, text=True, check=False,
            )
            self.assertEqual(0, completed.returncode, completed.stderr)
            recorded = json.loads((temp_root / "project" / ".aidd" / "ssot" / "merges.json").read_text(encoding="utf-8"))["merges"][0]["rechecks"][0]
            self.assertEqual("completed", recorded["status"])
            self.assertEqual("HUM-001", recorded["reviewed_by"])
            self.assertEqual(["EVD-001"], recorded["evidence"])

    def test_github_workflow_runs_deterministic_checks(self):
        workflow = (ROOT / ".github" / "workflows" / "aidd.yml").read_text(encoding="utf-8")
        for command in (
            "python .ai/tools/aidd.py generate", "python .ai/tools/aidd.py sync-ai",
            "git diff --exit-code", "python .ai/tools/aidd.py validate",
            "python .ai/tools/aidd.py identity-check --warning-only", "python -m unittest discover -s .ai/tests -v",
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
        self.assertGreaterEqual(len(blockers), 3)
        for run in changed["gate_runs"]["gate_runs"]:
            if run["change"] == "CHG-001":
                run["status"] = "approved"
        remaining = AIDD.development_blockers(changed, change)
        self.assertTrue(any("작업 패키지" in item or "범위" in item for item in remaining))

    def test_guides_are_generated_from_structured_records(self):
        documents = AIDD.render_documents(self.data)
        for filename, heading in (
            ("operator-guide.md", "AIDD 운영자 가이드와 런북"),
            ("user-manual.md", "AIDD 사용자 매뉴얼"),
            ("security-guide.md", "AIDD 보안 모델과 검증 가이드"),
        ):
            self.assertIn(filename, documents)
            self.assertIn(heading, documents[filename])

    def test_unified_user_guide_is_linked_and_covers_project_flow(self):
        guide = ROOT / ".ai" / "docs" / "guides" / "aidd-kit-guide.md"
        text = guide.read_text(encoding="utf-8")
        for phrase in (
            "의도 찾기", "운영 맥락", "기술 선택", "작은 단위 구현", "검토와 출시", "가정", "미결사항",
            "시작 전 준비와 제약", "Git", "Python", "모듈형 모놀리스", "마이크로서비스", "이벤트 기반", "서버리스", "ADR",
            "project-init", "project-bootstrap", "커밋하거나 원격에 푸시하지 말고",
        ):
            self.assertIn(phrase, text)
        self.assertIn("명령어 대신 AI에게 초기화를 요청하기", text)
        self.assertIn("project-init과 project-bootstrap", text)
        self.assertFalse((ROOT / ".ai" / "docs" / "guides" / "ai-conversation-project-guide.md").exists())
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn(".ai/docs/guides/aidd-kit-guide.md", readme)
        self.assertNotIn("ai-conversation-project-guide.md", readme)
        deliverables = {item["id"]: item for item in self.data["deliverables"]["deliverables"]}
        self.assertEqual(".ai/docs/guides/aidd-kit-guide.md", deliverables["DLV-TEMPLATE"]["path"])
        self.assertEqual("superseded", deliverables["DLV-CONVERSATION"]["status"])
        self.assertEqual("DLV-TEMPLATE", deliverables["DLV-CONVERSATION"]["replaced_by"])

        changed = copy.deepcopy(self.data)
        retired = next(item for item in changed["deliverables"]["deliverables"] if item["id"] == "DLV-CONVERSATION")
        retired["replaced_by"] = "DLV-UNKNOWN"
        errors, _warnings = AIDD.validate(changed, check_generated=False, check_adapters=False)
        self.assertIn("DLV-CONVERSATION references unknown replacement DLV-UNKNOWN", errors)

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
        changed["collaboration"]["participants"][0]["roles"].append("PM")
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
        changed["collaboration"]["participants"][0]["roles"].append("PM")
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
        self.assertTrue(any("C2 or C3 change is complete" in item for item in errors))
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
        payload["participants"][0]["roles"].append("PM")
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
