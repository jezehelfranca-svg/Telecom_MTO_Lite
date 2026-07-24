import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const liteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argument = process.argv.find(value => value.startsWith('--full-root='));
if (!argument) throw new Error('Pass --full-root=<path-to-corrected-full-repository>.');
const fullRoot = resolve(argument.slice('--full-root='.length));

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
        throw new Error(`Unsupported template escape at offset ${index}.`);
    }
    return decoded;
}

function extractFullEngine(artifact) {
    const startToken = 'const aw=`';
    const endToken = '`,iw=';
    const start = artifact.indexOf(startToken);
    const end = artifact.indexOf(endToken, start + startToken.length);
    assert.ok(start >= 0 && end > start, 'Corrected Full BOQ engine was not found.');
    return decodeTemplateLiteralBody(artifact.slice(start + startToken.length, end));
}

function extractLiteEngine(artifact) {
    const start = artifact.indexOf('`<!DOCTYPE html');
    assert.ok(start >= 0, 'Lite embedded engine was not found.');
    let end = start + 1;
    while (end < artifact.length) {
        if (artifact[end] === '\\') {
            end += 2;
            continue;
        }
        if (artifact[end] === '`') break;
        end += 1;
    }
    assert.ok(end < artifact.length, 'Lite embedded engine is not terminated.');
    return decodeTemplateLiteralBody(artifact.slice(start + 1, end));
}

function extractInlinedScript(engine, sourceName) {
    const marker = `<script data-inlined-from="${sourceName}">`;
    const start = engine.indexOf(marker);
    const end = engine.indexOf('</script>', start + marker.length);
    assert.ok(start >= 0 && end > start, `Missing ${sourceName} inlined script.`);
    return engine.slice(start + marker.length, end).trim();
}

function runCoordinateFixture(moduleSource) {
    const sandbox = {
        console,
        TextEncoder,
        TextDecoder,
        Uint8Array,
        ArrayBuffer,
        Blob,
        Date,
        Math,
        JSON,
        Map,
        Set,
        WeakMap,
        Promise,
        Number,
        String,
        Object,
        RegExp,
        Error,
        TypeError,
        parseFloat,
        parseInt,
        isNaN,
        crypto: globalThis.crypto,
        setTimeout,
        clearTimeout,
        queueMicrotask
    };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.global = sandbox;
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(moduleSource, sandbox, { filename: 'cad-placement-export.js' });
    const test = sandbox.CadPlacementExport?.__test;
    assert.ok(test, 'CAD test API did not initialize.');

    const matrix = test.dxfCanvasToWcs({ fitScale: 2, offsetX: 100, offsetY: 500 });
    const points = [
        test.applyMatrix(matrix, { x: 100, y: 500 }, 0),
        test.applyMatrix(matrix, { x: 120, y: 460 }, 4.2),
        test.applyMatrix(matrix, { x: -900, y: 2500 }, 12)
    ];
    const theta = 37 * Math.PI / 180;
    const scale = 2.75;
    const known = point => {
        const yUp = -point.y;
        return {
            x: scale * Math.cos(theta) * point.x - scale * Math.sin(theta) * yUp + 4321.25,
            y: scale * Math.sin(theta) * point.x + scale * Math.cos(theta) * yUp - 876.5
        };
    };
    const fitA = { canvas: { x: -20, y: 15 }, wcs: known({ x: -20, y: 15 }) };
    const fitB = { canvas: { x: 430, y: -70 }, wcs: known({ x: 430, y: -70 }) };
    const checkPoint = { canvas: { x: 75, y: 260 }, wcs: known({ x: 75, y: 260 }) };
    const registration = test.solveSimilarityRegistration(fitA, fitB);
    const validation = test.validateCheckPoint(registration, fitA, fitB, checkPoint);
    const route = test.routeLengths([
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 4, z: 0 },
        { x: 3, y: 4, z: 12 }
    ]);
    return JSON.parse(JSON.stringify({
        matrix: Array.from(matrix),
        points,
        registration,
        residual: validation.residual,
        route,
        rotation: test.transformRotation(matrix, 25),
        insUnits: test.parseDxfInsUnits([
            '0', 'SECTION', '2', 'HEADER',
            '9', '$INSUNITS', '70', '4',
            '0', 'ENDSEC', '0', 'EOF'
        ].join('\r\n')),
        tolerance: {
            mm: test.toleranceForUnit('mm'),
            m: test.toleranceForUnit('m'),
            in: test.toleranceForUnit('in'),
            ft: test.toleranceForUnit('ft')
        }
    }));
}

const [fullArtifact, liteV2, liteLegacy] = await Promise.all([
    readFile(resolve(fullRoot, 'dist', 'BOQ_Offline_App.html'), 'utf8'),
    readFile(resolve(liteRoot, 'Telecom_MTO_Lite_v2.html'), 'utf8'),
    readFile(resolve(liteRoot, 'index.html'), 'utf8')
]);

const fullEngine = extractFullEngine(fullArtifact);
const liteV2Engine = extractLiteEngine(liteV2);
const liteLegacyEngine = extractLiteEngine(liteLegacy);
assert.equal(liteV2Engine, fullEngine, 'Lite v2 engine differs from the corrected Full BOQ engine.');
assert.equal(liteLegacyEngine, fullEngine, 'Legacy Lite engine differs from the corrected Full BOQ engine.');

const fullCadModule = extractInlinedScript(fullEngine, './cad-placement-export.js');
const liteCadModule = extractInlinedScript(liteV2Engine, './cad-placement-export.js');
assert.equal(liteCadModule, fullCadModule, 'Lite and Full CAD export modules differ.');
assert.deepEqual(
    runCoordinateFixture(liteCadModule),
    runCoordinateFixture(fullCadModule),
    'Lite and Full coordinate/registration/vertical-route fixtures differ.'
);

console.log('Full/Lite engine, CAD module, WCS registration, units, and vertical-route parity passed.');
