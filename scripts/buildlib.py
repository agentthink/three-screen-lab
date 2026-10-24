"""Deterministic, local-only resource assembly for web and standalone distributions."""

from pathlib import Path
import base64, hashlib, html as html_module, io, json, mimetypes, re, shutil
from PIL import Image, ImageOps, ImageFilter, __version__ as PIL_VERSION

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {"3d": "3D 数字孪生", "geo": "地理可视化", "operations": "运营监测"}
REQUIRED = {
    "id",
    "title",
    "description",
    "category",
    "label",
    "width",
    "height",
    "preview",
    "tags",
    "renderer",
}


def safe_path(value, root=ROOT):
    path = (root / value).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"Path must remain inside the project: {value}")
    return path


def load_registry(path=None):
    entries = json.loads((path or ROOT / "config/screens.json").read_text())
    if not isinstance(entries, list) or not entries:
        raise ValueError("screens.json must contain at least one screen")
    seen = set()
    for entry in entries:
        if not isinstance(entry, dict) or set(entry) != REQUIRED:
            raise ValueError("Each screen must match config/screens.schema.json")
        identifier = entry["id"]
        if (
            not isinstance(identifier, str)
            or not re.fullmatch(r"[a-z][a-z0-9-]{1,39}", identifier)
            or identifier in seen
        ):
            raise ValueError(f"Invalid or duplicate screen id: {identifier}")
        seen.add(identifier)
        if entry["category"] not in CATEGORIES or entry["renderer"] not in [
            "wind",
            "factory",
            "population",
            "inspection",
            "generic",
        ]:
            raise ValueError(f"Unsupported screen category/renderer: {identifier}")
        for key, low, high in [("width", 320, 7680), ("height", 240, 4320)]:
            if type(entry[key]) is not int or not low <= entry[key] <= high:
                raise ValueError(f"Invalid {key} for {identifier}")
        for key in ["title", "description", "label"]:
            if not isinstance(entry[key], str) or not entry[key].strip():
                raise ValueError(f"Invalid {key}")
        if (
            not isinstance(entry["tags"], list)
            or not 1 <= len(entry["tags"]) <= 5
            or any(not isinstance(t, str) or not t.strip() for t in entry["tags"])
        ):
            raise ValueError(f"Invalid tags for {identifier}")
        if (
            not isinstance(entry["preview"], str)
            or not entry["preview"].startswith("assets/previews/")
            or not safe_path(entry["preview"]).is_file()
        ):
            raise ValueError(f"Missing local preview for {identifier}")
        if not (ROOT / "src/screens" / identifier / "template.html").is_file():
            raise ValueError(f"Missing source template for {identifier}")
    return entries


def digest(data):
    return hashlib.sha256(data).hexdigest()


def cached(name, inputs, producer, suffix):
    key = digest(b"vizlab-build-v1" + PIL_VERSION.encode() + b"".join(inputs))[:20]
    path = ROOT / ".local/cache" / f"{name}.{key}.{suffix}"
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(producer())
    return path.read_bytes()


def webp(source, quality=91, alpha=False):
    raw = source.read_bytes()

    def produce():
        with Image.open(io.BytesIO(raw)) as original:
            image = original.convert("RGBA" if alpha else "RGB")
            out = io.BytesIO()
            image.save(
                out,
                "WEBP",
                quality=quality,
                method=6,
                **({"alpha_quality": 100} if alpha else {}),
            )
            return out.getvalue()

    return cached(
        source.stem, [raw, str(quality).encode(), str(alpha).encode()], produce, "webp"
    )


def compact_geo(filename, digits=3):
    data = json.loads((ROOT / "assets/geo" / filename).read_text())

    def coords(v):
        if isinstance(v, list):
            if v and isinstance(v[0], (int, float)):
                return [round(n, digits) for n in v]
            return [coords(n) for n in v]
        return v

    for f in data["features"]:
        f["geometry"]["coordinates"] = coords(f["geometry"]["coordinates"])
        if filename == "countries.json":
            f["properties"] = {
                "name": f["properties"].get("NAME", f["properties"].get("name", ""))
            }
        else:
            f["properties"] = {
                k: f["properties"][k]
                for k in ["name", "adcode", "center", "centroid"]
                if k in f["properties"]
            }
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def terrain_images():
    raw = (ROOT / "assets/textures/relief.png").read_bytes()

    def produce(map_surface):
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        gray = ImageOps.grayscale(image)
        smooth = gray.filter(ImageFilter.GaussianBlur(5))
        result = Image.new("RGB", image.size)
        source = image.load()
        g = gray.load()
        sm = smooth.load()
        dest = result.load()
        low, high = (
            ((21, 89, 145), (150, 216, 251))
            if map_surface
            else ((3, 11, 23), (51, 72, 94))
        )
        for y in range(image.height):
            for x in range(image.width):
                r, _, b = source[x, y]
                value = (
                    (165 if map_surface else 125)
                    + (g[x, y] - 225) * 2
                    + (g[x, y] - sm[x, y]) * 10
                )
                v = max(0, min(255, value)) / 255
                dest[x, y] = (
                    (3, 13, 27)
                    if b > r + 12
                    else tuple(round(a + (c - a) * v) for a, c in zip(low, high))
                )
        out = io.BytesIO()
        result.save(out, "WEBP", quality=89 if map_surface else 86)
        return out.getvalue()

    return (
        cached("terrain", [raw], lambda: produce(False), "webp"),
        cached("map-surface", [raw], lambda: produce(True), "webp"),
    )


class Builder:
    def __init__(self, out, mode):
        self.out = Path(out)
        self.mode = mode
        self.out.mkdir(parents=True, exist_ok=True)

    def resource(self, data, stem, extension, mime=None):
        if self.mode == "standalone":
            return (
                "data:"
                + (
                    mime
                    or mimetypes.guess_type("x." + extension)[0]
                    or "application/octet-stream"
                )
                + ";base64,"
                + base64.b64encode(data).decode()
            )
        name = f"{stem}.{digest(data)[:16]}.{extension}"
        folder = self.out / "_assets"
        folder.mkdir(exist_ok=True)
        (folder / name).write_bytes(data)
        return "_assets/" + name

    def image(self, path, quality=None, alpha=False):
        source = safe_path(path)
        data = webp(source, quality, alpha) if quality else source.read_bytes()
        return self.resource(
            data, source.stem, "webp" if quality else source.suffix[1:]
        )

    def finish(self, name, content):
        unresolved = re.findall(r"/\*__[A-Z_]+__\*/|<!--__[A-Z_]+__-->", content)
        if unresolved:
            raise ValueError(f"Unresolved build markers in {name}: {unresolved}")
        notice_paths = [
            "LICENSE",
            "docs/licensing/three-MIT.txt",
            "docs/licensing/d3-ISC.txt",
            "docs/licensing/natural-earth-PUBLIC-DOMAIN.txt",
        ]
        if 'id="observatory"' in content:
            notice_paths.append("docs/licensing/astra-owner-permission.txt")
        notice = (
            "\n<!-- Distribution permissions\n"
            + "\n\n".join((ROOT / path).read_text() for path in notice_paths)
            + "\n-->\n"
        )
        content = (
            content.replace("</head>", notice + "</head>", 1)
            if "</head>" in content
            else content + notice
        )
        if self.mode == "web":

            def script(match):
                attrs, body = match.group(1), match.group(2)
                if not body.strip() or 'type="application/json"' in attrs:
                    return match.group(0)
                path = self.resource(body.encode(), "code", "js", "text/javascript")
                return f'<script{attrs} src="{path}"></script>'

            def style(match):
                css = re.sub(r"url\(([\"\']?)_assets/", r"url(\1", match.group(1))
                path = self.resource(css.encode(), "styles", "css", "text/css")
                return f'<link rel="stylesheet" href="{path}">'

            content = re.sub(
                r"<script([^>]*)>(.*?)</script>", script, content, flags=re.S
            )
            content = re.sub(r"<style>(.*?)</style>", style, content, flags=re.S)
        (self.out / name).write_text(content)

    def screen(self, entry):
        source = ROOT / "src/screens" / entry["id"]
        content = (source / "template.html").read_text()
        kind = entry["renderer"]
        replacements = {
            "/*__D3__*/": (ROOT / "assets/vendor/d3.min.js").read_text(),
            "/*__THREE__*/": (ROOT / "assets/vendor/three.min.js").read_text(),
            "/*__RUNTIME__*/": (ROOT / "src/shared/runtime.js").read_text(),
        }
        for marker, filename in {
            "OBSERVATORY_CSS": "observatory.css",
            "OBSERVATORY_JS": "observatory.js",
            "OBSERVATORY_SCENE": "observatory-scene.js",
            "OBSERVATORY_HEADER": "observatory-header.js",
            "ASTRA_GEOMETRY": "astra-geometry.js",
        }.items():
            token = f"/*__{marker}__*/"
            if token in content:
                replacements[token] = (ROOT / "src/shared" / filename).read_text()
        if "/*__OBSERVATORY_HEADER_ART__*/" in content:
            replacements["/*__OBSERVATORY_HEADER_ART__*/"] = self.image(
                f"assets/art/astra/{entry['id']}-header.png", 94
            )
        for file, markers in {
            "styles.css": ["CSS"],
            "app.js": ["JS"],
            "model.js": ["MODEL_JS", "MODEL"],
            "globe.js": ["GLOBE_JS"],
            "map-depth.js": ["MAP_DEPTH"],
            "data.js": ["SCREEN_DATA"],
        }.items():
            if (source / file).exists():
                text = (source / file).read_text()
                for marker in markers:
                    for prefix in ["SCREEN", kind.upper()]:
                        replacements[f"/*__{prefix}_{marker}__*/"] = text
                    replacements[f"/*__{marker}__*/"] = text
        if kind == "factory":
            replacements["/*__FACTORY_MODEL__*/"] = self.image(
                "assets/art/factory-fallback.png", 95, True
            )
            replacements["/*__FACTORY_GRID_MASK__*/"] = self.image(
                "assets/textures/factory-grid.png"
            )
        elif kind == "population":
            header = safe_path("assets/art/population-header.png")
            with Image.open(header) as im:
                alpha = im.getchannel("A")
                bounds = alpha.point(lambda a: 255 if a > 7 else 0).getbbox()
                if not bounds or alpha.getextrema()[0] != 0:
                    raise ValueError(
                        "Population header requires nonempty true transparency"
                    )
                factor = 132 / (bounds[3] - bounds[1])
                style = f"--header-art-top:{-9-bounds[1]*factor:.2f}px;--header-art-height:{im.height*factor:.2f}px;"
            content = content.replace(
                '<header class="population-header">',
                f'<header class="population-header" style="{style}">',
            )
            replacements.update(
                {
                    "/*__HEADER_ART__*/": self.image(
                        "assets/art/population-header.png", 97, True
                    ),
                    "/*__POPULATION_CHINA__*/": compact_geo("china.json"),
                    "/*__POPULATION_OUTLINE__*/": compact_geo("china-outline.json"),
                    "/*__POPULATION_WORLD__*/": compact_geo("countries.json", 2),
                    "/*__EARTH_DAY__*/": self.image(
                        "assets/textures/earth-day.jpg", 91
                    ),
                    "/*__EARTH_NIGHT__*/": self.image(
                        "assets/textures/earth-night.png", 90
                    ),
                    "/*__EARTH_NORMAL__*/": self.image(
                        "assets/textures/earth-normal.jpg", 89
                    ),
                }
            )
        elif kind == "inspection":
            terrain, surface = terrain_images()
            replacements.update(
                {
                    "/*__CHINA__*/": compact_geo("china.json"),
                    "/*__CHINA_OUTLINE__*/": compact_geo("china-outline.json"),
                    "/*__COUNTRIES__*/": compact_geo("countries.json", 2),
                    "/*__MAP_DEPTH__*/": (source / "map-depth.js").read_text(),
                    "/*__RELIEF__*/": self.resource(terrain, "terrain", "webp"),
                    "/*__MAP_TEXTURE__*/": self.resource(
                        surface, "map-surface", "webp"
                    ),
                    "/*__RELIEF_EXTENT__*/": json.dumps(
                        json.loads(
                            (ROOT / "assets/geo/relief-metadata.json").read_text()
                        )["extent"]
                    ),
                }
            )
        for marker, text in replacements.items():
            # Formatters may move a trailing placeholder comment after the semicolon.
            content = re.sub(
                r"null(\s*;)?\s*" + re.escape(marker),
                lambda m: text + (";" if m.group(1) else ""),
                content,
            ).replace(marker, text)
        self.finish(entry["id"] + ".html", content)

    def home(self, entries):
        content = (ROOT / "src/home/template.html").read_text()
        card = (ROOT / "src/home/card.html").read_text()
        cards = []
        for i, entry in enumerate(entries, 1):
            values = {
                **entry,
                "index": str(i).zfill(2),
                "entry": entry["id"] + ".html",
                "image": self.image(entry["preview"]),
            }
            text = card
            for key, value in values.items():
                if isinstance(value, (str, int)):
                    text = text.replace(
                        "{{" + key + "}}", html_module.escape(str(value), quote=True)
                    )
            text = text.replace(
                "{{tags}}",
                "".join(
                    "<span>" + html_module.escape(t) + "</span>" for t in entry["tags"]
                ),
            )
            cards.append(text)
        filters = '<button data-filter="all" aria-pressed="true">全部作品</button>' + "".join(
            f'<button data-filter="{key}" aria-pressed="false">{CATEGORIES[key]}</button>'
            for key in CATEGORIES
            if any(e["category"] == key for e in entries)
        )
        content = (
            content.replace("<!--__SCREEN_CARDS__-->", "\n".join(cards))
            .replace("<!--__FILTERS__-->", filters)
            .replace("<!--__SCREEN_COUNT__-->", str(len(entries)).zfill(2))
            .replace("<!--__SCREEN_COUNT_TEXT__-->", str(len(entries)))
        )
        for marker, file in [
            ("HOME_CSS", "src/home/styles.css"),
            ("HOME_JS", "src/home/app.js"),
            ("RUNTIME", "src/shared/runtime.js"),
        ]:
            content = content.replace(f"/*__{marker}__*/", (ROOT / file).read_text())
        self.finish("home.html", content)
        shutil.copyfile(self.out / "home.html", self.out / "index.html")
