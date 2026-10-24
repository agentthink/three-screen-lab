"""Build contracts that protect published pages and contributor input."""

import json, re, sys, tempfile, unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from buildlib import Builder, ROOT, load_registry, safe_path


class RegistryTests(unittest.TestCase):
    def registry(self, data):
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / "screens.json"
            file.write_text(json.dumps(data))
            return load_registry(file)

    def test_duplicate_ids_rejected(self):
        row = load_registry()[0]
        with self.assertRaises(ValueError):
            self.registry([row, row])

    def test_dimensions_and_path_are_validated(self):
        for change in [
            {"width": True},
            {"height": 0},
            {"preview": "../private.png"},
            {"preview": None},
            {"id": "../x"},
            {"extra": 1},
        ]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.registry([{**load_registry()[0], **change}])

    def test_path_escape_rejected(self):
        with self.assertRaises(ValueError):
            safe_path("../private.txt")

    def test_home_escapes_contributor_text_and_uses_registry(self):
        with tempfile.TemporaryDirectory() as temp:
            row = {
                **load_registry()[0],
                "title": '<script>alert("x")</script>',
                "tags": ["<img src=x>"],
            }
            Builder(temp, "web").home([row])
            page = (Path(temp) / "home.html").read_text()
            self.assertIn("&lt;script&gt;", page)
            self.assertNotIn("<script>alert", page)
            self.assertEqual(page.count('class="screen-card"'), 1)
            self.assertIn('data-width="1920"', page)
            self.assertEqual(page, (Path(temp) / "index.html").read_text())

    def test_marker_failure_is_explicit(self):
        with tempfile.TemporaryDirectory() as temp, self.assertRaises(ValueError):
            Builder(temp, "web").finish("bad.html", "/*__MISSING__*/")

    def test_external_scripts_share_content_hash_and_keep_order(self):
        with tempfile.TemporaryDirectory() as temp:
            b = Builder(temp, "web")
            b.finish(
                "a.html",
                '<style>body{background:url("_assets/a.webp")}</style><script>let a=1;</script><script>let a=1;</script>',
            )
            page = (Path(temp) / "a.html").read_text()
            scripts = re.findall(r'src="([^"]+)"', page)
            self.assertEqual(len(scripts), 2)
            self.assertEqual(scripts[0], scripts[1])
            self.assertNotIn("data:", page)
            css = next((Path(temp) / "_assets").glob("*.css")).read_text()
            self.assertIn('url("a.webp")', css)

    def test_real_geographic_bindings_survive_formatter_semicolons(self):
        with tempfile.TemporaryDirectory() as temp:
            b = Builder(temp, "web")
            for entry in load_registry():
                if entry["renderer"] not in ["population", "inspection"]:
                    continue
                b.screen(entry)
            codes = "\n".join(
                p.read_text() for p in (Path(temp) / "_assets").glob("*.js")
            )
            for constant in [
                "CHINA",
                "CHINA_OUTLINE",
                "COUNTRIES",
                "RELIEF_EXTENT",
                "POPULATION_CHINA",
                "POPULATION_OUTLINE",
                "POPULATION_WORLD",
            ]:
                self.assertRegex(codes, r"const " + constant + r"\s*=\s*\{")
                self.assertNotRegex(codes, r"const " + constant + r"\s*=\s*null")

    def test_standalone_embeds_resources(self):
        with tempfile.TemporaryDirectory() as temp:
            b = Builder(temp, "standalone")
            self.assertTrue(b.resource(b"hello", "x", "txt").startswith("data:"))
            b.finish("a.html", "<script>let a=1;</script>")
            self.assertIn(
                "<script>let a=1;</script>", (Path(temp) / "a.html").read_text()
            )

    def test_astra_header_art_and_permission_travel_with_offline_page(self):
        with tempfile.TemporaryDirectory() as temp:
            entry = next(row for row in load_registry() if row["id"] == "agriculture")
            Builder(temp, "standalone").screen(entry)
            page = (Path(temp) / "agriculture.html").read_text()
            self.assertIn('data-header-art="data:image/webp;base64,', page)
            self.assertIn("Owner-authorized scene adaptation", page)
            self.assertIn("separate from the code-only MIT grant", page)
            self.assertLess(
                page.index("window.ObservatoryHeader ="),
                page.index("window.ObservatoryDashboard ="),
            )


if __name__ == "__main__":
    unittest.main()
