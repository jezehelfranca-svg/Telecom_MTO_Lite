import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const liteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = ['Telecom_MTO_Lite_v2.html', 'index.html'];
const requiredMarkers = [
    "const PROJECT_STATE_VERSION = '2.4'",
    'TELECOM_MTO_CAD_EXPORT_V1',
    'CAD_PLACEMENT_MANUAL_V1',
    'data-inlined-from="./vendor/jszip.min.js"',
    'data-inlined-from="./cad-placement-export.js"'
];

for (const name of artifacts) {
    const html = await readFile(resolve(liteRoot, name), 'utf8');
    for (const marker of requiredMarkers) {
        if (!html.includes(marker)) throw new Error(`${name} is missing ${marker}`);
    }
    if (html.includes('<script src="./vendor/jszip.min.js"></script>') || html.includes('<script src="./cad-placement-export.js"></script>')) {
        throw new Error(`${name} still relies on an external CAD-export dependency.`);
    }

    const doctype = html.indexOf('<!DOCTYPE html');
    const start = doctype - 1;
    if (doctype < 1 || html[start] !== String.fromCharCode(96)) throw new Error(`${name} has no readable embedded MTO engine.`);
    let end = start + 1;
    for (let escaped = false; end < html.length; end += 1) {
        if (escaped) { escaped = false; continue; }
        if (html[end] === '\\') { escaped = true; continue; }
        if (html[end] === String.fromCharCode(96)) break;
    }
    const engine = Function('return ' + html.slice(start, end + 1))();
    for (const [index, script] of [...engine.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
        try { new Function(script[1]); }
        catch (error) { throw new Error(`${name} embedded script ${index} does not parse: ${error.message}`); }
    }}

console.log('Lite V2.4 CAD contract is present in both distributable artifacts.');
