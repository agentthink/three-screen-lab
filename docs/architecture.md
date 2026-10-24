# Architecture

## Source → web / offline

`config/screens.json` is the validated registry. Its schema describes the required fields; Python validation also checks duplicate identifiers, dimensions, preview paths and the actual source template. Home uses one card template for every registered screen. `renderer: generic` supports new screens without changing the builder; special renderers supply the existing scene-specific map/texture bindings.

`src/screens/<id>/template.html` contains DOM and explicit build markers. `styles.css`, `app.js`, `model.js` or `globe.js` are the editable implementation. Inspection also has `map-depth.js`. Vendor libraries remain local in `assets/vendor/`; do not format or edit their minified contents.

`scripts/buildlib.py` resolves only project-local resources, compacts geographic coordinates, caches derived imagery under `.local/cache/`, validates unresolved markers, and assembles each page. Web output extracts inline scripts and styles into `_assets/<content hash>.*`, keeping script order. Identical Three.js and D3 code is reused between pages. A changed input produces a new resource URL. Standalone output embeds the same resources, including images, into each HTML file.

`dist/` is generated and ignored by Git. A full build removes files named by the previous build manifest, then writes a fresh manifest with SHA-256 checksums. It does not recursively delete arbitrary output directories. Offline exports still use HTML for linked pages, so download the whole `standalone/` directory for cross-page navigation. Web URLs keep the original `home.html`, `wind.html`, `factory.html`, `population.html` and `inspection.html` paths.

## Rendering and lifecycle

The wind scene separates DOM charts, deterministic demo data (`data.js`), procedural geometry and material shaders (`model.js`). Opaque static leaf parts sharing geometry/material under the same parent become `InstancedMesh` batches. Glass, selectable parts and objects with children remain separate; animated parent groups and exploded transforms still work. Hidden source meshes retain the transforms used by the optional wire view.

`VizLabRuntime.mountStage()` fits fixed design coordinates into the viewport and returns a cleanup handle. `onDispose()` runs registered cleanup on non-persisted `pagehide`. Wind disposal stops its animation, disconnects observers and releases unique geometries/materials and the environment render target. Other scenes retain their original adaptation code; migrating their lifecycles is a planned incremental improvement.

Home uses per-card registry dimensions when fitting iframes. Starting another preview, filtering, leaving the document or moving the card outside the view removes the iframe and its document. It includes a 20-second loading timeout and screenshot fallback. Home remains useful without activating any WebGL scene.

## Data and publication

All data is illustrative and deterministic. The wind data adapter is the first extraction boundary; other scenes still own their local fixtures. Add an adapter instead of embedding a real service or credentials into renderer code. Treat external text as untrusted; use `textContent` or escaped templates.

CI runs for pull requests and pushes to `master`, with read-only repository access. A successful default-branch build uploads a Pages artifact; the separate deployment job has only Pages and OIDC write permissions. Preview/build artifacts are available for review. Release automation, GPU-independent visual baselines, and a cleared-asset distribution remain roadmap items.

## Owner-authorized Astra cases

Agriculture, industry and park share observatory.js, observatory-scene.js, observatory.css and astra-geometry.js; screen-specific data, actions, palettes and procedural models remain under each screen directory. The builder resolves these optional markers only when a template uses them. No Vue runtime or new dependency is introduced. Detailed interaction, responsive, permission and lifecycle contracts are documented in [Astra cases](astra-cases.md).
