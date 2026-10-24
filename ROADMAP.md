# Roadmap

## Landed in the open-source foundation

- Editable sources for all four screens; registry-driven Home and screen generator.
- Pinned dependencies, local build, web resources with content hashes and separate offline exports.
- MIT for original code, separate asset inventory and third-party notices.
- Contributor guide, issue forms, PR template, CI and Pages deployment workflow.
- Wind shared geometry and instanced repeated parts, with recorded draw-call comparison.

## Next: make small contributions easy

- Keyboard parity for chart tooltips and map hover information.
- English explanations of factory and globe rendering stages.
- Deterministic visual baselines across defined Chromium/GPU settings.
- Data adapters for factory, population and inspection, following the wind adapter.
- Capture up-to-date narrow-screen examples and document their limitations.

## Next: assets and runtime

- Completed: replace DataV boundaries, Esri relief and example Earth textures with checksum-pinned public-domain Natural Earth derivatives, and replace the generated grid with original MIT procedural material. Continue reviewing newly added assets individually.
- Profile factory/globe on modest devices; introduce measured quality presets and context-loss recovery.
- Add browser coverage beyond Chromium and reliable visual regression thresholds.
- Design a contribution path for reusable panels without forcing every scene into one framework.

## Later, based on contributor demand

External live-data adapters, reusable material library, additional screen themes, release artifacts and an example integration backend. There is no fixed schedule; discuss scope in an issue before a large implementation.
