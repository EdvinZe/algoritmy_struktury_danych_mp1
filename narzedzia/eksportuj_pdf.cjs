'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { PDFDocument } = require(process.env.PDF_LIB_MODULE || 'pdf-lib');
(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const verification = { executedAt: new Date().toISOString(), documents: [] };
  for (const [directory, basename, selector] of [['dokumentacja', 'dokumentacja', '.page'], ['prezentacja', 'prezentacja', '.slide']]) {
    await page.goto(pathToFileURL(path.join(root, directory, basename + '.html')).href);
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.locator(selector).evaluateAll(elements => elements.map((element, index) => {
      const footer = element.querySelector('footer').getBoundingClientRect();
      const container = element.getBoundingClientRect();
      const content = element.querySelector('.page-content');
      const contentBottom = content ? content.getBoundingClientRect().bottom : Math.max(...[...element.children].filter(e => e.tagName !== 'FOOTER').map(e => e.getBoundingClientRect().bottom));
      return { page: index + 1, fits: contentBottom <= footer.top - 8, contentBottom: Math.round(contentBottom - container.top), footerTop: Math.round(footer.top - container.top), scrollFits: element.scrollHeight <= element.clientHeight + 1 };
    }));
    if (layout.length !== 10 || layout.some(row => !row.fits || !row.scrollFits)) throw new Error(`${basename}: invalid layout ${JSON.stringify(layout)}`);
    const pdfPath = path.join(root, directory, basename + '.pdf');
    await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
    const doc = await PDFDocument.load(fs.readFileSync(pdfPath));
    if (doc.getPageCount() !== 10) throw new Error(`${basename}: ${doc.getPageCount()} pages, expected 10.`);
    verification.documents.push({ file: `${directory}/${basename}.pdf`, pages: doc.getPageCount(), layout, bytes: fs.statSync(pdfPath).size });
    for (const index of directory === 'dokumentacja' ? [0, 6, 8, 9] : [0, 6, 7, 9]) {
      await page.locator(selector).nth(index).screenshot({ path: path.join(root, 'wyniki', `${basename}-${index + 1}.png`) });
    }
  }
  await page.emulateMedia({ media: 'screen' });
  await page.goto(pathToFileURL(path.join(root, 'prezentacja/prezentacja.html')).href);
  if (await page.locator('.slide').count() !== 10) throw new Error('Wrong slide count.');
  await page.keyboard.press('End');
  if (await page.locator('#slide-counter').innerText() !== '10 / 10') throw new Error('Slide navigation failed.');
  await page.keyboard.press('ArrowLeft');
  if (await page.locator('#slide-counter').innerText() !== '9 / 10') throw new Error('Slide backward navigation failed.');
  verification.presentationNavigation = 'PASS';
  fs.writeFileSync(path.join(root, 'wyniki/dokumenty.json'), JSON.stringify(verification, null, 2));
  console.log(JSON.stringify(verification.documents.map(({ file, pages, bytes }) => ({ file, pages, bytes }))));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
