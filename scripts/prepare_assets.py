"""Rebuild cleared map/texture assets from checksum-pinned Natural Earth archives.

Optional: Python 3.12+, requirements-assets.txt and curl. Normal builds use the
committed derivatives and never contact these providers. No old project map or
texture is an input to this pipeline.
"""

from pathlib import Path
import argparse
import hashlib
import io
import json
import math
import subprocess
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import shapefile
from shapely import make_valid, coverage_is_valid, coverage_simplify
from shapely.geometry import MultiPolygon, Polygon, shape, mapping
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / "config/asset-sources.json").read_text())["sources"]
# Stable demo identifiers/labels, rather than copying coordinates from the old provider.
REGIONS = [
    ("北京市", 110000),
    ("天津市", 120000),
    ("河北省", 130000),
    ("山西省", 140000),
    ("内蒙古自治区", 150000),
    ("辽宁省", 210000),
    ("吉林省", 220000),
    ("黑龙江省", 230000),
    ("上海市", 310000),
    ("江苏省", 320000),
    ("浙江省", 330000),
    ("安徽省", 340000),
    ("福建省", 350000),
    ("江西省", 360000),
    ("山东省", 370000),
    ("河南省", 410000),
    ("湖北省", 420000),
    ("湖南省", 430000),
    ("广东省", 440000),
    ("广西壮族自治区", 450000),
    ("海南省", 460000),
    ("重庆市", 500000),
    ("四川省", 510000),
    ("贵州省", 520000),
    ("云南省", 530000),
    ("西藏自治区", 540000),
    ("陕西省", 610000),
    ("甘肃省", 620000),
    ("青海省", 630000),
    ("宁夏回族自治区", 640000),
    ("新疆维吾尔自治区", 650000),
    ("台湾省", 710000),
    ("香港特别行政区", 810000),
    ("澳门特别行政区", 820000),
]
EXTENT = {
    "xmin": 2666594.4689710406,
    "ymin": -780454.0691041537,
    "xmax": 20675451.880735748,
    "ymax": 10306248.775013495,
    "spatialReference": {"wkid": 3857},
}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def acquire(folder, offline=False):
    folder.mkdir(parents=True, exist_ok=True)
    for source in SOURCES:
        target = folder / (source["id"] + ".zip")
        if not target.exists():
            if offline:
                raise FileNotFoundError(f"Missing pinned archive: {target}")
            partial = target.with_suffix(".partial")
            subprocess.run(
                [
                    "curl",
                    "--fail",
                    "--location",
                    "--silent",
                    "--show-error",
                    "--retry",
                    "2",
                    "--connect-timeout",
                    "15",
                    "--max-time",
                    "240",
                    "--output",
                    str(partial),
                    source["url"],
                ],
                check=True,
            )
            if sha256(partial) != source["sha256"]:
                partial.unlink()
                raise ValueError(
                    f'Upstream archive changed: {source["id"]}; review before updating its hash'
                )
            partial.replace(target)
        if sha256(target) != source["sha256"]:
            raise ValueError(f'Archive checksum mismatch: {source["id"]}')


def records(folder, key):
    with zipfile.ZipFile(folder / (key + ".zip")) as archive:
        base = next(n[:-4] for n in archive.namelist() if n.endswith(".shp"))
        with shapefile.Reader(
            **{
                suffix: io.BytesIO(archive.read(base + "." + suffix))
                for suffix in ["shp", "shx", "dbf"]
            },
            encoding="utf-8",
        ) as reader:
            for row in reader.iterShapeRecords():
                yield row.record.as_dict(), shape(row.shape.__geo_interface__)


def raster(folder, key):
    with zipfile.ZipFile(folder / (key + ".zip")) as archive:
        name = next(n for n in archive.namelist() if n.lower().endswith(".tif"))
        with Image.open(io.BytesIO(archive.read(name))) as image:
            return image.copy()


def polygons(geometry):
    if geometry.geom_type == "Polygon":
        return [geometry]
    return (
        [p for g in geometry.geoms for p in polygons(g)]
        if hasattr(geometry, "geoms")
        else []
    )


def cleaned(geometry):
    return MultiPolygon(
        [orient(p, sign=-1) for p in polygons(make_valid(geometry)) if p.area > 1e-8]
    )


def rounded(value):
    if isinstance(value, (tuple, list)):
        return [rounded(v) for v in value]
    return round(value, 5) if isinstance(value, float) else value


def feature(geometry, properties):
    geometry = cleaned(geometry)
    assert geometry.is_valid and not geometry.is_empty
    return {
        "type": "Feature",
        "properties": properties,
        "geometry": rounded(mapping(geometry)),
    }


def write_geo(filename, features, inputs):
    value = {
        "type": "FeatureCollection",
        "source": {
            "provider": "Natural Earth",
            "license": "Public domain",
            "inputs": inputs,
            "processing": "scripts/prepare_assets.py",
        },
        "features": features,
    }
    (ROOT / "assets/geo" / filename).write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"
    )


def boundaries(folder):
    grouped = {name: [] for name, _ in REGIONS}
    for props, geometry in records(folder, "admin1"):
        code = props.get("adm0_a3")
        name = {"TWN": "台湾省", "HKG": "香港特别行政区", "MAC": "澳门特别行政区"}.get(
            code
        )
        if code == "CHN":
            name = (
                "海南省"
                if props.get("name") == "Paracel Islands"
                else props.get("name_zh")
            )
        if name in grouped:
            grouped[name].append(geometry)
    regions = [cleaned(unary_union(grouped[name])) for name, _ in REGIONS]
    if any(not grouped[name] for name, _ in REGIONS):
        raise ValueError("Missing province in upstream data")
    if not coverage_is_valid(regions):
        raise ValueError("Province boundaries must form a valid shared-edge coverage")
    # Less than one display pixel at either design scale; shared borders stay identical.
    regions = [cleaned(g) for g in coverage_simplify(regions, 0.018)]
    features = []
    for (name, code), merged in zip(REGIONS, regions):
        center = max(polygons(merged), key=lambda p: p.area).representative_point()
        features.append(
            feature(
                merged,
                {
                    "name": name,
                    "adcode": code,
                    "center": [round(center.x, 5), round(center.y, 5)],
                },
            )
        )
    write_geo("china.json", features, ["admin1"])
    write_geo(
        "china-outline.json",
        [feature(unary_union(regions), {"name": "中华人民共和国", "adcode": 100000})],
        ["admin1"],
    )
    write_geo(
        "countries.json",
        [feature(g, {"name": p["NAME"]}) for p, g in records(folder, "countries")],
        ["countries"],
    )
    print(
        "Rebuilt 34 selectable regions, dissolved outline and world background",
        flush=True,
    )


def land_mask(folder, size):
    image = Image.new("L", size, 0)
    draw = ImageDraw.Draw(image)
    width, height = size
    for _, geometry in records(folder, "land"):
        for poly in polygons(geometry):
            project = lambda ring: [
                ((x + 180) / 360 * width, (90 - y) / 180 * height)
                for x, y in ring.coords
            ]
            draw.polygon(project(poly.exterior), fill=255)
            for hole in poly.interiors:
                draw.polygon(project(hole), fill=0)
    return image


def sample_world(image, longitudes, latitudes):
    """Bilinear equirectangular sampling; longitude wraps at the dateline."""
    source = np.asarray(image, dtype=np.float32)
    height, width = source.shape[:2]
    x = ((longitudes + 180) / 360 * width - 0.5) % width
    y = np.clip((90 - latitudes) / 180 * height - 0.5, 0, height - 1)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    dx, dy = x - x0, y - y0
    # All uses sample greyscale inputs; preserve row/column broadcasting.
    top = (
        source[y0[:, None], x0[None, :]] * (1 - dx)[None, :]
        + source[y0[:, None], ((x0 + 1) % width)[None, :]] * dx[None, :]
    )
    bottom = (
        source[np.minimum(y0 + 1, height - 1)[:, None], x0[None, :]] * (1 - dx)[None, :]
        + source[np.minimum(y0 + 1, height - 1)[:, None], ((x0 + 1) % width)[None, :]]
        * dx[None, :]
    )
    return top * (1 - dy)[:, None] + bottom * dy[:, None]


def textures(folder):
    size = (2048, 1024)
    mask = land_mask(folder, (4096, 2048))
    mask_small = (
        np.asarray(mask.resize(size, Image.Resampling.LANCZOS), dtype=np.float32) / 255
    )
    shade = raster(folder, "relief").convert("L")
    cover = raster(folder, "day").convert("RGB").resize(size, Image.Resampling.LANCZOS)
    colour = np.asarray(cover, dtype=np.float32)
    # Match the dark ocean and natural land luminance expected by the existing shaders.
    albedo = np.clip((colour - 194) * 3.5 + 6, 4, 246)
    rgb = albedo * mask_small[:, :, None] + np.array([12, 30, 48]) * (
        1 - mask_small[:, :, None]
    )
    Image.fromarray(np.uint8(np.clip(rgb, 0, 255))).save(
        ROOT / "assets/textures/earth-day.jpg", quality=94, subsampling=0
    )
    heightfield = (
        np.asarray(shade.resize(size, Image.Resampling.LANCZOS), dtype=np.float32) / 255
    )
    gy, gx = np.gradient(heightfield)
    normals = np.stack((-gx * 9, gy * 9, np.ones_like(gx)), axis=-1)
    normals /= np.linalg.norm(normals, axis=-1, keepdims=True)
    Image.fromarray(np.uint8(np.clip((normals * 0.5 + 0.5) * 255, 0, 255))).save(
        ROOT / "assets/textures/earth-normal.jpg", quality=96, subsampling=0
    )
    # Illustrative city emission from open place locations; not measured satellite lights.
    points = Image.new("L", size, 0)
    draw = ImageDraw.Draw(points)
    for props, geometry in records(folder, "places"):
        x = (geometry.x + 180) / 360 * size[0]
        y = (90 - geometry.y) / 180 * size[1]
        population = max(0, props.get("pop_max") or 0)
        strength = int(min(245, 50 + math.log10(max(1000, population)) * 23))
        radius = 0.35 + max(0, math.log10(max(1000, population)) - 4.4) * 0.48
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=strength)
    core = np.asarray(points, dtype=np.float32)
    glow = np.asarray(points.filter(ImageFilter.GaussianBlur(1.8)), dtype=np.float32)
    emission = np.clip(core * 0.65 + glow * 2.0, 0, 255) * mask_small
    night = np.stack((emission * 0.68, emission * 0.86, emission), axis=-1)
    Image.fromarray(np.uint8(night)).save(
        ROOT / "assets/textures/earth-night.png", optimize=True
    )
    width, height = 1920, 1182
    radius = 6378137
    xs = (
        np.linspace(EXTENT["xmin"], EXTENT["xmax"], width, endpoint=False)
        + (EXTENT["xmax"] - EXTENT["xmin"]) / width / 2
    )
    ys = (
        np.linspace(EXTENT["ymax"], EXTENT["ymin"], height, endpoint=False)
        - (EXTENT["ymax"] - EXTENT["ymin"]) / height / 2
    )
    lon = xs / radius * 180 / np.pi
    lat = np.arctan(np.sinh(ys / radius)) * 180 / np.pi
    gray = sample_world(shade, lon, lat)
    land = sample_world(mask, lon, lat) / 255
    # A light neutral relief input is recoloured by buildlib. Ocean remains identifiable.
    tone = np.clip(225 + (gray - 200) * 0.60, 80, 252)
    terrain = np.repeat(tone[:, :, None], 3, axis=-1)
    water = np.array([122, 173, 205])
    terrain = terrain * land[:, :, None] + water * (1 - land[:, :, None])
    Image.fromarray(np.uint8(terrain)).save(
        ROOT / "assets/textures/relief.png", optimize=True
    )
    metadata = {
        "source": "Natural Earth SR_50M",
        "license": "Public domain",
        "inputs": ["relief", "land"],
        "generator": "scripts/prepare_assets.py",
        "width": width,
        "height": height,
        "extent": EXTENT,
    }
    (ROOT / "assets/geo/relief-metadata.json").write_text(
        json.dumps(metadata, indent=2) + "\n"
    )
    print(
        "Rebuilt day, illustrative city light, normal and Mercator relief textures",
        flush=True,
    )


def grid():
    # Original periodic mathematical texture; no sampled/generated reference image.
    size = 1024
    coord = np.arange(size, dtype=float)
    distance = np.minimum(coord % 128, 128 - coord % 128)
    line = np.clip(1 - distance / 1.8, 0, 1)
    values = np.maximum(line[:, None], line[None, :])
    Image.fromarray(np.uint8(values * 255)).save(
        ROOT / "assets/textures/factory-grid.png", optimize=True
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=ROOT / ".local/asset-sources")
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    acquire(args.cache, args.offline)
    boundaries(args.cache)
    textures(args.cache)
    grid()
    manifest_path = ROOT / "assets/manifest.json"
    manifest = json.loads(manifest_path.read_text())
    for row in manifest["assets"]:
        if row["path"].startswith(("assets/geo/", "assets/textures/")):
            row["sha256"] = sha256(ROOT / row["path"])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
