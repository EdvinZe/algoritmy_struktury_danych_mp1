(function () {
  'use strict';
  const A = window.RecursionAlgorithms;
  const P = window.RecursionPlayback;
  const C = window.RecursionContent;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let kind = 'sum';
  let trace;
  let state;
  let timer = null;
  let pendingPrediction = null;
  function parseInteger(id) {
    const raw = $(id).value.trim();
    if (!/^[+-]?\d+$/.test(raw)) throw new Error('Wpisz liczbę całkowitą; pole nie może być puste.');
    return Number(raw);
  }
  function readInput() {
    if (kind === 'sum') {
      const raw = $('values').value.trim();
      if (raw && !/^[+-]?\d+(?:[\s,]+[+-]?\d+)*$/.test(raw)) throw new Error('Tablica powinna zawierać liczby całkowite oddzielone przecinkiem lub spacją.');
      return { values: raw ? raw.split(/[\s,]+/).map(Number) : [] };
    }
    if (kind === 'power') return { base: parseInteger('base'), exponent: parseInteger('exponent') };
    return { disks: parseInteger('disks') };
  }
  function pause() {
    clearTimeout(timer);
    timer = null;
    $('play').textContent = 'Start ▶';
  }
  function clearPrediction() {
    pendingPrediction = null;
    $('prediction-panel').hidden = true;
    $('prediction-feedback').textContent = '';
  }
  function rebuild() {
    pause();
    clearPrediction();
    try {
      trace = A.createTrace(kind, readInput(), $('variant').value);
      state = P.initialState(trace);
      $('error').textContent = '';
      $('step').disabled = false;
      $('play').disabled = false;
      render();
    } catch (error) {
      trace = null;
      state = null;
      $('error').textContent = error.message;
      $('step').disabled = true;
      $('play').disabled = true;
      $('event-title').textContent = 'Niepoprawne dane';
      $('reason').textContent = 'Popraw wejście. Poprzedni przebieg został unieważniony.';
      for (const id of ['stack', 'tree', 'problem', 'code', 'metrics']) $(id).replaceChildren();
      $('progress').textContent = '—';
    }
  }
  function showPrediction(question) {
    pause();
    pendingPrediction = question;
    $('prediction-panel').hidden = false;
    $('prediction-question').textContent = question.question;
    $('prediction-feedback').textContent = '';
    $('prediction-continue').disabled = true;
    $('prediction-options').replaceChildren();
    // Zmienna kolejność: poprawna odpowiedź nie jest zawsze pierwsza.
    const offset = state.cursor % question.options.length;
    const options = question.options.slice(offset).concat(question.options.slice(0, offset));
    for (const option of options) {
      const button = document.createElement('button');
      button.textContent = option;
      button.addEventListener('click', () => {
        const correct = option === question.answer;
        $('prediction-feedback').textContent = `${correct ? '✓ Poprawnie.' : '✗ Spróbuj jeszcze raz.'} ${question.explanation}${correct ? '' : ' Zastanów się nad liczbą aktywnych wywołań.'}`;
        $('prediction-continue').disabled = !correct;
      });
      $('prediction-options').append(button);
    }
  }
  function step(skipPrediction = false) {
    if (!trace || state.cursor >= trace.events.length) return false;
    if (pendingPrediction && !skipPrediction) return false;
    if ($('quiz-mode').checked && !skipPrediction) {
      const question = P.prediction(trace, state);
      if (question) { showPrediction(question); return false; }
    }
    clearPrediction();
    P.advance(trace, state);
    render();
    if (state.cursor === trace.events.length) pause();
    return true;
  }
  function tick() {
    if (!step()) { pause(); return; }
    if (state.cursor < trace.events.length) timer = setTimeout(tick, Number($('speed').value));
    else pause();
  }
  function renderProblem() {
    const active = state.stack.at(-1);
    if (kind === 'sum') {
      const values = trace.input.values;
      $('problem').innerHTML = values.length ? '<div class="array">' + values.map((value, index) => `<div class="cell ${active && index >= active.args.lo && index < active.args.hi ? 'active' : ''}">${value}<small>[${index}]</small></div>`).join('') + '</div>' : '<p>∅ Pusta tablica</p>';
      if (active) $('problem').innerHTML += `<p>Aktywny przedział: [${active.args.lo}, ${active.args.hi})</p>`;
    } else if (kind === 'power') {
      $('problem').innerHTML = `<div class="result">${trace.input.base}<sup>${trace.input.exponent}</sup></div><p>Aktywne n: ${active?.args.n ?? '—'} · wariant: ${trace.variant === 'fast' ? 'szybki' : 'zwykły'}</p>`;
    } else {
      $('problem').innerHTML = '<div class="pegs">' + ['A', 'B', 'C'].map(peg => `<div class="peg">${[...state.pegs[peg]].reverse().map(disk => `<div class="disk ${state.current?.type === 'move' && state.current.move.to === peg && state.current.move.disk === disk ? 'moved' : ''}" style="width:${28 + disk * 8}%">${disk}</div>`).join('')}<span class="peg-label">${peg}</span></div>`).join('') + '</div><p>Krążki: liczba = rozmiar · cel A → C.<br>Każdy ruch jest sprawdzany przez walidator.</p>';
    }
    if (state.cursor === trace.events.length) $('problem').innerHTML += `<p class="result">✓ Wynik: ${trace.result}${kind === 'hanoi' ? ' ruchów' : ''}</p>`;
  }
  function render() {
    if (!trace) return;
    const complete = state.cursor === trace.events.length;
    const labels = { enter: '→ Wejście', return: '← Powrót', base: '■ Przypadek bazowy', split: '↳ Podział', value: '↓ Wynik dziecka', combine: '+ Połączenie', multiply: '× Mnożenie', move: '⇢ Ruch krążka' };
    $('progress').textContent = `${state.cursor} / ${trace.events.length} zdarzeń`;
    $('event-title').textContent = state.current ? `${labels[state.current.type]} · #${state.current.id}` : 'Gotowy do pierwszego wejścia';
    $('reason').textContent = complete ? `Zakończono. Wynik = ${trace.result}; stos jest pusty, drzewo zachowuje wyniki.` : state.current?.reason ?? 'Naciśnij Krok lub Start. Przed pierwszym wywołaniem stos i drzewo są puste.';
    $('step').disabled = complete;
    $('play').disabled = complete;
    const m = state.metrics;
    $('metrics').innerHTML = [`Wywołania: ${m.calls}`, `Maks. stos: ${m.maxDepth}`, `Mnożenia: ${m.multiplications}`, `Dodawania: ${m.additions}`, `Ruchy: ${m.moves}`].map(text => `<span>${text}</span>`).join('');
    const content = C[kind === 'power' ? trace.variant : kind];
    for (const [target, source] of [['method-title', 'title'], ['method-goal', 'goal'], ['method-uses', 'uses'], ['method-limits', 'limits'], ['method-cost', 'cost']]) $(target).textContent = content[source];
    $('code').innerHTML = content.code.map((line, index) => `<li class="${state.current?.line === index ? 'active' : ''}">${escape(line)}</li>`).join('');
    $('stack').innerHTML = state.stack.length ? [...state.stack].reverse().map((frame, index) => `<div class="frame"><strong>${index === 0 ? '▲ SZCZYT · ' : ''}#${frame.id} ${frame.name}</strong><br>głębokość ${frame.depth} · ${escape(JSON.stringify(frame.args))}<br>Zmienne: ${escape(JSON.stringify(frame.locals))}</div>`).join('') : '<p class="muted">∅ Stos pusty</p>';
    const treeScroll = $('tree').scrollTop;
    $('tree').innerHTML = state.tree.size ? [...state.tree.values()].map(node => `<div class="node ${node.status === 'finished' ? 'finished' : ''} ${state.current?.id === node.id ? 'current' : ''}" style="margin-left:${node.depth * 14}px">${node.status === 'finished' ? '✓' : '●'} ${node.parentId ? '↳' : ''} #${node.id} ${escape(node.name)} ${escape(JSON.stringify(node.args))}${node.status === 'finished' ? ` → ${node.value}` : ' [aktywne]'}</div>`).join('') : '<p class="muted">Drzewo pojawi się po pierwszym wejściu.</p>';
    $('tree').scrollTop = treeScroll;
    renderProblem();
  }
  document.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () => {
    kind = button.dataset.module;
    document.querySelectorAll('[data-module]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    for (const module of ['sum', 'power', 'hanoi']) $(`${module}-input`).hidden = module !== kind;
    rebuild();
  }));
  const presets = {
    sum: { control: [2, 4, 1, 3], edge: [], negative: [-20, 7, 0, 13, -5] },
    power: { control: [2, 5], edge: [0, 0], negative: [-2, 5] },
    hanoi: { control: 3, edge: 0, negative: 4 }
  };
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    const value = presets[kind][button.dataset.preset];
    if (kind === 'sum') $('values').value = value.join(', ');
    if (kind === 'power') { $('base').value = value[0]; $('exponent').value = value[1]; }
    if (kind === 'hanoi') $('disks').value = value;
    $('preset-description').textContent = `Wczytano: ${button.textContent} · ${JSON.stringify(value)}`;
    rebuild();
  }));
  $('data-form').addEventListener('submit', event => { event.preventDefault(); rebuild(); });
  for (const id of ['values', 'base', 'exponent', 'disks']) $(id).addEventListener('input', rebuild);
  $('variant').addEventListener('change', rebuild);
  $('step').addEventListener('click', () => { pause(); step(); });
  $('reset').addEventListener('click', rebuild);
  $('play').addEventListener('click', () => {
    if (timer !== null) pause();
    else { $('play').textContent = 'Pauza ❚❚'; timer = setTimeout(tick, Number($('speed').value)); }
  });
  $('speed').addEventListener('input', () => {
    $('speed-value').textContent = `${$('speed').value} ms`;
    if (timer !== null) { clearTimeout(timer); timer = setTimeout(tick, Number($('speed').value)); }
  });
  $('quiz-mode').addEventListener('change', () => { pause(); clearPrediction(); });
  $('prediction-continue').addEventListener('click', () => step(true));
  $('comparison').innerHTML = A.comparePowers().map(row => `<tr><td>${row.exponent}</td><td>${row.simple.result}</td><td>${row.simple.metrics.multiplications}</td><td>${row.fast.metrics.multiplications}</td><td>${row.simple.metrics.maxDepth}</td><td>${row.fast.metrics.maxDepth}</td></tr>`).join('');
  $('run-tests').addEventListener('click', () => {
    const results = window.RecursionTests.run();
    const passed = results.filter(row => row.status === 'PASS').length;
    $('test-summary').textContent = `${passed} / ${results.length} PASS`;
    $('test-results').innerHTML = '<table><thead><tr><th>Test / wejście</th><th>Oczekiwane</th><th>Uzyskane</th><th>Status</th></tr></thead><tbody>' + results.map(row => `<tr><td>${escape(row.name)}<br><small>${escape(row.input)}</small></td><td>${escape(row.expected)}</td><td>${escape(row.actual)}</td><td class="${row.status === 'PASS' ? 'pass' : 'fail'}">${row.status}</td></tr>`).join('') + '</tbody></table>';
  });
  rebuild();
})();
