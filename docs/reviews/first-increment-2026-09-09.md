# Pierwszy przyrost App Kita — przegląd i granice gotowości

Data: 2026-09-09. Przegląd dotyczy snapshotu `ccd6ac2d706327e348f34ad0bb9041d0fbb4d2a1`, nie późniejszych zmian. To raport stanu prac, nie deklaracja gotowości wydania.

## Co zostało rozpoczęte

- Niezależny backend TypeScript/Fastify, PostgreSQL/Drizzle, Better Auth oraz SMTP/React Email.
- Schemat i migracje kont, obsługa weryfikacji adresu, haseł, sesji, preferencji oraz TOTP.
- Źródła wybranych komponentów z publicznego Untitled UI React, plik MIT, zapis pochodzenia i warstwa neutralnego motywu.
- Formularze rejestracji, logowania, drugiego czynnika, odzyskiwania i resetu hasła, ponownej weryfikacji adresu.
- Wąski serwerowy proxy do backendu oraz współdzielone kontrakty.
- Szczegółowe porównanie początkowych projektów w `docs/reference/lovable-template-comparison.md`.

Raport wykonania pierwszego przebiegu Lovable zawiera pozytywny wynik 9 testów backendu (6 jednostkowych i 3 integracyjnych) z PostgreSQL i Mailpit w lokalnym środowisku agenta. Nie jest to wynik testu pełnego interfejsu, rzeczywistego HTTPS w podglądzie Lovable, wielu instancji, urządzeń mobilnych ani pełnego odbioru bezpieczeństwa. Po dalszych poprawkach trzeba wykonać testy ponownie i zapisać wynik oraz dokładny commit.

## Blokery odbioru znalezione w przeglądzie

1. Frontend nie jest jeszcze domknięty: brakuje pełnego widoku konta i katalogu, a początkowy ekran/metadane wymagają usunięcia brandingu. Nie potwierdzono builda i pełnych testów przeglądarkowych dla tego snapshotu.
2. `src/lib/account.ts` importuje nieistniejący typ SessionList i ma rozbieżne metody/typy odpowiedzi dla preferencji i odwołania sesji. Kontrakty trzeba ujednolicić; własne API powinno mieć uzgodniony prefiks `/api/v1`.
3. Formularze odzyskania hasła i wysyłki weryfikacji nie mogą połykać błędów sieci/503/429 i pokazywać fałszywego sukcesu. Potrzebne są poprawne callbackURL/redirectTo oraz test kliknięcia rzeczywistego maila przez frontend/proxy.
4. Mutacje własnego API wymagają jawnej ochrony Origin/CSRF. CORS sam nie stanowi takiej ochrony. `trustProxy: true` wymaga zastąpienia ograniczoną konfiguracją; podszyte nagłówki adresu klienta nie mogą trafiać do mechanizmów limitowania.
5. Trzeba zablokować publiczne trasy biblioteki omijające bezpieczny interfejs, w szczególności surową listę sesji. Serwer musi egzekwować wyłączenie trustDevice, odwoływanie pozostałych sesji po zmianie hasła i wymagania świeżego uwierzytelnienia. Sama obecność biblioteki lub brak checkboxa w UI nie wystarcza.
6. Konfiguracja wymaga ścisłej walidacji originów i odrzucania przykładowych sekretów. Secure cookies zależą od zewnętrznego HTTPS. Prywatne odpowiedzi wymagają no-store, a status gotowości rzeczywistego sprawdzenia zależności.
7. Proxy musi ograniczać rozmiar podczas odczytu i bezpiecznie obsługiwać forwarding nagłówków, timeouty oraz odrębne Set-Cookie. Nie wystarcza limit po wczytaniu całego body do pamięci.
8. Destrukcyjne czyszczenie w testach wymaga ochrony dedykowanej bazy i testowego Mailpit. Testów nie wolno wykonywać przeciw dowolnemu DATABASE_URL. Sekrety, pliki lokalnego środowiska i materiały testowe nie mogą trafić do repozytorium.
9. Należy usunąć nieużywaną równoległą bibliotekę shadcn po kontroli importów, zweryfikować dokładny upstream i poprawić SOURCE.md: jego spis nie może wymieniać usuniętych plików. Neutralny motyw powinien używać rzeczywistych szarości i białego tła; żadnych barw T13.
10. Do zakończenia pozostają README/instrukcja uruchomienia, lokalna konfiguracja PostgreSQL i poczty, manifest, karty modułów, kontrola skryptów i zachowanie reguł AGENTS.md. Nie budujemy instalatora.

## Wymagany następny punkt odbioru

Domknąć powyższy przyrost bez dodawania kolejnych modułów. Uruchomić web typecheck/build, server typecheck, testy backendu na dedykowanych usługach oraz przeglądarkowy proces konta przez proxy. Wyniki muszą pochodzić z tego samego aktualnego snapshotu; kod wyjścia testu nie może być maskowany przez potok do tail/head.

Pełne dane/prywatność i retencja, trwałe operacje, pliki, udostępnianie, administracja, pochodzenie, klient Expo i rozszerzenia pozostają osobnym zakresem. Nie są ukończone w tym przyroście.

## Granice zmian

Prace dotyczą wyłącznie App Kita. Site Kit został odczytany i porównany, nie przebudowany. Nie ma publikacji produkcyjnej ani zmiany prywatności repozytorium. Aplikacja pozostaje wersją rozwojową i nie jest jeszcze gotowym starterem do używania z rzeczywistymi danymi.
