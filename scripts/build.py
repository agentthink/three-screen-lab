"""Build cached web assets and optional fully embedded offline HTML files."""

from pathlib import Path
import argparse, json, shutil
from buildlib import ROOT, Builder, load_registry, digest
from archive import archive


def build(target="all", mode="all", out=None):
    output = (Path(out) if out else ROOT / "dist").resolve()
    if output == ROOT or not output.is_relative_to(ROOT) and out is None:
        raise ValueError("Invalid output directory")
    if target == "all" and output.exists():
        # Only remove files previously owned by this builder, never arbitrary output trees.
        old = output / "build-manifest.json"
        if old.exists():
            previous = json.loads(old.read_text())
            for filename in previous.get("files", {}):
                owned = (output / filename).resolve()
                if owned.is_relative_to(output) and owned.is_file():
                    owned.unlink()
    output.mkdir(parents=True, exist_ok=True)
    entries = load_registry()
    if target not in ["all", "home"] + [e["id"] for e in entries]:
        raise ValueError("Unknown build target: " + target)
    builders = []
    if mode in ["web", "all"]:
        builders.append(Builder(output, "web"))
    if mode in ["standalone", "all"]:
        builders.append(Builder(output / "standalone", "standalone"))
    for builder in builders:
        for entry in entries:
            if target in ["all", entry["id"]]:
                builder.screen(entry)
        builder.home(entries)
    if (ROOT / "docs/media").exists():
        shutil.copytree(ROOT / "docs/media", output / "docs/media", dirs_exist_ok=True)
    shutil.copytree(
        ROOT / "docs/licensing", output / "docs/licensing", dirs_exist_ok=True
    )
    for source in [
        "config/asset-sources.json",
        "assets/manifest.json",
        "docs/assets.md",
    ]:
        destination = output / source
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / source, destination)
    # Retain existing public download/media URLs while keeping their sources organized.
    for item in (ROOT / "docs/media").glob("*"):
        if item.is_file():
            shutil.copy2(item, output / item.name)
    model = ROOT / "assets/models/factory-campus.glb"
    if model.exists():
        shutil.copy2(model, output / "factory-campus.glb")
    for name in ["README.md", "LICENSE", "THIRD_PARTY_NOTICES.md"]:
        if (ROOT / name).exists():
            shutil.copy2(ROOT / name, output / name)
    (output / ".nojekyll").touch()
    if target == "all" and mode == "all":
        archive(output / "screen-picture-source.zip")
    manifest = {
        "schemaVersion": 1,
        "screens": [
            {k: e[k] for k in ["id", "title", "width", "height", "category"]}
            for e in entries
        ],
        "files": {
            str(p.relative_to(output)): digest(p.read_bytes())
            for p in sorted(output.rglob("*"))
            if p.is_file() and p.name != "build-manifest.json"
        },
    }
    (output / "build-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"Built {len(entries)} registered screens + Home ({mode}) -> {output}")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", default="all")
    parser.add_argument("--mode", choices=["web", "standalone", "all"], default="all")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    build(args.target, args.mode, args.out)
