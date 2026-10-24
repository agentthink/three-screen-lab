"""Export only the documented source tree, never local recordings or credentials."""

from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRS = ["src", "config", "scripts", "tests", "docs", "assets", ".github"]
SOURCE_FILES = [
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
    "ROADMAP.md",
    "package.json",
    "package-lock.json",
    "requirements.txt",
    "requirements-assets.txt",
    ".nvmrc",
    ".gitignore",
    ".prettierignore",
    ".prettierrc.json",
    "playwright.config.mjs",
]


def source_files():
    return sorted(
        [
            p
            for folder in SOURCE_DIRS
            for p in (ROOT / folder).rglob("*")
            if p.is_file() and "__pycache__" not in p.parts
        ]
        + [ROOT / p for p in SOURCE_FILES if (ROOT / p).is_file()]
    )


def archive(output):
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for path in source_files():
            info = zipfile.ZipInfo(str(path.relative_to(ROOT)), (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, path.read_bytes())
    print("Source archive:", output)


if __name__ == "__main__":
    archive(ROOT / "dist/screen-picture-source.zip")
