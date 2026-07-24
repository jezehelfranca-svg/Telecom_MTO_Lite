import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const liteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = ['Telecom_MTO_Lite_v2.html', 'index.html'];
const EXPECTED_ENGINE_SHA256 = '6f368cedcb661a4b1e45e9585895361cd902cedb8b66d213db5431a1eff0212a';
const EXPECTED_PAGES = [
    ['takeoff', 'Material Takeoff (MTO)'],
    ['mto-register', 'MTO Data Register'],
    ['deliverables', 'Deliverable Builder'],
    ['boq-register', 'BOQ Master Register'],
    ['boq', 'BOQ Database'],
    ['cable-tray-sizing', 'Cable Tray Sizing'],
    ['duct-bank-sizing', 'Duct Bank Sizing'],
    ['user-manual', 'App User Manual']
];

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
        throw new Error(`Unsupported Lite template escape at offset ${index}.`);
    }
    return decoded;
}

function extractLiteEngine(artifact, name) {
    const start = artifact.indexOf('`<!DOCTYPE html');
    assert.ok(start >= 0, `${name} has no embedded MTO document.`);
    let end = start + 1;
    while (end < artifact.length) {
        if (artifact[end] === '\\') {
            end += 2;
            continue;
        }
        if (artifact[end] === '`') break;
        end += 1;
    }
    assert.ok(end < artifact.length, `${name} has an unterminated embedded MTO document.`);
    return decodeTemplateLiteralBody(artifact.slice(start + 1, end));
}

function navPages(artifact, name) {
    const start = artifact.indexOf('[{id:"takeoff",label:"Material Takeoff (MTO)"');
    assert.ok(start >= 0, `${name} has no Lite navigation array.`);
    const end = artifact.indexOf('];function', start);
    assert.ok(end > start, `${name} navigation array is not terminated.`);
    return Array.from(
        artifact.slice(start, end).matchAll(/\{id:"([^"]+)",label:"([^"]+)"/g),
        match => [match[1], match[2]]
    );
}

function parseInlineScripts(documentSource, name) {
    const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let parsed = 0;
    for (const match of documentSource.matchAll(scriptPattern)) {
        if (/\bsrc\s*=/.test(match[1])) continue;
        if (!match[2].trim()) continue;
        new Function(match[2]);
        parsed += 1;
    }
    assert.ok(parsed >= 1, `${name} has no parseable inline scripts.`);
}

const [generator, readme, ...htmlFiles] = await Promise.all([
    readFile(resolve(liteRoot, 'scripts', 'build_lite_from_full_boq.mjs'), 'utf8'),
    readFile(resolve(liteRoot, 'README.md'), 'utf8'),
    ...artifacts.map(name => readFile(resolve(liteRoot, name), 'utf8'))
]);

assert.ok(generator.includes("path.join(fullRoot, 'dist', 'BOQ_Offline_App.html')"));
assert.ok(!generator.includes("path.join(fullRoot, 'public', 'takeoff_tool.html')"));
assert.ok(generator.includes('FULL_ARTIFACT_SHA256'));
assert.ok(generator.includes('FULL_ENGINE_SHA256'));
assert.ok(generator.includes(".replace(/<\\/script>/gi, '<\\\\/script>')"));

for (const marker of [
    'd2bd4736fc8f3ef1640f5bab74daf745cfa5ae49',
    'e6969728802a3ac3f4346cdbf1064ee6f9891f7a',
    'dist/BOQ_Offline_App.html',
    EXPECTED_ENGINE_SHA256,
    'Retained Lite pages: **8**'
]) {
    assert.ok(readme.includes(marker), `README is missing ${marker}.`);
}

let referenceEngine = null;
for (let index = 0; index < artifacts.length; index += 1) {
    const name = artifacts[index];
    const html = htmlFiles[index];
    assert.deepEqual(navPages(html, name), EXPECTED_PAGES, `${name} does not retain exactly eight approved pages.`);

    for (const marker of [
        'LITE_D2BD473_RELEASE_START',
        'fullSourceFile=dist/BOQ_Offline_App.html',
        'authoritativeBaseline=d2bd4736fc8f3ef1640f5bab74daf745cfa5ae49',
        'manualMarker=LITE_D2BD473_CAD_MANUAL_V1',
        '8. CAD Placement Export',
        'Reliable AutoCAD / ZWCAD Placement Export',
        'Units, Control Points & Vertical Routes',
        'Troubleshooting'
    ]) {
        assert.ok(html.includes(marker), `${name} is missing ${marker}.`);
    }

    parseInlineScripts(html, `${name} outer application`);
    const engine = extractLiteEngine(html, name);
    assert.equal(normalizedSha256(engine), EXPECTED_ENGINE_SHA256, `${name} has the wrong Full MTO engine.`);
    if (referenceEngine === null) referenceEngine = engine;
    else assert.equal(engine, referenceEngine, 'Current and legacy Lite artifacts embed different MTO engines.');

    for (const marker of [
        "const PROJECT_STATE_VERSION = '2.4'",
        'TELECOM_MTO_CAD_EXPORT_V1',
        'CAD_PLACEMENT_MANUAL_V1',
        'materialTagPrefix',
        'globalLabelScale',
        'activeTakeoffLabelResize',
        'activeAnnotationLabelResize',
        'hydrateCustomSvgSymbols',
        'customSvgSymbols: customSvgSymbols.map',
        '1. Configure CAD Reference',
        '2. Map CAD Symbols',
        '3. Validate CAD Placement',
        '4. Export CAD Package'
    ]) {
        assert.ok(engine.includes(marker), `${name} embedded MTO engine is missing ${marker}.`);
    }
    assert.ok(!engine.includes('<script src="./vendor/jszip.min.js"></script>'));
    assert.ok(!engine.includes('<script src="./cad-placement-export.js"></script>'));
    parseInlineScripts(engine, `${name} embedded MTO engine`);
}

console.log('Lite d2bd473 source, eight-page shell, manuals, scripts, and embedded Full engine contract passed.');
