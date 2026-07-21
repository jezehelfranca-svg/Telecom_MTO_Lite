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

The Lite application is generated from full-app commit `ae74fef` while retaining only the eight pages listed above. This release includes the categorized MTO ribbon, sticky placement, smooth Ctrl+wheel drawing zoom, bulk drawing registration, Clean Ghost Data, and corrected P2P elevation/tray-fill calculations. The Basic MTO manuals cover loading a PDF/image/DXF or session JSON, calibration, takeoff and metadata, saving, register review, and final exports.

- Full standalone size: 8.84 MB
- Lite standalone size: 4.75 MB
- Reduction: 46.3%

All eight retained pages were browser-smoke-tested, including their embedded calculators and navigation routes.
