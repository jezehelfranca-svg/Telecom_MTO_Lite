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
}

console.log('Lite V2.4 CAD contract is present in both distributable artifacts.');
