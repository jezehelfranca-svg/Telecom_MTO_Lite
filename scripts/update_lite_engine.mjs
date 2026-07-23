import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const liteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argument = process.argv.find(value => value.startsWith('--full-root='));
const fullRoot = path.resolve(argument ? argument.slice('--full-root='.length) : path.join(liteRoot, '..'));
const fullMtoPath = path.join(fullRoot, 'public', 'takeoff_tool.html');
const cadModulePath = path.join(fullRoot, 'public', 'cad-placement-export.js');
const jsZipPath = path.join(fullRoot, 'node_modules', 'jszip', 'dist', 'jszip.min.js');
const liteArtifacts = ['Telecom_MTO_Lite_v2.html', 'index.html'];
const provenanceStart = '<!-- LITE_PROVENANCE_START -->';
const provenanceEnd = '<!-- LITE_PROVENANCE_END -->';

const cadManual = `                    <!-- CAD_PLACEMENT_MANUAL_V1 -->
                    <section class="manual-section">
                        <h4><i class="fa-solid fa-compass-drafting"></i> CAD Placement Export</h4>
                        <ol>
                            <li>Load the original DXF, PDF, image, or complete session JSON. A canvas-only snapshot cannot be verified.</li>
                            <li>Choose Configure CAD Reference. Preserve source WCS for DXF; for PDF/image pick widely spaced A/B fit points and a non-collinear C check point.</li>
                            <li>Confirm the native drawing unit. PDF/image registration must pass the project tolerance (default 10 mm).</li>
                            <li>Choose Map CAD Symbols. Built-ins become reusable CAD blocks; unsupported SVGs require an approved CAD block mapping.</li>
                            <li>Run Validate CAD Placement and export only when the result is Verified.</li>
                            <li>Open the DXF, save it as DWG, then attach it to the native drawing in Model Space at WCS 0,0,0; scale 1; rotation 0.</li>
                        </ol>
                    </section>
                    <section class="manual-section">
                        <h4><i class="fa-solid fa-cube"></i> CAD Geometry &amp; Vertical Routes</h4>
                        <ul>
                            <li>The CAD package contains MTO geometry only; it never embeds the PDF, image, or source-DXF background.</li>
                            <li>Point devices export as BLOCK/INSERT entities. Tags and moved labels export as MTEXT at saved WCS locations.</li>
                            <li>Same-X/Y, different-Z route vertices export as true 3D vertical cable segments. Manual allowance remains an audit quantity.</li>
                            <li>Use the MTO-QA crosses with ID or DIST. Do not MOVE, SCALE, or ALIGN a failed overlay in CAD.</li>
                        </ul>
                    </section>
`;

function sha256(value) {
    return createHash('sha256').update(value).digest('hex');
}

function inlineClassicScript(source, sourcePath) {
    return '<script data-inlined-from="' + sourcePath + '">\n'
        + source.split('</script').join('<' + String.fromCharCode(92) + '/script') + '\n</script>';
}

function addCadManual(source) {
    if (source.includes('CAD_PLACEMENT_MANUAL_V1')) return source;
    const shortcutHeading = '<h4><i class="fa-solid fa-keyboard"></i> Shortcuts</h4>';
    const headingIndex = source.indexOf(shortcutHeading);
    if (headingIndex < 0) throw new Error('Could not locate the embedded MTO manual shortcut section.');
    const sectionIndex = source.lastIndexOf('<section class="manual-section">', headingIndex);
    if (sectionIndex < 0) throw new Error('Could not locate the embedded MTO manual section boundary.');
    return `${source.slice(0, sectionIndex)}${cadManual}${source.slice(sectionIndex)}`;
}

function escapeTemplateLiteral(source) {
    return source
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
}

function replaceEmbeddedMto(artifact, embeddedMto) {
    const sourceStart = artifact.indexOf('`<!DOCTYPE html');
    if (sourceStart < 0) throw new Error('Lite artifact has no embedded MTO document.');
    let cursor = sourceStart + 1;
    while (cursor < artifact.length) {
        if (artifact[cursor] === '\\') {
            cursor += 2;
            continue;
        }
        if (artifact[cursor] === '`') break;
        cursor += 1;
    }
    if (cursor >= artifact.length) throw new Error('Lite embedded MTO template literal is not terminated.');
    return `${artifact.slice(0, sourceStart)}\`${escapeTemplateLiteral(embeddedMto)}\`${artifact.slice(cursor + 1)}`;
}

async function gitRevision() {
    try {
        const { stdout } = await execFileAsync('git', ['-C', fullRoot, 'rev-parse', 'HEAD']);
        return stdout.trim();
    } catch {
        return 'uncommitted-local-source';
    }
}

const [mtoSource, cadModule, jsZip] = await Promise.all([
    fs.readFile(fullMtoPath, 'utf8'),
    fs.readFile(cadModulePath, 'utf8'),
    fs.readFile(jsZipPath, 'utf8')
]);
const fullRevision = await gitRevision();
const sourceHash = sha256(mtoSource);
let embeddedMto = mtoSource
    .replace('<script src="./vendor/jszip.min.js"></script>', inlineClassicScript(jsZip, './vendor/jszip.min.js'))
    .replace('<script src="./cad-placement-export.js"></script>', inlineClassicScript(cadModule, './cad-placement-export.js'));
if (!embeddedMto.includes('TELECOM_MTO_CAD_EXPORT_V1') || !embeddedMto.includes("const PROJECT_STATE_VERSION = '2.4'")) {
    throw new Error('Full MTO source is missing the V2.4 CAD export contract.');
}
embeddedMto = addCadManual(embeddedMto)
    .replace('<head>', `<head>\n    <!-- LITE_ENGINE_PROVENANCE: fullRevision=${fullRevision}; fullSourceSha256=${sourceHash}; session=2.4; cad=TELECOM_MTO_CAD_EXPORT_V1 -->`)
    .replace(/[ \t]+(?=\r?$)/gm, '')
    .replace(/\r\n/g, '\n');

for (const artifactName of liteArtifacts) {
    const artifactPath = path.join(liteRoot, artifactName);
    const artifact = await fs.readFile(artifactPath, 'utf8');
    const updated = replaceEmbeddedMto(artifact, embeddedMto);
    if (!updated.includes('CAD_PLACEMENT_MANUAL_V1') || !updated.includes('TELECOM_MTO_CAD_EXPORT_V1')) {
        throw new Error(`${artifactName} did not receive the CAD engine and manual.`);
    }
    await fs.writeFile(artifactPath, updated, 'utf8');
}

const provenance = [
    provenanceStart,
    '## Full-to-Lite engine provenance',
    '',
    `- Full source revision: \`${fullRevision}\``,
    '- Full source file: `public/takeoff_tool.html`',
    `- Full source SHA-256: \`${sourceHash}\``,
    '- Portable session schema: **2.4**',
    '- CAD export marker: `TELECOM_MTO_CAD_EXPORT_V1`',
    '- Generated artifacts: `Telecom_MTO_Lite_v2.html` and legacy `index.html`',
    '',
    'Run `node scripts/update_lite_engine.mjs --full-root=<path-to-telecom-material-takeoff-tool>` to deliberately synchronize the embedded MTO engine. The script fails if the Full V2.4 CAD contract is absent.',
    provenanceEnd
].join('\n');
const readmePath = path.join(liteRoot, 'README.md');
const readme = await fs.readFile(readmePath, 'utf8');
const provenancePattern = new RegExp(`${provenanceStart}[\\s\\S]*?${provenanceEnd}`);
await fs.writeFile(readmePath, provenancePattern.test(readme)
    ? readme.replace(provenancePattern, provenance)
    : `${readme.trim()}\n\n${provenance}\n`, 'utf8');

console.log(`Updated ${liteArtifacts.join(', ')} from Full ${fullRevision} (${sourceHash}).`);
