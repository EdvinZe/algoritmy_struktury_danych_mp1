# Rekurencja krok po kroku — ASD1-M1-14

**Autor / student:** Edvin Zenevič · **indeks:** 93783  
**Przedmiot:** Algorytmy i struktury danych I · semestr I · 2026/2027  
**Data opracowania:** 10.10.2026

## Szybkie uruchomienie

1. Rozpakuj cały ZIP.
2. Otwórz `index.html` w przeglądarce. Nie potrzebujesz serwera, kont, API ani internetu.
3. Wybierz moduł, scenariusz lub własne dane. Używaj **Krok**, **Start/Pauza**, **Reset** i suwaka tempa.
4. Włącz przewidywanie, aby zatrzymywać się przed wejściem do funkcji lub powrotem.
5. Naciśnij **Uruchom testy lokalnie**, aby zobaczyć wejścia, oczekiwania i wyniki 44 testów.

W razie potrzeby alternatywnie: `python3 -m http.server 8000 --bind 127.0.0.1` w folderze projektu i `http://127.0.0.1:8000`. Serwer nie jest konieczny.

## Zakres

- Suma przez rekurencyjny podział indeksowanego przedziału, baza pusta i jednoelementowa.
- Potęgowanie zwykłe oraz szybkie; połowa obliczana tylko raz; `a^0 = 1`, także `0^0`.
- Hanoi A → C, 0–8 krążków; każde przeniesienie związane z id wywołania i walidowane.
- Rzeczywiste zdarzenia wykonania, aktywny stos i pełne drzewo z wynikami, zmienne, pseudokod, powody działań.
- Trzy scenariusze w każdym module, własne dane, nowe odtwarzanie po zmianie danych.
- Trzy pytania z wyjaśnieniami oraz dodatkowe pytania o bieżący stan.
- Porównanie potęgowania dla podstawy 2 i n = 1, 4, 8, 10.
- Polska treść, legenda z symbolami i etykietami, responsywny układ.

## Testy i rzeczywiste wyniki

Bez instalacji: przycisk testów w aplikacji. Z Node.js:

```bash
node tests/run.cjs
node tests/run.cjs --save > wyniki/testy.txt
```

Na serwerze wykonano **44/44 PASS** testów domenowych i **17/17 PASS** kontroli przeglądarkowych. Jeden test domenowy sprawdza całą dziedzinę potęgowania: 462 przebiegi. Dwa jawne testy pośrednie dotyczą powrotu pierwszego liścia sumy i pierwszego ruchu Hanoi. Sprawdzane są także niepoprawne dane, walidator słupków, końcowy pusty stos i liczniki.

Dowody: `wyniki/testy.json`, `wyniki/testy.txt`, `wyniki/interfejs.json`, `wyniki/porownanie.json`, `wyniki/dokumenty.json`. Daty w plikach odnoszą się do rzeczywistych uruchomień, nie do planowanych doświadczeń.

Opcjonalne testy interfejsu wymagają Node.js oraz Playwright (nie są zależnością aplikacji):

```bash
npm install --prefix /tmp/asd-tools playwright pdf-lib
/tmp/asd-tools/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/asd-tools/node_modules/playwright node tests/browser.cjs
```

W systemie muszą być dostępne biblioteki wymagane przez Chromium. Skrypt testuje `file://`, blokuje żądania HTTP/HTTPS i zapisuje autentyczne zrzuty. Nie używa publicznego serwera.

## Liczniki i porównanie

Mnożenia to wykonane operacje `*`; maksymalny stos to liczba aktywnych ramek (korzeń = 1), a nie numer głębokości (korzeń = 0). Wszystkie wejścia bazowe wliczają się do wywołań. Bieżący widok pokazuje odtworzony prefiks, tabela porównania pełny przebieg.

| n | Wynik | Mnożenia zwykłe | Szybkie | Stos zwykły | Szybki |
|---|---|---|---|---|---|
| 1 | 2 | 1 | 0 | 2 | 1 |
| 4 | 16 | 4 | 2 | 5 | 3 |
| 8 | 256 | 8 | 3 | 9 | 4 |
| 10 | 1024 | 10 | 4 | 11 | 4 |

Szybki wariant ma dodatkową bazę `n = 1`. Ślad, kopie argumentów, drzewo, odtwarzanie i walidator są oddzielnym narzutem edukacyjnym. Nie łączymy kosztów różnych problemów w ranking ani nie traktujemy tempa animacji jako czasu algorytmu.

## Architektura

- `app/algorithms.js`: walidacja, badane algorytmy, instrumentacja, liczniki i porównanie.
- `app/playback.js`: stos, drzewo, słupki, jedno zdarzenie i pytania o bieżący stan.
- `app/content.js`: polskie opisy i pseudokod.
- `app/ui.js`: sterowanie, zegar i DOM; `app/styles.css`: wygląd.
- `tests/`: wspólne testy Node.js/przeglądarki i testy interfejsu.
- `narzedzia/`: generator dokumentów i eksport PDF; nie są potrzebne przy uruchamianiu produktu.

`createTrace` naprawdę wykonuje rekurencję i rejestruje zdarzenia. `advance` odtwarza je po jednym; nie jest to nagranie ani ręcznie wpisana animacja. Nie symulujemy wstrzymania stosu silnika JavaScript: wyświetlany stos jest kontrolowaną rekonstrukcją jego śladu.

## Pliki do oddania i obrony

- Aplikacja z kodem i testami: cały folder projektu / ZIP.
- `prezentacja/prezentacja.html` — osobna prezentacja lokalna, **dokładnie 10 slajdów**; strzałki, Spacja, Home/End, przyciski. Opcjonalny pełny ekran.
- `prezentacja/prezentacja.pdf` — te same **10 slajdów** do oddania.
- `dokumentacja/dokumentacja.pdf` — **dokładnie 10 stron po polsku**.
- `dokumentacja/dokumentacja.html` — edytowalne źródło raportu.
- `prezentacja/notatki_prelegenta.md` — wskazówki do każdego slajdu.
- `prezentacja/scenariusz_obrony.md` — plan demonstracji, ćwiczenia i pytania.
- `LISTA_ODDANIA.md` — lista końcowa, w tym wymagany link GitHub.

Najpierw 10 slajdów, następnie działająca aplikacja, potem pytania. Zrzuty nie zastępują produktu. PDF zawiera numerację stron; liczbę stron, brak wyjścia treści poza obszar oraz nawigację slajdów sprawdzono automatycznie.

## Odtworzenie dokumentów

Po wykonaniu testów i zrzutów:

```bash
python3 narzedzia/przygotuj_dokumenty.py
PLAYWRIGHT_MODULE=/tmp/asd-tools/node_modules/playwright PDF_LIB_MODULE=/tmp/asd-tools/node_modules/pdf-lib node narzedzia/eksportuj_pdf.cjs
```

Generator pobiera wyniki z JSON, zamiast przepisywać je ręcznie. Zmiana treści może wymagać dostosowania układu; eksport odrzuca przepełnione strony i liczbę stron inną niż 10.

## Źródła, AI i wkład

Źródło wymagań: przekazana karta `ASD1-M1-14.html` (kopia w `dokumentacja/karta_zadania.html`). Materiał do nauki: [Princeton — Recursion](https://introcs.cs.princeton.edu/java/23recursion/). Realizacja nie kopiuje gotowej wizualizacji.

Użyto **OpenAI Codex przez OpenClaw** do kodu, testów i materiałów. Agent faktycznie wykonał wskazane kontrole. Potwierdzony wkład Edvina na etapie przygotowania: przekazanie zadania, miejsca zapisu i danych autora. Przed oddaniem należy samodzielnie przejrzeć implementację, przećwiczyć obronę i dopisać wyłącznie rzeczywiście wykonane własne zmiany. Nie przypisujemy studentowi nieprzeprowadzonych eksperymentów ani samodzielnego napisania wszystkich plików.

## GitHub i termin

Karta wymaga repozytorium GitHub i **osobnego linku w polu „Linki” w Dzienniku**. Lokalny folder/ZIP nie spełnia tego punktu. Repozytorium: https://github.com/EdvinZe/algoritmy_struktury_danych_mp1 — prywatne, opublikowane za zgodą autora. Zapewnij prowadzącemu dostęp.

Termin oddania: **26.10.2026, 23:59**. Obrona: **28.10.2026, 08:30–11:40** — zgodnie z przekazaną kartą.
