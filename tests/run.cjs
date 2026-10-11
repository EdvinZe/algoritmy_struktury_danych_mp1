'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { run } = require('./suite.js');
const { comparePowers } = require('../app/algorithms.js');
const results = run();
for (const test of results) console.log(`${test.status} | ${test.name} | wejście: ${test.input} | oczekiwane: ${test.expected} | uzyskane: ${test.actual}`);
const passed = results.filter(row => row.status === 'PASS').length;
console.log(`\nWynik: ${passed}/${results.length} PASS`);
if (process.argv.includes('--save')) {
  const directory = path.join(__dirname, '../wyniki');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'testy.json'), JSON.stringify({ executedAt: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  const comparison = comparePowers().map(row => ({ n: row.exponent, result: row.fast.result, simpleMultiplications: row.simple.metrics.multiplications, fastMultiplications: row.fast.metrics.multiplications, simpleMaxStack: row.simple.metrics.maxDepth, fastMaxStack: row.fast.metrics.maxDepth }));
  fs.writeFileSync(path.join(directory, 'porownanie.json'), JSON.stringify(comparison, null, 2));
}
process.exitCode = passed === results.length ? 0 : 1;
