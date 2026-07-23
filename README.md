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

The Lite application is generated from full-app commit `bea1369` while retaining only the eight pages listed above. In addition to the categorized MTO ribbon, sticky placement, smooth Ctrl+wheel drawing zoom, bulk drawing registration, Clean Ghost Data, and corrected P2P elevation/tray-fill calculations, this release makes native dropdown options readable and corrects canvas fit, centering, panning, and scroll bounds at every zoom level. Imported SVG symbols now remain available when a browser workspace or project session is restored, reusable Material Configuration JSON includes its custom SVG definitions, and new items receive system-based tag prefixes such as SACS-001, PCCTV-001, PAGA-001, CT-001, DB-001, CDT-001, and PT-001. The Basic MTO manuals cover loading a PDF/image/DXF or session JSON, calibration, takeoff and metadata, Fit to Screen and panning, saving, register review, and final exports.

- Full standalone size: 8.87 MB
- Lite standalone size: 4.77 MB
- Reduction: 46.2%

All eight retained pages were browser-smoke-tested, including their embedded calculators and navigation routes.

<!-- LITE_PROVENANCE_START -->
## Full-to-Lite engine provenance

- Full source revision: `cd8160237a5c950ccbb1a39cda11e8a752d6760e`
- Full source file: `public/takeoff_tool.html`
- Full source SHA-256: `cc3cc7c0abf9e758058db9530e0854edb5ec0d83d22ae9521ce3f073917fa80c`
- Portable session schema: **2.4**
- CAD export marker: `TELECOM_MTO_CAD_EXPORT_V1`
- Generated artifacts: `Telecom_MTO_Lite_v2.html` and legacy `index.html`

Run `node scripts/update_lite_engine.mjs --full-root=<path-to-telecom-material-takeoff-tool>` to deliberately synchronize the embedded MTO engine. The script fails if the Full V2.4 CAD contract is absent.
<!-- LITE_PROVENANCE_END -->
