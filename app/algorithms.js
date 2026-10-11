/* Algorytmy nie znają DOM ani zegara animacji. Zdarzenia powstają przy wykonaniu. */
(function (root) {
  'use strict';
  function validateInput(kind, input) {
    if (!['sum', 'power', 'hanoi'].includes(kind)) throw new Error('Nieznany moduł.');
    const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
    if (kind === 'sum' && (!Array.isArray(input.values) || input.values.length > 16 || !input.values.every(v => integer(v, -20, 20)))) {
      throw new Error('Podaj 0–16 liczb całkowitych z zakresu −20…20.');
    }
    if (kind === 'power' && (!integer(input.base, -10, 10) || !integer(input.exponent, 0, 10))) {
      throw new Error('Podstawa: liczba całkowita −10…10; wykładnik: 0…10.');
    }
    if (kind === 'hanoi' && !integer(input.disks, 0, 8)) throw new Error('Liczba krążków: całkowita 0…8.');
  }
  function validatePegs(pegs, diskCount) {
    if (!pegs || !['A', 'B', 'C'].every(p => Array.isArray(pegs[p]))) throw new Error('Brak trzech słupków.');
    const seen = new Set();
    for (const peg of ['A', 'B', 'C']) {
      pegs[peg].forEach((disk, index) => {
        if (!Number.isInteger(disk) || disk < 1 || disk > diskCount || seen.has(disk)) throw new Error('Niepoprawny zbiór krążków.');
        if (index && pegs[peg][index - 1] <= disk) throw new Error('Większy krążek leży na mniejszym.');
        seen.add(disk);
      });
    }
    if (seen.size !== diskCount) throw new Error('Zgubiono krążek.');
    return true;
  }
  function moveDisk(pegs, from, to, disk, diskCount) {
    if (from === to || !pegs[from] || !pegs[to]) throw new Error('Niepoprawne słupki ruchu.');
    if (pegs[from].at(-1) !== disk) throw new Error('Ruch nie dotyczy górnego krążka.');
    const top = pegs[to].at(-1);
    if (top !== undefined && top < disk) throw new Error('Niedozwolony ruch: większy na mniejszy.');
    pegs[from].pop();
    pegs[to].push(disk);
    validatePegs(pegs, diskCount);
  }
  function createTrace(kind, input, variant = 'fast') {
    validateInput(kind, input);
    if (kind === 'power' && !['simple', 'fast'].includes(variant)) throw new Error('Nieznany wariant potęgowania.');
    const events = [];
    const metrics = { calls: 0, maxDepth: 0, multiplications: 0, additions: 0, moves: 0 };
    let nextId = 0;
    function emit(frame, type, line, reason, extra = {}) {
      events.push({ type, id: frame.id, parentId: frame.parentId, depth: frame.depth,
        name: frame.name, args: { ...frame.args }, line, reason, ...extra });
    }
    function enter(name, args, parent, line) {
      const frame = { id: ++nextId, parentId: parent ? parent.id : null, depth: parent ? parent.depth + 1 : 0, name, args };
      metrics.calls++;
      metrics.maxDepth = Math.max(metrics.maxDepth, frame.depth + 1);
      emit(frame, 'enter', line, 'Wejście do funkcji: dokładamy nową ramkę na stos.');
      return frame;
    }
    function finish(frame, value, line) {
      emit(frame, 'return', line, 'Powrót: wynik trafia do rodzica, a ramka znika ze stosu.', { value });
      return value;
    }
    function sum(lo, hi, parent) {
      const frame = enter('suma', { lo, hi, fragment: input.values.slice(lo, hi) }, parent, 0);
      if (lo === hi) {
        emit(frame, 'base', 1, 'Pusty fragment ma sumę 0.', { locals: { wynik: 0 } });
        return finish(frame, 0, 1);
      }
      if (hi - lo === 1) {
        emit(frame, 'base', 2, 'Jeden element: wynik jest tym elementem.', { locals: { wynik: input.values[lo] } });
        return finish(frame, input.values[lo], 2);
      }
      const mid = Math.floor((lo + hi) / 2);
      emit(frame, 'split', 3, 'Dzielimy przedział [lo, hi) na dwie rozłączne połowy.', { locals: { mid } });
      const left = sum(lo, mid, frame);
      emit(frame, 'value', 4, 'Lewa połowa zakończyła obliczenia.', { locals: { left } });
      const right = sum(mid, hi, frame);
      metrics.additions++;
      emit(frame, 'combine', 5, 'Dodajemy dwa wyniki, nie elementy animacji.', { locals: { left, right, wynik: left + right } });
      return finish(frame, left + right, 6);
    }
    function power(a, n, parent) {
      const frame = enter(variant === 'fast' ? 'potęga_szybka' : 'potęga_zwykła', { a, n }, parent, 0);
      if (n === 0) {
        emit(frame, 'base', 1, 'Konwencja zadania: a⁰ = 1, również 0⁰.', { locals: { wynik: 1 } });
        return finish(frame, 1, 1);
      }
      if (variant === 'simple') {
        const previous = power(a, n - 1, frame);
        metrics.multiplications++;
        emit(frame, 'multiply', 3, 'Jedno mnożenie przez podstawę po powrocie dziecka.', { locals: { previous, wynik: a * previous } });
        return finish(frame, a * previous, 4);
      }
      if (n === 1) {
        emit(frame, 'base', 2, 'Dodatkowy przypadek bazowy: a¹ = a, bez mnożenia.', { locals: { wynik: a } });
        return finish(frame, a, 2);
      }
      const half = power(a, Math.floor(n / 2), frame);
      let result = half * half;
      metrics.multiplications++;
      emit(frame, 'multiply', 4, 'Wynik połowy obliczono tylko raz; mnożymy go przez siebie.', { locals: { half, wynik: result } });
      if (n % 2 === 1) {
        result *= a;
        metrics.multiplications++;
        emit(frame, 'multiply', 5, 'Nieparzysty wykładnik wymaga jeszcze jednego czynnika a.', { locals: { wynik: result } });
      }
      return finish(frame, result, 6);
    }
    const pegs = { A: kind === 'hanoi' ? Array.from({ length: input.disks }, (_, i) => input.disks - i) : [], B: [], C: [] };
    function hanoi(n, from, to, aux, parent) {
      const frame = enter('hanoi', { n, from, to, aux }, parent, 0);
      if (n === 0) {
        emit(frame, 'base', 1, 'Zero krążków: nie wykonujemy ruchu.');
        return finish(frame, 0, 1);
      }
      const left = hanoi(n - 1, from, aux, to, frame);
      moveDisk(pegs, from, to, n, input.disks);
      metrics.moves++;
      emit(frame, 'move', 3, `Przenosimy krążek ${n}: ${from} → ${to}. Walidator potwierdził legalność.`, { move: { disk: n, from, to } });
      const right = hanoi(n - 1, aux, to, from, frame);
      return finish(frame, left + 1 + right, 5);
    }
    const result = kind === 'sum' ? sum(0, input.values.length, null) : kind === 'power' ? power(input.base, input.exponent, null) : hanoi(input.disks, 'A', 'C', 'B', null);
    return { kind, input: JSON.parse(JSON.stringify(input)), variant, events, result, metrics };
  }
  function comparePowers() {
    return [1, 4, 8, 10].map(exponent => ({ exponent, simple: createTrace('power', { base: 2, exponent }, 'simple'), fast: createTrace('power', { base: 2, exponent }, 'fast') }));
  }
  const api = { validateInput, validatePegs, moveDisk, createTrace, comparePowers };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RecursionAlgorithms = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
