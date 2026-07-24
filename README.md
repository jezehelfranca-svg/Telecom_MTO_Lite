# Telecom MTO Lite

A stripped-down, single-file edition of the HEC Telecom Material Takeoff and BOQ application.

## Available versions

- `index.html` — legacy Lite release retained for compatibility.
- [`Telecom_MTO_Lite_v2.html`](./Telecom_MTO_Lite_v2.html) — current Lite release with the advanced MTO workflow and expanded end-to-end manuals.

Download the required HTML file and open it directly in a modern desktop browser. Use `Telecom_MTO_Lite_v2.html` for new work.

## Included pages

- Material Takeoff (MTO)
- MTO Data Register
- Deliverable Builder
- BOQ Master Register
- BOQ Database
- Cable Tray Sizing
- Duct Bank Sizing
- App User Manual

Material Takeoff is the default page. Its data exchange with the cable-tray and duct-bank sizing tools remains enabled.

## Run locally

Download `Telecom_MTO_Lite_v2.html` and open it directly in a modern desktop browser. No installation or build step is required. The legacy `index.html` remains available only for compatibility.

For HTTP-based testing:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Build information

The Lite application retains only the eight pages listed above. Its embedded MTO engine is byte-for-byte equivalent to the verified engine extracted from the corrected Full `dist/BOQ_Offline_App.html`, whose authoritative basis is commit `d2bd473`. The generator does not read `public/takeoff_tool.html`.

The release includes the complete Basic MTO workflow, persistent imported SVG symbols, system-based tag prefixes, movable/resizable labels and callouts, CAD registration, symbol mapping, preflight validation, AC1027 DXF/audit export, explicit 3D vertical route segments, and the AutoCAD/ZWCAD import manual.

- Full standalone size: 8.67 MB
- Lite standalone size: 4.78 MB
- Reduction: 44.8%

All eight retained pages and both downloadable HTML filenames are covered by the release contract and real-browser smoke test.

<!-- LITE_PROVENANCE_START -->
## Full-to-Lite engine provenance

- Authoritative Full baseline: `d2bd4736fc8f3ef1640f5bab74daf745cfa5ae49`
- Corrected Full PR commit: `e6969728802a3ac3f4346cdbf1064ee6f9891f7a`
- Full source revision used: `e6969728802a3ac3f4346cdbf1064ee6f9891f7a`
- Full source file: `dist/BOQ_Offline_App.html`
- Full artifact normalized SHA-256: `e36a60eb0d4d9201641f48fbd4c011c114479e5a111a5d8964cb3e042b236410`
- Embedded Full/Lite engine normalized SHA-256: `6f368cedcb661a4b1e45e9585895361cd902cedb8b66d213db5431a1eff0212a`
- Portable session schema: **2.4**
- CAD export marker: `TELECOM_MTO_CAD_EXPORT_V1`
- Retained Lite pages: **8**
- Generated artifacts: `Telecom_MTO_Lite_v2.html` and legacy `index.html`

Run `node scripts/build_lite_from_full_boq.mjs --full-root=<path-to-corrected-full-repository>` to deliberately synchronize the embedded MTO engine. The build fails unless the Full `dist/BOQ_Offline_App.html` and embedded engine match the recorded correction hashes.
<!-- LITE_PROVENANCE_END -->
