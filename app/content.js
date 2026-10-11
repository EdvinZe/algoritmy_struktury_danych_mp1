window.RecursionContent = {
  sum: {
    title: 'Suma przez podział',
    goal: 'Dziel fragment na połowy, oblicz obie sumy i połącz wyniki. Przedział [lo, hi) nie zawiera hi.',
    uses: 'Redukcje i obliczenia równoległe; przykład zasady dziel i zwyciężaj.',
    limits: 'W tej wersji obliczenia są sekwencyjne. Zwykła pętla też ma czas Θ(n), a potrzebuje mniej pamięci stosu.',
    cost: 'Czas Θ(n) dla n ≥ 1; pusty fragment Θ(1). Stos Θ(log n), maksymalnie 1 + ⌈log₂ n⌉ ramek. Brak kopiowania połówek w badanym algorytmie — przekazujemy indeksy.',
    code: ['suma(lo, hi)', '  jeśli lo = hi: zwróć 0', '  jeśli hi − lo = 1: zwróć tablica[lo]', '  mid ← ⌊(lo + hi) / 2⌋', '  left ← suma(lo, mid)', '  right ← suma(mid, hi); wynik ← left + right', '  zwróć wynik']
  },
  simple: {
    title: 'Potęgowanie zwykłe', goal: 'aⁿ = a · aⁿ⁻¹. Przy n = 0 zwracamy 1, także dla podstawy 0.',
    uses: 'Najprostsza ilustracja zależności wyniku od powrotu z kolejnego wywołania.',
    limits: 'Wykonuje n mnożeń i ma n + 1 ramek. Duże wykładniki grożą przepełnieniem stosu i utratą precyzji liczb.',
    cost: 'Czas Θ(n + 1), pamięć stosu Θ(n + 1). W zadaniu n ≤ 10, |a| ≤ 10; wyniki są dokładnymi liczbami całkowitymi JavaScript.',
    code: ['potęga_zwykła(a, n)', '  jeśli n = 0: zwróć 1', '  previous ← potęga_zwykła(a, n − 1)', '  wynik ← a · previous', '  zwróć wynik']
  },
  fast: {
    title: 'Szybkie potęgowanie', goal: 'Oblicz a^⌊n/2⌋ tylko raz. Kwadrat tego wyniku daje parzystą część potęgi; dla nieparzystego n pomnóż jeszcze przez a.',
    uses: 'Ograniczenie liczby mnożeń; baza dla potęgowania modularnego (nieimplementowanego w projekcie).',
    limits: 'Odrębna baza n = 1 oszczędza mnożenia. Ujemne wykładniki są poza zakresem. Nie wykonujemy dwóch takich samych wywołań dla połowy.',
    cost: 'Dla n ≥ 2 czas i stos Θ(log n); n = 0 lub 1: Θ(1). Dla n ≥ 1 maksymalny stos = ⌊log₂ n⌋ + 1.',
    code: ['potęga_szybka(a, n)', '  jeśli n = 0: zwróć 1', '  jeśli n = 1: zwróć a', '  half ← potęga_szybka(a, ⌊n / 2⌋)', '  wynik ← half · half', '  jeśli n nieparzyste: wynik ← wynik · a', '  zwróć wynik']
  },
  hanoi: {
    title: 'Wieże Hanoi', goal: 'Przenieś n − 1 krążków na pomocniczy słupek, największy z rozważanych na cel, a następnie n − 1 na cel. Cel całego zadania: A → C.',
    uses: 'Model rozkładu problemu, porządku operacji i zależności między podproblemami.',
    limits: 'Minimalnie 2ⁿ − 1 ruchów, więc koszt rośnie wykładniczo. W tej wersji n ≤ 8. Krążki na każdym słupku zapisano od dołu do góry.',
    cost: 'Czas Θ(2ⁿ), stos Θ(n + 1), słupki Θ(n). Dla n = 0 zero ruchów i jedna ramka. Walidacja po ruchu kosztuje osobno O(n).',
    code: ['hanoi(n, from, to, aux)', '  jeśli n = 0: zwróć 0 ruchów', '  left ← hanoi(n − 1, from, aux, to)', '  przenieś krążek n: from → to', '  right ← hanoi(n − 1, aux, to, from)', '  zwróć left + 1 + right']
  }
};
