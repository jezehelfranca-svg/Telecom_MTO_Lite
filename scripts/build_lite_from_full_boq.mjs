import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const liteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argument = process.argv.find(value => value.startsWith('--full-root='));
if (!argument) {
    throw new Error('Pass --full-root=<path-to-corrected-full-repository>.');
}

const fullRoot = path.resolve(argument.slice('--full-root='.length));
const fullBoqPath = path.join(fullRoot, 'dist', 'BOQ_Offline_App.html');
const liteArtifacts = ['Telecom_MTO_Lite_v2.html', 'index.html'];

const AUTHORITATIVE_BASELINE_COMMIT = 'd2bd4736fc8f3ef1640f5bab74daf745cfa5ae49';
const FULL_CORRECTION_COMMIT = 'e6969728802a3ac3f4346cdbf1064ee6f9891f7a';
const FULL_ARTIFACT_SHA256 = 'e36a60eb0d4d9201641f48fbd4c011c114479e5a111a5d8964cb3e042b236410';
const FULL_ENGINE_SHA256 = '6f368cedcb661a4b1e45e9585895361cd902cedb8b66d213db5431a1eff0212a';
const PROVENANCE_START = '<!-- LITE_D2BD473_RELEASE_START';
const PROVENANCE_END = 'LITE_D2BD473_RELEASE_END -->';
const README_PROVENANCE_START = '<!-- LITE_PROVENANCE_START -->';
const README_PROVENANCE_END = '<!-- LITE_PROVENANCE_END -->';

const outerCadManual = `l.jsxs("div",{className:"space-y-6",children:[l.jsxs("div",{className:"bg-[#121b2d] border border-cyan-500/30 rounded-2xl p-6 shadow-lg space-y-4",children:[l.jsx("h3",{className:"text-sm font-extrabold text-white uppercase tracking-wider border-b border-[#24324f] pb-3",children:"Reliable AutoCAD / ZWCAD Placement Export"}),l.jsx("p",{className:"text-xs md:text-sm leading-relaxed text-slate-300",children:"The CAD package is an MTO-only overlay. It preserves point devices, symbol dimensions, labels, annotations, routes, route nodes, and actual vertical cable segments in native WCS coordinates; it never embeds the PDF, image, or source-DXF background."}),l.jsxs("ol",{className:"space-y-2 text-xs md:text-sm text-slate-300",children:[l.jsxs("li",{children:[l.jsx("strong",{children:"1. Prepare CAD:"})," use Model Space, UCS World, confirmed drawing units, and three widely spaced non-collinear reference points. Do not move the native drawing to a temporary origin."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"2. Load:"})," open the original ASCII DXF, PDF/image, or complete Project Session JSON. Snapshot-only sessions cannot be verified."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"3. Configure CAD Reference:"})," preserve source WCS for DXF. For PDF/image pages, enter A/B fit points and an independent C check point. The default tolerance is 10 mm or its exact unit equivalent."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"4. Map CAD Symbols:"})," select approved blocks where available. Supported SVG geometry becomes a self-contained block; unsupported text, filters, masks, images, and external references require a native block mapping. A generic dot is never substituted silently."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"5. Validate:"})," review fingerprint, units, page registration, residuals, WCS extents, counts, layers, blocks, symbol sizes, labels, routes, warnings, and blocking errors."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"6. Export:"})," download the DXF, audit CSV, manifest JSON, and CAD_IMPORT_README. Keep the ZIP and Project Session JSON together as the revision record."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"7. Attach in CAD:"})," open the DXF, save it as DWG, then XATTACH/XREF it as Overlay at insertion 0,0,0; X/Y/Z scale 1; rotation 0; Specify on screen disabled."]})]})]}),l.jsxs("div",{className:"bg-[#121b2d] border border-[#24324f] rounded-2xl p-6 shadow-lg space-y-4",children:[l.jsx("h3",{className:"text-sm font-extrabold text-white uppercase tracking-wider border-b border-[#24324f] pb-3",children:"Units, Control Points & Vertical Routes"}),l.jsxs("ul",{className:"space-y-2 text-xs md:text-sm text-slate-300",children:[l.jsx("li",{children:"DXF sessions use the exact inverse renderer transform and preserve source drawing units. Missing or unitless INSUNITS must be confirmed before verification."}),l.jsx("li",{children:"PDF/image registration permits translation, rotation, and uniform scale only. Mirrored or nonuniformly stretched scans must be corrected at the source."}),l.jsx("li",{children:"Use A and B far apart for the fit, and C away from the A-B line as the independent check. Repeat registration for every exported page."}),l.jsx("li",{children:"Autoroutes with elevation changes export as 3D polylines. Same-X/Y, different-Z vertices retain the true vertical cable portion; horizontal, vertical, and total lengths are repeated in the audit."})]}),l.jsxs("div",{className:"overflow-x-auto",children:[l.jsxs("table",{className:"w-full text-left text-xs text-slate-300",children:[l.jsx("thead",{children:l.jsxs("tr",{className:"border-b border-[#24324f] text-slate-400",children:[l.jsx("th",{className:"py-2 pr-4",children:"Drawing unit"}),l.jsx("th",{className:"py-2 pr-4",children:"10 mm tolerance"}),l.jsx("th",{className:"py-2",children:"Attach scale"})]})}),l.jsxs("tbody",{className:"divide-y divide-[#24324f]/60",children:[l.jsxs("tr",{children:[l.jsx("td",{className:"py-2 pr-4",children:"Millimetres"}),l.jsx("td",{className:"py-2 pr-4",children:"10 mm"}),l.jsx("td",{className:"py-2",children:"1"})]}),l.jsxs("tr",{children:[l.jsx("td",{className:"py-2 pr-4",children:"Metres"}),l.jsx("td",{className:"py-2 pr-4",children:"0.01 m"}),l.jsx("td",{className:"py-2",children:"1"})]}),l.jsxs("tr",{children:[l.jsx("td",{className:"py-2 pr-4",children:"Inches"}),l.jsx("td",{className:"py-2 pr-4",children:"0.3937008 in"}),l.jsx("td",{className:"py-2",children:"1"})]}),l.jsxs("tr",{children:[l.jsx("td",{className:"py-2 pr-4",children:"Feet"}),l.jsx("td",{className:"py-2 pr-4",children:"0.0328084 ft"}),l.jsx("td",{className:"py-2",children:"1"})]})]})]})]})]}),l.jsxs("div",{className:"bg-[#121b2d] border border-amber-500/25 rounded-2xl p-6 shadow-lg space-y-3",children:[l.jsx("h3",{className:"text-sm font-extrabold text-white uppercase tracking-wider",children:"Troubleshooting"}),l.jsxs("ul",{className:"space-y-2 text-xs md:text-sm text-slate-300",children:[l.jsxs("li",{children:[l.jsx("strong",{children:"Overlay shifted or rotated:"})," verify UCS World, source fingerprint, control-point coordinates, and page registration. Do not use MOVE, ALIGN, or SCALE to hide a failed registration."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"Wrong symbol size:"})," review the preflight model-space width/height, global symbol scale, per-item resizing, and confirmed drawing units."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"Imported SVG blocked:"})," map it to an approved CAD block or simplify it to supported paths, lines, polylines, polygons, rectangles, circles, ellipses, viewBox scaling, and nested transforms."]}),l.jsxs("li",{children:[l.jsx("strong",{children:"Session cannot verify:"})," reload the original drawing or a complete session containing the matching source and transform. A changed fingerprint intentionally invalidates verification."]})]})]})]})`;

function normalizedSha256(value) {
    return createHash('sha256').update(value.replace(/\r\n/g, '\n')).digest('hex');
}

function decodeTemplateLiteralBody(value) {
    let decoded = '';
    for (let index = 0; index < value.length; index += 1) {
        const current = value[index];
        if (current !== '\\') {
            decoded += current;
            continue;
        }
        const next = value[index + 1];
        if (next === '\\' || next === '`' || next === '/') {
            decoded += next;
            index += 1;
            continue;
        }
        if (next === '$' && value[index + 2] === '{') {
            decoded += '${';
            index += 2;
            continue;
        }
        throw new Error(`Unsupported Full BOQ template escape at offset ${index}.`);
    }
    return decoded;
}

function extractFullEngine(artifact) {
    const startToken = 'const aw=`';
    const endToken = '`,iw=';
    const start = artifact.indexOf(startToken);
    const end = artifact.indexOf(endToken, start + startToken.length);
    if (start < 0 || end < 0) {
        throw new Error('Could not locate the embedded MTO engine in Full BOQ_Offline_App.html.');
    }
    return decodeTemplateLiteralBody(artifact.slice(start + startToken.length, end));
}

function encodeTemplateLiteralBody(source) {
    return source
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${')
        .replace(/<\/script>/gi, '<\\/script>');
}

function embeddedMtoBounds(artifact) {
    const start = artifact.indexOf('`<!DOCTYPE html');
    if (start < 0) throw new Error('Lite artifact has no embedded MTO document.');
    let end = start + 1;
    while (end < artifact.length) {
        if (artifact[end] === '\\') {
            end += 2;
            continue;
        }
        if (artifact[end] === '`') break;
        end += 1;
    }
    if (end >= artifact.length) throw new Error('Lite embedded MTO template literal is not terminated.');
    return { start, end };
}

function replaceEmbeddedMto(artifact, engine) {
    const { start, end } = embeddedMtoBounds(artifact);
    return `${artifact.slice(0, start)}\`${encodeTemplateLiteralBody(engine)}\`${artifact.slice(end + 1)}`;
}

function addOuterCadManual(artifact) {
    if (artifact.includes('8. CAD Placement Export')
        && artifact.includes('Reliable AutoCAD / ZWCAD Placement Export')) {
        return artifact;
    }

    const manualStart = artifact.indexOf('Application User Manual');
    if (manualStart < 0) throw new Error('Could not locate the Lite App User Manual.');
    const manualPrefix = artifact.slice(Math.max(0, manualStart - 2200), manualStart);
    const factoryMatches = Array.from(
        manualPrefix.matchAll(/return ([A-Za-z_$][\w$]*)\.jsxs\("div",\{className:"flex-grow flex flex-col lg:flex-row/g)
    );
    const jsxFactory = factoryMatches.at(-1)?.[1];
    if (!jsxFactory) throw new Error('Could not detect the Lite manual JSX runtime.');
    const cadManualExpression = outerCadManual.replace(/\bl\./g, `${jsxFactory}.`);

    const tabsPattern = /\{id:"shortcuts",label:"Keyboard Shortcuts",icon:([A-Za-z_$][\w$]*)\}\];return/;
    const tabsMatch = tabsPattern.exec(artifact.slice(Math.max(0, manualStart - 3000)));
    if (!tabsMatch) throw new Error('Could not locate the Lite manual tabs.');
    const icon = tabsMatch[1];
    const tabsReplacement = `{id:"cad-placement",label:"8. CAD Placement Export",icon:${icon}},{id:"shortcuts",label:"Keyboard Shortcuts",icon:${icon}}];return`;
    artifact = artifact.replace(tabsPattern, tabsReplacement);

    const takeoffMatch = /,([A-Za-z_$][\w$]*)==="takeoffs"&&/.exec(artifact.slice(manualStart));
    if (!takeoffMatch) throw new Error('Could not locate the Lite manual content insertion point.');
    const insertion = manualStart + takeoffMatch.index;
    const stateVariable = takeoffMatch[1];
    return artifact.slice(0, insertion)
        + `,${stateVariable}==="cad-placement"&&${cadManualExpression}`
        + artifact.slice(insertion);
}

function addProvenance(artifact, fullRevision) {
    const provenance = [
        PROVENANCE_START,
        'authoritativeBaseline=d2bd4736fc8f3ef1640f5bab74daf745cfa5ae49',
        `fullCorrectionCommit=${FULL_CORRECTION_COMMIT}`,
        `fullSourceRevision=${fullRevision}`,
        'fullSourceFile=dist/BOQ_Offline_App.html',
        `fullArtifactSha256=${FULL_ARTIFACT_SHA256}`,
        `fullEngineSha256=${FULL_ENGINE_SHA256}`,
        'portableSession=2.4',
        'cadMarker=TELECOM_MTO_CAD_EXPORT_V1',
        'retainedPages=8',
        'manualMarker=LITE_D2BD473_CAD_MANUAL_V1',
        PROVENANCE_END
    ].join('\n');

    const existing = new RegExp(`${PROVENANCE_START}[\\s\\S]*?${PROVENANCE_END}`);
    if (existing.test(artifact)) return artifact.replace(existing, provenance);
    const scriptStart = artifact.indexOf('<script type="module"');
    if (scriptStart < 0) throw new Error('Could not locate the Lite application module.');
    return `${artifact.slice(0, scriptStart)}${provenance}\n${artifact.slice(scriptStart)}`;
}

async function gitRevision() {
    try {
        const { stdout } = await execFileAsync('git', ['-C', fullRoot, 'rev-parse', 'HEAD']);
        return stdout.trim();
    } catch {
        return 'uncommitted-local-source';
    }
}

const fullArtifact = await fs.readFile(fullBoqPath, 'utf8');
if (normalizedSha256(fullArtifact) !== FULL_ARTIFACT_SHA256) {
    throw new Error(
        'Full BOQ_Offline_App.html does not match the verified PR #15 correction artifact. '
        + 'Do not fall back to public/takeoff_tool.html.'
    );
}

const engine = extractFullEngine(fullArtifact);
if (normalizedSha256(engine) !== FULL_ENGINE_SHA256) {
    throw new Error('The embedded Full MTO engine does not match the verified PR #15 engine.');
}
for (const marker of [
    "const PROJECT_STATE_VERSION = '2.4'",
    'TELECOM_MTO_CAD_EXPORT_V1',
    'CAD_PLACEMENT_MANUAL_V1',
    '1. Configure CAD Reference',
    '2. Map CAD Symbols',
    '3. Validate CAD Placement',
    '4. Export CAD Package'
]) {
    if (!engine.includes(marker)) throw new Error(`Corrected Full engine is missing ${marker}.`);
}

const fullRevision = await gitRevision();
const generated = new Map();
for (const artifactName of liteArtifacts) {
    const artifactPath = path.join(liteRoot, artifactName);
    let artifact = await fs.readFile(artifactPath, 'utf8');
    artifact = replaceEmbeddedMto(artifact, engine);
    artifact = addOuterCadManual(artifact);
    artifact = addProvenance(artifact, fullRevision);
    await fs.writeFile(artifactPath, artifact, 'utf8');
    generated.set(artifactName, artifact);
}

const fullSizeMb = Buffer.byteLength(fullArtifact) / (1024 * 1024);
const liteSizeMb = Buffer.byteLength(generated.get('Telecom_MTO_Lite_v2.html')) / (1024 * 1024);
const reduction = (1 - liteSizeMb / fullSizeMb) * 100;
const provenance = [
    README_PROVENANCE_START,
    '## Full-to-Lite engine provenance',
    '',
    `- Authoritative Full baseline: \`${AUTHORITATIVE_BASELINE_COMMIT}\``,
    `- Corrected Full PR commit: \`${FULL_CORRECTION_COMMIT}\``,
    `- Full source revision used: \`${fullRevision}\``,
    '- Full source file: `dist/BOQ_Offline_App.html`',
    `- Full artifact normalized SHA-256: \`${FULL_ARTIFACT_SHA256}\``,
    `- Embedded Full/Lite engine normalized SHA-256: \`${FULL_ENGINE_SHA256}\``,
    '- Portable session schema: **2.4**',
    '- CAD export marker: `TELECOM_MTO_CAD_EXPORT_V1`',
    '- Retained Lite pages: **8**',
    '- Generated artifacts: `Telecom_MTO_Lite_v2.html` and legacy `index.html`',
    '',
    `Run \`node scripts/build_lite_from_full_boq.mjs --full-root=<path-to-corrected-full-repository>\` to deliberately synchronize the embedded MTO engine. The build fails unless the Full \`dist/BOQ_Offline_App.html\` and embedded engine match the recorded correction hashes.`,
    README_PROVENANCE_END
].join('\n');

const buildInformation = [
    '## Build information',
    '',
    `The Lite application retains only the eight pages listed above. Its embedded MTO engine is byte-for-byte equivalent to the verified engine extracted from the corrected Full \`dist/BOQ_Offline_App.html\`, whose authoritative basis is commit \`${AUTHORITATIVE_BASELINE_COMMIT.slice(0, 7)}\`. The generator does not read \`public/takeoff_tool.html\`.`,
    '',
    'The release includes the complete Basic MTO workflow, persistent imported SVG symbols, system-based tag prefixes, movable/resizable labels and callouts, CAD registration, symbol mapping, preflight validation, AC1027 DXF/audit export, explicit 3D vertical route segments, and the AutoCAD/ZWCAD import manual.',
    '',
    `- Full standalone size: ${fullSizeMb.toFixed(2)} MB`,
    `- Lite standalone size: ${liteSizeMb.toFixed(2)} MB`,
    `- Reduction: ${reduction.toFixed(1)}%`,
    '',
    'All eight retained pages and both downloadable HTML filenames are covered by the release contract and real-browser smoke test.',
    '',
    provenance
].join('\n');

const readmePath = path.join(liteRoot, 'README.md');
let readme = (await fs.readFile(readmePath, 'utf8')).replace(/â€”/g, '—');
const buildPattern = new RegExp(`## Build information[\\s\\S]*?${README_PROVENANCE_END}`);
if (!buildPattern.test(readme)) throw new Error('Could not locate the existing Lite build/provenance section.');
readme = readme.replace(buildPattern, buildInformation);
await fs.writeFile(readmePath, `${readme.trim()}\n`, 'utf8');

console.log(`Generated ${liteArtifacts.join(', ')} from ${fullBoqPath}.`);
console.log(`Authoritative baseline: ${AUTHORITATIVE_BASELINE_COMMIT}`);
console.log(`Full source revision: ${fullRevision}`);
console.log(`Full/Lite engine SHA-256: ${FULL_ENGINE_SHA256}`);
