import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("kit_tool", ROOT / ".aidd-kit-dev" / "tools" / "kit.py")
KIT = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(KIT)


class KitLifecycleTests(unittest.TestCase):
    def test_source_role_and_maintainer_boundary(self):
        self.assertEqual("kit-source", json.loads((ROOT / ".aidd-role.json").read_text(encoding="utf-8"))["role"])
        self.assertFalse((ROOT / "project").exists())
        self.assertTrue((ROOT / ".aidd-kit-dev" / "skills" / "aidd-kit-release" / "SKILL.md").is_file())

    def test_template_export_excludes_maintainer_content(self):
        with tempfile.TemporaryDirectory() as temporary:
            stage = Path(temporary) / "stage"
            stage.mkdir()
            KIT.assemble(stage, "kit-template")
            self.assertEqual([], KIT.validate_export_tree(stage, expect_project=False))
            self.assertFalse((stage / ".aidd-kit-dev").exists())
            self.assertFalse((stage / ".agents" / "skills" / "aidd-kit-release").exists())
            origin = json.loads((stage / ".aidd-kit-origin.json").read_text(encoding="utf-8"))
            self.assertEqual("provenance-only", origin["purpose"])
            self.assertEqual("none", origin["upgrade_contract"])

    def test_new_project_bootstraps_product_workspace(self):
        with tempfile.TemporaryDirectory() as temporary:
            stage = Path(temporary) / "stage"
            stage.mkdir()
            KIT.assemble(stage, "product-workspace", {"project_id": "SAMPLE", "name": "Sample", "mode": "greenfield"})
            self.assertEqual([], KIT.validate_export_tree(stage, expect_project=True))
            result = subprocess.run(
                [sys.executable, str(stage / ".ai" / "tools" / "aidd.py"), "validate"],
                cwd=stage,
                check=False,
                capture_output=True,
                text=True,
                encoding="utf-8",
            )
            self.assertEqual(0, result.returncode, result.stdout + result.stderr)

    def test_template_bootstrap_transitions_role_to_product_workspace(self):
        with tempfile.TemporaryDirectory() as temporary:
            stage = Path(temporary) / "stage"
            stage.mkdir()
            KIT.assemble(stage, "kit-template")
            result = subprocess.run(
                [
                    sys.executable, str(stage / ".ai" / "tools" / "aidd.py"), "project-bootstrap",
                    "--project-id", "TEMPLATE-TEST", "--name", "Template Test", "--mode", "greenfield",
                ],
                cwd=stage,
                check=False,
                capture_output=True,
                text=True,
                encoding="utf-8",
            )
            self.assertEqual(0, result.returncode, result.stdout + result.stderr)
            self.assertEqual("product-workspace", json.loads((stage / ".aidd-role.json").read_text(encoding="utf-8"))["role"])
            self.assertEqual([], KIT.validate_export_tree(stage, expect_project=True))

    def test_zip_is_deterministic_for_same_tree(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage = root / "stage"
            stage.mkdir()
            KIT.assemble(stage, "kit-template")
            first = root / "first.zip"
            second = root / "second.zip"
            KIT.write_zip(stage, first)
            KIT.write_zip(stage, second)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            with zipfile.ZipFile(first) as archive:
                names = archive.namelist()
            self.assertNotIn(".aidd-kit-dev/", names)
            self.assertIn(".ai/docs/guides/project-team-guide.md", names)

    def test_source_ruleset_requires_the_kit_ci_job(self):
        workflow = (ROOT / ".github" / "workflows" / "aidd.yml").read_text(encoding="utf-8")
        ruleset = json.loads((ROOT / ".github" / "rulesets" / "main.json").read_text(encoding="utf-8"))
        context = ruleset["rules"][-1]["parameters"]["required_status_checks"][0]["context"]
        self.assertIn(f"name: {context}", workflow)

    def test_both_audiences_have_natural_language_request_examples(self):
        maintainer = (ROOT / ".aidd-kit-dev" / "guides" / "kit-maintainer-guide.md").read_text(encoding="utf-8")
        project_team = (ROOT / ".ai" / "docs" / "guides" / "project-team-guide.md").read_text(encoding="utf-8")
        self.assertIn("## AI에게 요청하는 방법", maintainer)
        self.assertIn("Kit 관리팀 파일과 관리 전용 스킬은 절대 포함하지 말고", maintainer)
        self.assertIn("배포용 템플릿을 자연어로 요청하기", maintainer)
        self.assertIn("아직 제품 정본은 만들지 말고 `kit-template`으로 유지해줘", maintainer)
        self.assertIn("## AI에게 요청하는 방법", project_team)
        self.assertIn("아직 구현하지 마", project_team)

    def test_portable_project_guide_uses_export_not_source_copying(self):
        guide = (ROOT / ".ai" / "docs" / "guides" / "aidd-kit-guide.md").read_text(encoding="utf-8")
        self.assertIn("Kit 원본 저장소를 직접 복사해서 만들지 않는다", guide)
        self.assertIn("export한 폴더 또는 ZIP", guide)
        self.assertNotIn("이 Kit의 `.git`과 `project/`를 제외한 내용을 새 프로젝트 폴더로 복사", guide)

    def test_benchmarking_triage_is_portable_and_traceable(self):
        skill = (ROOT / ".ai" / "skills" / "aidd-discovery" / "SKILL.md").read_text(encoding="utf-8")
        reference = (ROOT / ".ai" / "skills" / "aidd-discovery" / "references" / "benchmarking.md").read_text(encoding="utf-8")
        research_note = (ROOT / ".ai" / "templates" / "artifact" / "research-note.md").read_text(encoding="utf-8")
        guide = (ROOT / ".ai" / "docs" / "guides" / "aidd-kit-guide.md").read_text(encoding="utf-8")
        project_team = (ROOT / ".ai" / "docs" / "guides" / "project-team-guide.md").read_text(encoding="utf-8")
        export_agents = (ROOT / ".aidd-kit-dev" / "export" / "AGENTS.md").read_text(encoding="utf-8")
        repository = json.loads((ROOT / ".aidd-kit-dev" / "repository.json").read_text(encoding="utf-8"))

        self.assertEqual("KIT-CHG-002", repository["active_change"])
        self.assertTrue((ROOT / ".aidd-kit-dev" / "changes" / "KIT-CHG-002.json").is_file())
        self.assertIn("BEN-TRIAGE", skill)
        self.assertIn("외부 벤치마킹 조사가 항상 필수인 것은 아니다", skill)
        self.assertIn("고객이 수용·보류·제외", reference)
        self.assertIn("BEN-TRIAGE 판정과 이유", research_note)
        self.assertIn("1.5. 의도 합의 뒤 벤치마킹 필요성 판단", guide)
        self.assertIn("BEN-TRIAGE", project_team)
        self.assertIn("BEN-TRIAGE", export_agents)


if __name__ == "__main__":
    unittest.main()
