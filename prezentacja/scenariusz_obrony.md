# Scenariusz demonstracji i ćwiczenia przed obroną

## Przed pokazem

Przeczytaj kod oraz raport. Otwórz slajdy i aplikację w dwóch kartach. Sprawdź działanie bez internetu. Najpierw pokaż wszystkie 10 slajdów, potem przełącz się na produkt. Poniższy plan jest pomocą do ćwiczeń, nie deklaracją, że student już przećwiczył obronę.

## Pokaz produktu — około 6–8 minut

1. **Suma:** moduł Suma → Przykład kontrolny. Krok #1 dodaje korzeń. Wykonaj jeszcze 5 kroków (do bazy pierwszego liścia). Włącz przewidywanie i naciśnij Krok: pytanie przed powrotem #3. Odpowiedz #2 suma. Po kontynuacji pokaż, że #3 znikł ze stosu, lecz ma wynik 2 w drzewie. Wyłącz przewidywanie i zakończ przebieg przez Start, zwiększając tempo do 100 ms. Wynik 10, stos pusty.
2. **Nowe dane:** zmień tablicę na `-2, 0, 5`. Stary przebieg znika. Wynik 3. Wczytaj przypadek zerowy: pusty fragment → 0, jedna ramka bazowa i pusty stos po powrocie. Pokaż także błąd dla liczby 21, następnie popraw wejście.
3. **Potęga:** Przykład kontrolny: 2⁵. Wariant zwykły: 5 mnożeń, 6 ramek, wynik 32. Zmień na szybki: nowy przebieg, 3 mnożenia, 3 ramki. W tabeli wskaż n=10: 10 kontra 4 mnożenia, 11 kontra 4 ramki. Przypadek zerowy to 0⁰ = 1 według zadania. Scenariusz ujemnej podstawy: (−2)⁵ = −32.
4. **Hanoi:** n=3. Krokami do pierwszego ruchu: A=[3,2], B=[], C=[1], ruch wykonuje ramka #3. Pokaż stos i wyróżniony wiersz ruchu. Start → wynik 7 i cała wieża na C. Zmień n na 0: zero ruchów. Zwróć uwagę, że źródło i cel są argumentami konkretnego wywołania.
5. **Testy:** kliknij „Uruchom testy lokalnie”. Pokaż 44/44 PASS oraz dwa testy stanów pośrednich. Wyjaśnij, że zapisane 17 kontroli UI pochodzi z osobnego skryptu Playwright.
6. **Kod:** otwórz `app/algorithms.js`: w szybkim wariancie wskaż pojedyncze `power(a, Math.floor(n / 2), frame)` i dwa użycia half. W `app/playback.js` wyjaśnij push/pop i zachowanie węzła w Map.

## Pytania i krótkie odpowiedzi

- **Co pozostanie po powrocie korzenia?** Pusty stos i kompletne drzewo z wynikami.
- **Dlaczego szybki wariant ma zero mnożeń dla n=1?** Dodatkowa baza zwraca a bez operacji *.
- **Co popsuje dwa wywołania half?** Powielą tę samą pracę; rekurencja nie będzie mieć jednego podproblemu na poziom.
- **Dlaczego liczniki stosu i depth różnią się o 1?** Korzeń ma depth=0, ale zajmuje jedną ramkę.
- **Czy tempem 100 ms zmieniam koszt algorytmu?** Nie, tylko harmonogram odtwarzania.
- **Czy to jest debugger wstrzymujący JavaScript?** Nie. Algorytm wykonuje się i tworzy rzeczywisty ślad, a aplikacja rekonstruuje kolejne stany.
- **Czy czas walidatora Hanoi jest czasem badanego algorytmu?** Nie. Pełna kontrola legalności O(n) na ruch jest osobnym narzutem.
- **Czy 0⁰ zawsze wynosi 1?** Tu przyjęto taką konwencję zgodnie z kartą; nie jest to uniwersalne twierdzenie dla każdego kontekstu.
- **Własny wkład i AI?** Odpowiadaj zgodnie z raportem i rzeczywiście wykonanymi własnymi zmianami. Nie deklaruj samodzielnego napisania AI-generated kodu.

## Nowe dane do samodzielnego przećwiczenia

1. Suma `[5, -2, 7]`: podział [0,3) → [0,1) i [1,3); wynik 10; 2 dodawania, maks. 3 ramki.
2. Potęga `(−3)^3`: szybki przebieg n=3 → 1; half=−3, kwadrat=9, dodatkowy czynnik=−3; wynik −27; 2 mnożenia, 2 ramki.
3. Hanoi n=2: A→B krążek 1, A→C krążek 2, B→C krążek 1; 3 ruchy, maks. 3 ramki (wliczamy wywołania n=0).
4. Przed każdym wejściem i powrotem odgadnij przyszły szczyt stosu, potem sprawdź w aplikacji.
