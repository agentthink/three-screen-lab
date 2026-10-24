"""Map/material provenance and distribution contracts."""

import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from verify_assets import ROOT, validate_inventory


class AssetTests(unittest.TestCase):
    def test_inventory_has_current_hashes_and_explicit_permissions(self):
        self.assertGreater(len(validate_inventory()), 10)

    def test_bad_paths_permissions_and_stale_hashes_are_rejected(self):
        for change in [
            {"path": "../private.png"},
            {"status": "unverified"},
            {"commercialUse": False},
            {"sha256": "0" * 64},
        ]:
            with self.subTest(change=change), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                (root / "assets/textures").mkdir(parents=True)
                (root / "config").mkdir()
                file = root / "assets/textures/grid.png"
                file.write_bytes(b"fixture")
                row = {
                    "path": "assets/textures/grid.png",
                    "source": "Original fixture",
                    "license": "MIT",
                    "status": "original",
                    "commercialUse": True,
                    "redistribution": True,
                    "modification": True,
                    "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
                    **change,
                }
                (root / "assets/manifest.json").write_text(
                    json.dumps({"assets": [row]})
                )
                (root / "config/asset-sources.json").write_text('{"sources":[]}')
                with self.assertRaises(ValueError):
                    validate_inventory(root)

    def test_all_34_regions_have_usable_centers_and_closed_rings(self):
        data = json.loads((ROOT / "assets/geo/china.json").read_text())
        self.assertEqual(len(data["features"]), 34)
        codes = set()
        names = set()
        for feature in data["features"]:
            p = feature["properties"]
            codes.add(p["adcode"])
            names.add(p["name"])
            self.assertEqual(len(p["center"]), 2)
            self.assertTrue(70 < p["center"][0] < 140 and 15 < p["center"][1] < 55)
            self.assertEqual(feature["geometry"]["type"], "MultiPolygon")
            self.assertTrue(feature["geometry"]["coordinates"])
            for polygon in feature["geometry"]["coordinates"]:
                for ring in polygon:
                    self.assertEqual(ring[0], ring[-1])
                    self.assertGreaterEqual(len(ring), 4)
        self.assertEqual(len(codes), 34)
        self.assertTrue(
            {"台湾省", "香港特别行政区", "澳门特别行政区", "四川省"} <= names
        )

    def test_texture_dimensions_and_retired_assets(self):
        for name in ["earth-day.jpg", "earth-normal.jpg", "earth-night.png"]:
            with Image.open(ROOT / "assets/textures" / name) as image:
                self.assertEqual(image.size, (2048, 1024))
        with Image.open(ROOT / "assets/textures/relief.png") as image:
            self.assertEqual(image.size, (1920, 1182))
        retired = {
            row["sha256"]
            for row in json.loads(
                (ROOT / "tests/fixtures/retired-assets.json").read_text()
            )
        }
        actual = {
            hashlib.sha256(p.read_bytes()).hexdigest()
            for p in (ROOT / "assets").rglob("*")
            if p.is_file()
        }
        self.assertFalse(retired & actual)
        self.assertFalse((ROOT / "assets/art/grid-mask.png").exists())

    def test_both_distributions_embed_complete_permission_notices(self):
        from buildlib import Builder, load_registry

        with tempfile.TemporaryDirectory() as temp:
            for mode in ["web", "standalone"]:
                folder = Path(temp) / mode
                Builder(folder, mode).home(load_registry())
                page = (folder / "home.html").read_text()
                for text in [
                    "MIT License",
                    "Permission to use, copy, modify",
                    "public domain",
                    "naturalearthdata.com/about/terms-of-use",
                ]:
                    self.assertIn(text, page)
