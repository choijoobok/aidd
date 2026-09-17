import importlib.util
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
