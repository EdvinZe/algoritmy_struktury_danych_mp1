(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const A = isNode ? require('../app/algorithms.js') : root.RecursionAlgorithms;
  const P = isNode ? require('../app/playback.js') : root.RecursionPlayback;
  function run() {
    const results = [];
    function check(name, input, expected, compute) {
      let actual;
      try { actual = compute(); } catch (error) { actual = { error: error.message }; }
      const stringify = value => typeof value === 'string' ? value : JSON.stringify(value);
      results.push({ name, input: stringify(input), expected: stringify(expected), actual: stringify(actual), status: stringify(actual) === stringify(expected) ? 'PASS' : 'FAIL' });
    }
    function rejects(fn) { try { fn(); return false; } catch { return true; } }
    function complete(trace) { const state = P.initialState(trace); while (P.advance(trace, state)) { /* odtwórz wszystkie rzeczywiste zdarzenia */ } return state; }
    for (const [values, expected] of [[[], 0], [[-7], -7], [[2, 4, 1, 3], 10], [[-20, 20, -3, 0], -3], [Array(16).fill(20), 320]]) {
      check('Suma: wynik', { values }, expected, () => A.createTrace('sum', { values }).result);
    }
    for (const variant of ['simple', 'fast']) {
      for (const [base, exponent, expected] of [[0, 0, 1], [5, 0, 1], [-7, 1, -7], [2, 5, 32], [-2, 5, -32], [-2, 4, 16], [0, 10, 0], [10, 10, 10000000000]]) {
        check(`Potęga ${variant}: wynik`, { base, exponent }, expected, () => A.createTrace('power', { base, exponent }, variant).result);
      }
    }
    for (const disks of [0, 1, 3, 8]) {
      const tower = Array.from({ length: disks }, (_, i) => disks - i);
      check('Hanoi: wynik, cel, stos, legalność po każdym ruchu', { disks }, { moves: 2 ** disks - 1, A: [], B: [], C: tower, stack: 0, legal: true }, () => {
        const trace = A.createTrace('hanoi', { disks });
        const state = complete(trace);
        return { moves: state.metrics.moves, A: state.pegs.A, B: state.pegs.B, C: state.pegs.C, stack: state.stack.length, legal: A.validatePegs(state.pegs, disks) };
      });
    }
    check('Suma: stan po pierwszym powrocie liścia', [2, 4, 1, 3], { stack: [1, 2], finishedId: 3, value: 2, status: 'finished', parentStatus: 'active' }, () => {
      const trace = A.createTrace('sum', { values: [2, 4, 1, 3] });
      const state = P.initialState(trace);
      while (P.advance(trace, state) && state.current.type !== 'return') {}
      return { stack: state.stack.map(f => f.id), finishedId: state.current.id, value: state.tree.get(3).value, status: state.tree.get(3).status, parentStatus: state.tree.get(2).status };
    });
    check('Hanoi: stan po pierwszym ruchu n = 3', { disks: 3 }, { A: [3, 2], B: [], C: [1], stack: [1, 2, 3], caller: 3, move: { disk: 1, from: 'A', to: 'C' } }, () => {
      const trace = A.createTrace('hanoi', { disks: 3 });
      const state = P.initialState(trace);
      while (P.advance(trace, state) && state.current.type !== 'move') {}
      return { A: state.pegs.A, B: state.pegs.B, C: state.pegs.C, stack: state.stack.map(f => f.id), caller: state.current.id, move: state.current.move };
    });
    check('Pytanie zależne od stanu: powrót z liścia', [2, 4], '#1 suma', () => {
      const trace = A.createTrace('sum', { values: [2, 4] });
      const state = P.initialState(trace);
      while (trace.events[state.cursor].type !== 'return') P.advance(trace, state);
      return P.prediction(trace, state).answer;
    });
    check('Porównanie: wynik, mnożenia i maksymalny stos', { base: 2, exponents: [1, 4, 8, 10] }, [[2, 1, 0, 2, 1], [16, 4, 2, 5, 3], [256, 8, 3, 9, 4], [1024, 10, 4, 11, 4]], () => A.comparePowers().map(row => [row.fast.result, row.simple.metrics.multiplications, row.fast.metrics.multiplications, row.simple.metrics.maxDepth, row.fast.metrics.maxDepth]));
    for (const [kind, input] of [['sum', { values: [21] }], ['sum', { values: Array(17).fill(0) }], ['sum', { values: [1.5] }], ['power', { base: 11, exponent: 2 }], ['power', { base: 2, exponent: -1 }], ['power', { base: 2, exponent: 11 }], ['hanoi', { disks: -1 }], ['hanoi', { disks: 9 }], ['hanoi', { disks: 1.5 }]]) {
      check('Walidacja: odrzucenie wejścia', { kind, ...input }, true, () => rejects(() => A.createTrace(kind, input)));
    }
    check('Walidator: większy na mniejszym', { A: [1, 2], B: [], C: [] }, true, () => rejects(() => A.validatePegs({ A: [1, 2], B: [], C: [] }, 2)));
    check('Walidator: zduplikowany krążek', { A: [2, 1], B: [1], C: [] }, true, () => rejects(() => A.validatePegs({ A: [2, 1], B: [1], C: [] }, 2)));
    check('Walidator: brak krążka', { A: [2], B: [], C: [] }, true, () => rejects(() => A.validatePegs({ A: [2], B: [], C: [] }, 2)));
    check('Walidator: niedozwolony ruch nie zmienia słupków', { A: [2], B: [1], C: [] }, { rejected: true, A: [2], B: [1], C: [] }, () => {
      const pegs = { A: [2], B: [1], C: [] };
      const rejected = rejects(() => A.moveDisk(pegs, 'A', 'B', 2, 2));
      return { rejected, ...pegs };
    });
    check('Wszystkie metody: pusty stos, zakończone drzewo, zgodne liczniki', ['sum', 'simple', 'fast', 'hanoi'], true, () => [A.createTrace('sum', { values: [2, 4, 1, 3] }), A.createTrace('power', { base: 2, exponent: 5 }, 'simple'), A.createTrace('power', { base: 2, exponent: 5 }, 'fast'), A.createTrace('hanoi', { disks: 3 })].every(trace => {
      const state = complete(trace);
      return state.stack.length === 0 && [...state.tree.values()].every(node => node.status === 'finished') && JSON.stringify(state.metrics) === JSON.stringify(trace.metrics);
    }));
    check('Cała dziedzina potęgowania: obie metody zgodne z operatorem **', '21 podstaw × 11 wykładników × 2 warianty = 462 przebiegi', true, () => {
      for (let base = -10; base <= 10; base++) for (let exponent = 0; exponent <= 10; exponent++) for (const variant of ['simple', 'fast']) {
        if (A.createTrace('power', { base, exponent }, variant).result !== base ** exponent) return false;
      }
      return true;
    });
    return results;
  }
  if (isNode) module.exports = { run };
  else root.RecursionTests = { run };
})(typeof globalThis !== 'undefined' ? globalThis : this);
