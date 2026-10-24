"""Check distribution provenance without downloading or accepting provider terms."""

from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
CLEARED = {"Public domain", "MIT", "CC0-1.0", "CC-BY-4.0"}
STATUSES = {"verified", "provider-stated", "original", "generated", "composite"}


def validate_inventory(root=ROOT):
    root = Path(root).resolve()
    inventory = json.loads((root / "assets/manifest.json").read_text())["assets"]
    sources = json.loads((root / "config/asset-sources.json").read_text())["sources"]
    upstream = {row["id"]: row for row in sources}
    if len(upstream) != len(sources):
        raise ValueError("Duplicate upstream source id")
    for source in sources:
        if not re.fullmatch("[a-f0-9]{64}", source["sha256"]):
            raise ValueError("Invalid upstream checksum")
        if source["license"] not in CLEARED or not source.get(
            "licenseEvidence", ""
        ).startswith("https://"):
            raise ValueError("Missing source permission evidence")
        if not all(
            source.get(key) is True
            for key in ["commercialUse", "redistribution", "modification"]
        ):
            raise ValueError(
                "Source must explicitly permit commercial use and redistribution"
            )
    seen = set()
    for row in inventory:
        name = row["path"]
        path = (root / name).resolve()
        if (
            not path.is_relative_to(root / "assets")
            or name in seen
            or not path.is_file()
        ):
            raise ValueError("Invalid, duplicate or missing asset path: " + name)
        seen.add(name)
        if row.get("status") not in STATUSES:
            raise ValueError("Unknown asset permission status: " + name)
        if hashlib.sha256(path.read_bytes()).hexdigest() != row["sha256"]:
            raise ValueError("Stale asset checksum: " + name)
        if name.startswith(("assets/geo/", "assets/textures/")):
            if row["license"] not in CLEARED or row["status"] not in {
                "verified",
                "original",
            }:
                raise ValueError("Map/texture requires cleared permissions: " + name)
            if not all(
                row.get(key) is True
                for key in ["commercialUse", "redistribution", "modification"]
            ):
                raise ValueError("Map/texture is missing reuse permissions: " + name)
            if row["status"] != "original" and not row.get("upstream"):
                raise ValueError("Map/texture is missing source chain: " + name)
            if any(key not in upstream for key in row.get("upstream", [])):
                raise ValueError("Unknown upstream source: " + name)
    actual = {
        str(p.relative_to(root))
        for folder in ["geo", "textures"]
        for p in (root / "assets" / folder).rglob("*")
        if p.is_file()
    }
    if not actual.issubset(seen):
        raise ValueError("Unlisted runtime map/texture: " + str(sorted(actual - seen)))
    return inventory


if __name__ == "__main__":
    print("Verified", len(validate_inventory()), "runtime asset inventory entries")
