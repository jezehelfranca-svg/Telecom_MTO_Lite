const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const pages = [
    'Material Takeoff (MTO)',
    'MTO Data Register',
    'Deliverable Builder',
    'BOQ Master Register',
    'BOQ Database',
    'Cable Tray Sizing',
    'Duct Bank Sizing',
    'App User Manual'
];

(async () => {
    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            args: ['--allow-file-access-from-files', '--disable-extensions']
        });

        for (const fileName of ['Telecom_MTO_Lite_v2.html', 'index.html']) {
            const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
            const pageErrors = [];
            page.on('pageerror', error => pageErrors.push(String(error?.message || error)));
            const artifact = path.resolve(__dirname, '..', fileName);
            await page.goto(pathToFileURL(artifact).href, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
            await page.getByRole('button', { name: 'Material Takeoff (MTO)', exact: true })
                .first()
                .waitFor({ state: 'visible', timeout: 30000 });

            assert.match(await page.title(), /MTO Builder Lite/i);
            let bodyText = (await page.locator('body').innerText()).trim();
            assert.ok(bodyText.includes('Material Takeoff (MTO)'), `${fileName} did not render the Lite shell.`);
            assert.ok(!/^(?:var|const|let|function)\s/.test(bodyText), `${fileName} leaked JavaScript into the page.`);

            await page.getByRole('button', { name: 'App User Manual', exact: true })
                .first()
                .evaluate(element => element.click());
            await page.getByRole('button', { name: '8. CAD Placement Export', exact: true })
                .waitFor({ state: 'visible', timeout: 60000 });
            await page.getByRole('button', { name: '8. CAD Placement Export', exact: true })
                .evaluate(element => element.click());
            await page.getByText('Reliable AutoCAD / ZWCAD Placement Export', { exact: true })
                .waitFor({ state: 'visible', timeout: 60000 });

            for (const label of pages) {
                const button = page.getByRole('button', { name: label, exact: true }).first();
                await button.waitFor({ state: 'visible', timeout: 30000 });
                await button.evaluate(element => element.click());
                await page.waitForTimeout(75);
            }

            await page.getByRole('button', { name: 'Material Takeoff (MTO)', exact: true })
                .first()
                .evaluate(element => element.click());
            const iframe = page.locator('iframe[title="Telecom Material Takeoff Tool"]');
            await iframe.waitFor({ state: 'visible', timeout: 30000 });
            const frame = page.frameLocator('iframe[title="Telecom Material Takeoff Tool"]');
            await frame.locator('#cad-placement-section').waitFor({ state: 'attached', timeout: 60000 });
            for (const label of [
                '1. Configure CAD Reference',
                '2. Map CAD Symbols',
                '3. Validate CAD Placement',
                '4. Export CAD Package'
            ]) {
                await frame.getByRole('button', { name: label, exact: true })
                    .waitFor({ state: 'attached', timeout: 30000 });
            }
            const cadApi = await iframe.evaluate(
                element => Boolean(element.contentWindow?.CadPlacementExport?.buildCadPackage)
            );
            assert.equal(cadApi, true, `${fileName} CAD placement API did not initialize.`);

            bodyText = (await page.locator('body').innerText()).trim();
            assert.ok(!/^(?:var|const|let|function)\s/.test(bodyText), `${fileName} leaked JavaScript after navigation.`);
            const criticalErrors = pageErrors.filter(message =>
                !message.includes('Failed to fetch')
                && !message.includes('NetworkError')
                && !message.includes('ERR_FILE_NOT_FOUND')
            );
            assert.deepEqual(criticalErrors, [], `${fileName} browser errors: ${criticalErrors.join(' | ')}`);
            await Promise.race([
                page.close(),
                new Promise(resolve => setTimeout(resolve, 3000))
            ]);
        }

        console.log('Both Lite downloads, eight pages, CAD API, and manuals passed the real-browser smoke test.');
    } finally {
        await Promise.race([
            browser?.close(),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);
    }
})().then(
    () => process.exit(0),
    error => {
        console.error(error);
        process.exit(1);
    }
);
