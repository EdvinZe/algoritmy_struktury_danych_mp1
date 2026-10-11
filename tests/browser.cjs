'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  const results = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => route.abort());
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  async function check(name, fn) { await fn(); results.push({ name, status: 'PASS' }); }
  const text = id => page.locator(`#${id}`).innerText();
  const cursor = async () => Number((await text('progress')).split(' / ')[0]);
  const finish = () => page.evaluate(() => {
    const button = document.getElementById('step');
    let guard = 0;
    while (!button.disabled && guard++ < 3000) button.click();
    if (guard >= 3000) throw new Error('Przebieg nie zakończył się.');
  });
  await check('Otwarcie file:// bez sieci, stan początkowy', async () => {
    assert.equal(await cursor(), 0);
    assert.match(await text('stack'), /Stos pusty/);
    assert.equal(await page.locator('.node').count(), 0);
  });
  await check('Krok: wejście i wyróżniony pseudokod', async () => {
    await page.click('#step');
    assert.equal(await page.locator('.frame').count(), 1);
    assert.equal(await page.locator('#code .active').count(), 1);
    assert.match(await text('stack'), /SZCZYT.*#1/);
  });
  await check('Po powrocie: ramka usunięta, wynik w drzewie', async () => {
    for (let i = 0; i < 6; i++) await page.click('#step');
    assert.equal(await page.locator('.frame').count(), 2);
    assert.match(await text('tree'), /#3 suma.*→ 2/);
    await page.locator('.workspace').screenshot({ path: path.join(root, 'dokumentacja/suma-stan.png') });
  });
  await check('Suma kontrolna i pusty stos po końcu', async () => {
    await finish();
    assert.match(await text('problem'), /Wynik: 10/);
    assert.equal(await page.locator('.frame').count(), 0);
    assert.equal(await page.locator('.node.finished').count(), 7);
  });
  await check('Reset czyści stos, drzewo i liczniki', async () => {
    await page.click('#reset');
    assert.equal(await cursor(), 0);
    assert.equal(await page.locator('.node').count(), 0);
    assert.match(await text('metrics'), /Mnożenia: 0/);
  });
  await check('Własne dane rozpoczynają nowy przebieg', async () => {
    await page.click('#step');
    await page.fill('#values', '-2, 0, 5');
    assert.equal(await cursor(), 0);
    await finish();
    assert.match(await text('problem'), /Wynik: 3/);
  });
  await check('Niepoprawne dane blokują odtwarzanie i usuwają stary stan', async () => {
    await page.fill('#values', '21');
    assert.match(await text('error'), /0–16/);
    assert.equal(await page.locator('#step').isDisabled(), true);
    assert.equal(await page.locator('.node').count(), 0);
  });
  await check('Trzy scenariusze sumy: kontrolny, pusty, mieszany', async () => {
    for (const [preset, expected] of [['control', 10], ['edge', 0], ['negative', -5]]) {
      await page.click(`[data-preset="${preset}"]`);
      await finish();
      assert.match(await text('problem'), new RegExp(`Wynik: ${expected}`));
    }
  });
  await check('Start, zmiana tempa i Pauza', async () => {
    await page.click('#reset');
    await page.evaluate(() => { const slider = document.getElementById('speed'); slider.value = '100'; slider.dispatchEvent(new Event('input')); });
    await page.click('#play');
    await page.waitForFunction(() => !document.getElementById('progress').textContent.startsWith('0 /'));
    await page.click('#play');
    const before = await cursor();
    await page.waitForTimeout(240);
    assert.equal(await cursor(), before);
    assert.equal(await text('speed-value'), '100 ms');
  });
  await check('Pytanie przed wejściem zatrzymuje krok; odpowiedź i kontynuacja', async () => {
    await page.click('#reset');
    await page.check('#quiz-mode');
    await page.click('#step');
    assert.equal(await cursor(), 0);
    assert.equal(await page.locator('#prediction-panel').isVisible(), true);
    await page.locator('#prediction-options button').filter({ hasText: /^1$/ }).click();
    assert.match(await text('prediction-feedback'), /Poprawnie/);
    await page.click('#prediction-continue');
    assert.equal(await cursor(), 1);
    await page.uncheck('#quiz-mode');
  });
  await check('Pytanie przed powrotem dotyczy rodzica; zła odpowiedź nie odblokowuje', async () => {
    while (!(await text('event-title')).startsWith('■ Przypadek bazowy')) await page.click('#step');
    await page.check('#quiz-mode');
    await page.click('#step');
    assert.match(await text('prediction-question'), /Przed powrotem z #3/);
    await page.locator('#prediction-options button').filter({ hasText: /#3 suma/ }).click();
    assert.equal(await page.locator('#prediction-continue').isDisabled(), true);
    await page.locator('#prediction-options button').filter({ hasText: /#2 suma/ }).click();
    await page.click('#prediction-continue');
    assert.equal(await page.locator('.frame').count(), 2);
    await page.uncheck('#quiz-mode');
  });
  await check('Potęga: oba warianty, zmiana danych, 0⁰', async () => {
    await page.click('[data-module="power"]');
    await page.click('[data-preset="control"]');
    for (const variant of ['simple', 'fast']) {
      await page.selectOption('#variant', variant);
      assert.equal(await cursor(), 0);
      await finish();
      assert.match(await text('problem'), /Wynik: 32/);
    }
    await page.click('[data-preset="edge"]');
    await finish();
    assert.match(await text('problem'), /Wynik: 1/);
    await page.click('[data-preset="negative"]');
    await finish();
    assert.match(await text('problem'), /Wynik: -32/);
    await page.fill('#base', '');
    assert.equal(await page.locator('#step').isDisabled(), true);
  });
  await check('Hanoi: stan po ruchu i finał, scenariusze 0 i 4', async () => {
    await page.click('[data-module="hanoi"]');
    while (!(await text('event-title')).startsWith('⇢ Ruch')) await page.click('#step');
    assert.equal(await page.locator('.disk.moved').innerText(), '1');
    await page.locator('.workspace').screenshot({ path: path.join(root, 'dokumentacja/hanoi-stan.png') });
    await finish();
    assert.match(await text('problem'), /Wynik: 7 ruchów/);
    assert.equal(await page.locator('.peg').nth(2).locator('.disk').count(), 3);
    for (const [preset, expected] of [['edge', 0], ['negative', 15]]) {
      await page.click(`[data-preset="${preset}"]`);
      await finish();
      assert.match(await text('problem'), new RegExp(`Wynik: ${expected} ruchów`));
    }
  });
  await check('Porównanie zawiera cztery wiersze rzeczywistych wyników', async () => {
    assert.equal(await page.locator('#comparison tr').count(), 4);
    assert.equal(await page.locator('#comparison tr').last().innerText(), '10\t1024\t10\t4\t11\t4');
  });
  await check('44 testy działają także w przeglądarce', async () => {
    await page.click('#run-tests');
    assert.equal(await text('test-summary'), '44 / 44 PASS');
    assert.equal(await page.locator('#test-results .fail').count(), 0);
  });
  await check('Układ mobilny nie powoduje przewijania całej strony w poziomie', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  });
  await check('Brak błędów JavaScript przy całej sesji', async () => assert.deepEqual(errors, []));
  fs.writeFileSync(path.join(root, 'wyniki/interfejs.json'), JSON.stringify({ executedAt: new Date().toISOString(), browser: browser.version(), offline: true, total: results.length, passed: results.length, results }, null, 2));
  console.log(`${results.length}/${results.length} browser checks PASS; screenshots saved.`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
