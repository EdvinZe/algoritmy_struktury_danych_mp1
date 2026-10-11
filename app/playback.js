(function (root) {
  'use strict';
  const algorithms = typeof module !== 'undefined' && module.exports ? require('./algorithms.js') : root.RecursionAlgorithms;
  function initialState(trace) {
    return { cursor: 0, stack: [], tree: new Map(), current: null,
      pegs: { A: trace.kind === 'hanoi' ? Array.from({ length: trace.input.disks }, (_, i) => trace.input.disks - i) : [], B: [], C: [] },
      metrics: { calls: 0, maxDepth: 0, multiplications: 0, additions: 0, moves: 0 } };
  }
  function advance(trace, state) {
    const event = trace.events[state.cursor];
    if (!event) return false;
    if (event.type === 'enter') {
      if (event.parentId !== (state.stack.at(-1)?.id ?? null)) throw new Error('Niepoprawny rodzic aktywnego wywołania.');
      const node = { id: event.id, parentId: event.parentId, depth: event.depth, name: event.name, args: event.args, locals: {}, status: 'active' };
      state.stack.push(node);
      state.tree.set(node.id, node);
      state.metrics.calls++;
      state.metrics.maxDepth = Math.max(state.metrics.maxDepth, state.stack.length);
    } else {
      if (state.stack.at(-1)?.id !== event.id) throw new Error('Zdarzenie nie dotyczy szczytu stosu.');
      const node = state.tree.get(event.id);
      Object.assign(node.locals, event.locals || {});
      if (event.type === 'return') {
        node.status = 'finished';
        node.value = event.value;
        state.stack.pop();
      }
      if (event.type === 'move') {
        algorithms.moveDisk(state.pegs, event.move.from, event.move.to, event.move.disk, trace.input.disks);
        state.metrics.moves++;
      }
      if (event.type === 'multiply') state.metrics.multiplications++;
      if (event.type === 'combine') state.metrics.additions++;
    }
    state.current = event;
    state.cursor++;
    return true;
  }
  function prediction(trace, state) {
    const event = trace.events[state.cursor];
    if (!event || !['enter', 'return'].includes(event.type)) return null;
    const parent = state.stack.at(-2);
    if (event.type === 'return') {
      const answer = parent ? `#${parent.id} ${parent.name}` : 'Stos będzie pusty';
      return { question: `Przed powrotem z #${event.id}: która ramka będzie na szczycie stosu?`, answer,
        options: [...new Set([answer, `#${event.id} ${event.name}`, parent ? 'Stos będzie pusty' : 'Nowa ramka #999'])],
        explanation: 'Powrót usuwa wyłącznie bieżącą ramkę. Rodzic nadal czeka na wynik; powrót z korzenia opróżnia stos.' };
    }
    return { question: `Przed wejściem do #${event.id}: ile aktywnych ramek będzie po tym kroku?`, answer: String(state.stack.length + 1),
      options: [String(state.stack.length + 1), String(state.stack.length), String(state.stack.length + 2)],
      explanation: 'Każde wejście dodaje jedną ramkę. Głębokość w zdarzeniu liczymy od 0, liczbę ramek od 1.' };
  }
  const api = { initialState, advance, prediction };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RecursionPlayback = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
