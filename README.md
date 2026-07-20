# Telecom MTO Lite

A stripped-down, single-file edition of the HEC Telecom Material Takeoff and BOQ application.

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

Download `index.html` and open it directly in a modern desktop browser. No installation or build step is required.

For HTTP-based testing:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Build information

The lite application is generated from the full standalone Telecom MTO bundle. Unrelated dashboards, engineering manuals, workflows, diagrams, gland sizing, document references, and cloud-sync routes are excluded.

- Full standalone size: 7.83 MiB
- Lite standalone size: 4.50 MiB
- Reduction: 42.5%

All eight retained pages were browser-smoke-tested, including their embedded calculators and navigation routes.
