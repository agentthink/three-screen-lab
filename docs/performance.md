# Wind rendering measurement

Measured on 2026-10-20 in the same desktop in-app Chromium browser, 1280×720, device scale factor 1, default G1029 camera (`yaw=-0.720`, distance `19.80`), running, wire/explosion/flow off. These are renderer counters, not a claim about every device's frame rate.

| Counter                       |  Before |             After |
| ----------------------------- | ------: | ----------------: |
| Draw calls per rendered frame |     493 |               131 |
| GPU geometry objects          |     379 |                92 |
| Rendered triangles            | 114,368 |           114,356 |
| Instanced repeated parts      |       0 | 381 in 20 batches |

Shared box/cylinder/ring geometries and parent-local instancing reduce repeated submissions for bolts, fins and support details. The triangle count is nearly unchanged; the tiny difference comes from replacing the reference monogram with original branding. Glass, selected parts, outline children, animated group transforms and exploded assembly remain separate.

Reproduce by building and opening `wind.html` in a fixed viewport, waiting for `#wind-3d-canvas[data-ready=true]`, and reading its `data-draw-calls`, `data-geometries`, `data-triangles`, `data-instance-batches` and `data-instanced-parts`. Counters are exposed for diagnostics, not as product UI. Wire and flow modes naturally produce different counts. The browser test guards against a default-view regression above 300 calls, with software WebGL in CI.

Use a consistent camera, viewport, model state and browser when comparing. FPS varies with GPU, thermal state and tab visibility; no cross-device FPS improvement has been asserted. Factory/globe quality tiers, context restoration and visual golden baselines are still planned.
