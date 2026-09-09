# T13 App Kit

Zestaw startowy do budowania aplikacji z gotowych podstaw, zamiast odtwarzania ich przy każdym nowym projekcie.

T13 App Kit łączy kod aplikacji React, backend TypeScript, mechanizmy kont i bezpieczeństwa, komponenty interfejsu oraz instrukcje dla agentów programistycznych. Powstaje dla małych aplikacji i większych produktów, rozwijanych przez ludzi oraz narzędzia takie jak Codex i Lovable. Docelowy zakres obejmuje także osobnego klienta iOS i Android.

Punkt wyjścia jest white label: białe tło, neutralne komponenty i konfigurowalna nazwa produktu. Korzystanie z zestawu nie wymaga nadawania aplikacji wyglądu T13 ani podłączania jej do centralnej usługi T13.

**Obecna wersja: `0.1.0-dev`.** Dostarczony i sprawdzony jest przyrost webowych kont i ustawień. Cały plan App Kita, w tym mobile i pozostałe moduły, nie jest jeszcze ukończonym wydaniem 1.0. Zakres wykonanych kontroli znajduje się w [raporcie stanu](docs/status.md), a wybrane moduły w [manifeście](t13.project.json).

## Dlaczego powstaje

Nowa aplikacja powinna zaczynać się od tego, co odróżnia ją od poprzedniej. Tymczasem wiele projektów zaczyna się od kolejnej implementacji rejestracji, resetu hasła, ustawień konta, formularzy, sesji i połączenia z bazą.

Przy pracy z AI ten sam problem wraca jako kolejne prompty, kontekst, tokeny i poprawki. Agent generuje standardowe zaplecze od nowa, a zespół ponownie sprawdza szczegóły, które były już rozwiązywane w innych produktach.

App Kit ma dostarczyć ten fundament jako kod do wykorzystania: nie tylko pole hasła, ale cały proces zmiany hasła; nie tylko przycisk wylogowania, ale rzeczywiste odwołanie sesji; nie tylko ładny formularz, ale walidację, zapis, obsługę błędu i test.

Inspiracją organizacyjną był [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template): użyteczny starter powinien łączyć frontend, API, migracje, lokalne środowisko i dokumentację. T13 ma własny układ i stos TypeScript + Better Auth; inspiracja nie oznacza zależności od FastAPI ani kopiowania jego kodu.

Oszczędność czasu i tokenów jest celem do zmierzenia na porównywalnych zadaniach, nie zadeklarowanym z góry wynikiem.

## Dla kogo

Dla osób i zespołów budujących aplikacje z własnymi kontami, prywatnymi danymi i logiką produktu: narzędzia wewnętrzne, aplikacje użytkowe oraz rozwijane stopniowo produkty webowe.

Zestaw jest przeznaczony zarówno do zwykłej pracy programistycznej, jak i pracy z agentem mającym dostęp do repozytorium. Nie wymaga korzystania z Lovable. Agent nadal potrzebuje środowiska wykonawczego i odpowiednich dostępów; sam czat bez możliwości edycji kodu nie staje się środowiskiem budowania aplikacji.

Do publicznej strony firmowej, bloga i CMS-a służy osobny [T13 Site Kit](https://github.com/t13foundation/T13-Site-Kit). App Kit nie dodaje do takiej strony kont i infrastruktury aplikacyjnej tylko po to, żeby oba projekty używały tego samego szablonu.

## Zasady zestawu

**Gotowe procesy, nie puste ekrany.** Funkcja musi mieć rzeczywistą obsługę po stronie serwera, właściwe stany interfejsu i określony zakres testów. Brak backendu jest błędem konfiguracji, nie okazją do pokazania fikcyjnego zalogowanego użytkownika.

**Mały wymagany fundament, reszta dobierana do produktu.** Organizacje, pliki, AI, badania i billing nie mają być obowiązkowym wyposażeniem każdej aplikacji. Mały projekt nie powinien utrzymywać infrastruktury dużego systemu.

**Dojrzałe mechanizmy zamiast własnego uwierzytelniania.** Konta, hasła, sesje i MFA opierają się na Better Auth. Kod T13 łączy bibliotekę z ekranami, konfiguracją i regułami aplikacji; nie tworzy własnej kryptografii.

**Jeden katalog komponentów.** Agent najpierw korzysta z istniejących elementów i bloków. Nowy komponent powstaje przy rzeczywistym braku, nie dlatego, że łatwiej wygenerować kolejny przycisk.

**Zwykłe repozytorium, bez dodatkowej platformy.** Nie ma instalatora T13, kreatora, własnego CLI do zarządzania modułami ani obowiązkowej centralnej usługi. Są pliki, manifest, instrukcje i zwykłe polecenia uruchamiania, migracji oraz testów.

## Co zawiera obecna wersja

Poniższa tabela opisuje dostarczony przyrost, nie cały docelowy katalog.

| Obszar | Zakres w kodzie | Granica obecnej wersji |
|---|---|---|
| Konta | Rejestracja, weryfikacja e-maila, logowanie i wylogowanie, ponowna wysyłka weryfikacji, odzyskiwanie i reset hasła | Zmiana e-maila i usunięcie konta są jeszcze planowane |
| Bezpieczeństwo | Zmiana hasła, TOTP z potwierdzeniem konfiguracji, kody odzyskiwania, lista sesji, odwołanie jednej lub pozostałych sesji, wymaganie świeżego logowania | Nie jest to pełny audyt bezpieczeństwa ani obsługa wszystkich metod logowania |
| Profil i preferencje | Edycja nazwy, język `pl`/`en` i strefa czasowa zapisane na koncie | Język wpływa na formaty; interfejs nie ma jeszcze pełnych tłumaczeń |
| Dostęp do danych | Operacje przypisane do uwierzytelnionego właściciela, kontrola sesji i zweryfikowanego adresu | Nie ma jeszcze ogólnego modelu organizacji, uprawnień do zasobów ani RLS |
| Eksport | JSON z profilem i preferencjami osoby wykonującej operację | To eksport konta, nie pełny eksport przyszłych plików i materiałów aplikacji |
| Interfejs | Neutralna powłoka, formularze konta, panel `/account`, katalog `/catalog` | Katalog obejmuje obecnie wybrany zestaw podstaw; pozostałości domyślnego shadcn wymagają jeszcze uporządkowania |
| Backend i dane | Fastify, Better Auth, PostgreSQL, Drizzle, zachowana historia migracji i walidacja konfiguracji | Pełny cykl retencji, zgód i usuwania danych pozostaje do wykonania |
| Poczta i środowisko | SMTP, szablony React Email, lokalny PostgreSQL i Mailpit, przykłady konfiguracji | Podłączenie rzeczywistego hostingu i nadawcy poczty wymaga konfiguracji operatora |
| Praca agenta | `AGENTS.md`, manifest, karty modułów, instrukcja uruchomienia i testy | Instrukcje nie są automatycznym instalatorem ani gwarancją poprawnego wyniku dowolnego agenta |

Źródłem aktualnego stanu są [manifest](t13.project.json) i [raport weryfikacji](docs/status.md). Starsze przeglądy w `docs/reviews/` opisują wskazane w nich historyczne wersje.

## Architektura

Obecny przepływ żądania:

```text
Przeglądarka: React + TypeScript
        |
        | /api na tej samej domenie
        v
Wąskie proxy w powłoce TanStack Start / Lovable
        |
        v
API: Fastify + Better Auth
        |                  |
        v                  v
PostgreSQL / Drizzle     SMTP / React Email
```

| Warstwa | Rozwiązanie | Odpowiedzialność |
|---|---|---|
| Web | React, TypeScript, TanStack Start, Tailwind | Ekrany, nawigacja, formularze i podgląd |
| UI | Publiczne źródła Untitled UI React MIT, React Aria, bloki T13 | Kontrolki i powtarzalne fragmenty interfejsu |
| API | Node.js, TypeScript, Fastify | Walidacja, dostęp, konfiguracja i operacje konta |
| Tożsamość | Better Auth, z wersją zgodną po stronie klienta i serwera | Poświadczenia, sesje i drugi składnik logowania |
| Dane | PostgreSQL i Drizzle | Zapis oraz wersjonowanie schematu |
| Poczta | SMTP, React Email; Mailpit lokalnie | Wiadomości wymagane przez proces konta |
| Kontrakty | `shared/` | Wspólne typy i walidacja bez sekretów i zależności serwerowych |

Web i API mają obecnie osobne procesy oraz pliki zależności. Build webu nie wymaga uruchomionej bazy. Sam frontend może pokazać katalog i brak konfiguracji, ale nie zastępuje działającego API.

Backend pozostaje jednym systemem z wydzielanymi modułami, a nie obowiązkowym zbiorem mikroserwisów. Graphile Worker jest wybranym kierunkiem dla trwałych zadań w dalszym zakresie; nie jest jeszcze częścią tego przyrostu. Redis, Kubernetes i osobna usługa AI nie są wymagane do uruchomienia obecnych kont.

### Gdzie szukać kodu

```text
src/
  app.config.ts          nazwa produktu i ustawienia powłoki
  components/kit/        kanoniczny katalog komponentów i bloków
  routes/                ekrany oraz trasa proxy API
  lib/                   klienci API, integracja kont i proxy
server/
  src/                   Fastify, Better Auth, baza i poczta
  drizzle/               migracje
  tests/                 testy jednostkowe i integracyjne
shared/                  kontrakty i wspólne reguły
third-party/             pochodzenie i licencja komponentów
scripts/                 kontrola kompletności źródeł
 tests/                  testy reguł dostępu i proxy
 docs/                   uruchomienie, karty modułów i raporty
 t13.project.json        wersja zestawu i zakres modułów
 AGENTS.md               krótka instrukcja dla agenta
```

## Szybki start

Potrzebne są Node.js 22.16+, Bun do odtworzenia zapisanych zależności oraz Docker Compose albo równoważny lokalny PostgreSQL i SMTP. Ostatnia pełna kontrola używała Node 22.23.2 i Bun 1.4.2; szczegóły są w [raporcie](docs/status.md).

W katalogu sklonowanego repozytorium uruchom usługi developerskie:

```sh
docker compose -f compose.yaml up -d
```

Następnie przygotuj API. Kopiowanie przykładu dotyczy pierwszego uruchomienia — nie nadpisuj istniejącej konfiguracji:

```sh
cd server
bun install --frozen-lockfile
cp .env.example .env
openssl rand -hex 32
```

Wpisz wygenerowaną wartość do `BETTER_AUTH_SECRET` w lokalnym `server/.env`. Dla standardowego środowiska ustaw `APP_URL`, `AUTH_URL` i `TRUSTED_ORIGINS` na `http://localhost:8080`. To publiczny adres webu, nie wewnętrzny port API. Przykład zawiera lokalne połączenia PostgreSQL i Mailpit.

Z katalogu `server/`:

```sh
bun --env-file=.env run db:migrate
bun --env-file=.env run dev
```

W drugim terminalu, z głównego katalogu repozytorium:

```sh
bun install --frozen-lockfile
API_INTERNAL_URL=http://127.0.0.1:3001 bun run dev -- --port 8080
```

Aplikacja działa pod `http://localhost:8080`, katalog pod `/catalog`, a skrzynka Mailpit pod `http://127.0.0.1:8025`. Rejestracja wymaga potwierdzenia linku z wiadomości testowej.

`API_INTERNAL_URL` jest zmienną procesu serwerowego. Nie dodawaj jej do publicznej konfiguracji `VITE_*`. Bez niej operacje konta zwracają jawny błąd. Pełna instrukcja, w tym oddzielna baza testowa: [docs/start.md](docs/start.md).

## Praca z AI i Lovable

### W zwykłym repozytorium

Agent dostaje opis aplikacji i wskazaną wersję Kita. Czyta README, `AGENTS.md`, manifest oraz dokumentację potrzebnych modułów. Następnie wykorzystuje istniejący kod, konfiguruje produkt, usuwa zbędne elementy i przechodzi do jego logiki domenowej.

Nie prosimy agenta o napisanie „czegoś podobnego do Kita”. Ma użyć dostarczonych plików i mechanizmów.

### W projekcie Lovable

Przyjęta ścieżka startu jest prosta: pusty projekt Lovable → połączenie z GitHubem lub GitLabem → własny agent wprowadza wybrany zakres Kita do połączonego repozytorium → konfiguracja i test → dalsza praca w Lovable albo przez repozytorium.

Podstawowy prompt do utworzenia projektu:

> Utwórz minimalny projekt React + TypeScript z jednym pustym ekranem. Nie buduj logowania, kont, panelu administracyjnego ani funkcji biznesowych. Nie podłączaj usług backendowych. Projekt zostanie uzupełniony gotowym T13 App Kit przez połączone repozytorium.

Polecenie dla agenta repozytoryjnego:

> Użyj wskazanego commitu T13 App Kit w tym projekcie. Przeczytaj README, AGENTS.md, t13.project.json i instrukcje potrzebnych modułów. Wykorzystaj istniejący kod, zamiast generować konta, sesje i kontrolki od nowa. Zachowaj zgodność zastanej powłoki z Lovable. Skonfiguruj nazwę, wygląd i integracje zgodnie z opisem aplikacji. Usuń niepotrzebny kod i zależności, ale nie dane ani historię migracji. Sekrety pozostaw poza repozytorium. Na końcu wykonaj adekwatne kontrole i zapisz ich rzeczywisty wynik. Opis aplikacji: [brief].

To repozytorium jest już połączone z projektem Lovable. Nie oznacza to, że dowolne monorepo, backend lub natywny klient uruchomi się w jego podglądzie. Pushing kodu nie konfiguruje również PostgreSQL, SMTP ani hostowanego API. Zgodność sprawdza się dla konkretnej wersji i środowiska.

Projekt referencyjny do remiksowania jest przewidzianym dodatkowym sposobem startu, nie obowiązkowym kanałem dystrybucji. Ten README nie deklaruje jeszcze publicznie udostępnionego remiksu.

## Katalog i white label

Kanoniczne miejsce to [`src/components/kit/`](src/components/kit). Obejmuje tokeny, motyw, kontrolki, formularze, nawigację, komunikaty i gotowe bloki, w tym ustawienia konta. `/catalog` pozwala obejrzeć przykłady bez zakładania konta i bez backendu.

Podstawowe kontrolki pochodzą z publicznego `untitleduico/react`. [Rejestr pochodzenia](third-party/untitledui-react/SOURCE.md) zapisuje commit `c981a73bcd6b6c68d2a54070f20f020191212828` oraz użyte pliki. Nie wykorzystujemy kodu PRO ani nie przypisujemy jego licencji własnym imitacjom.

Nazwę produktu zmienia się w [`src/app.config.ts`](src/app.config.ts), a neutralny motyw w [`themes/neutral.css`](src/components/kit/themes/neutral.css). Aplikacja może otrzymać własne kolory, typografię i kompozycję. Wspólne mają pozostać jakość obsługi, czytelne stany i kontrola danych, nie identyczny wygląd wszystkich produktów.

Dostępność jest wymaganiem komponentów i procesów: semantyka, etykiety, fokus, klawiatura, powiększenie i czytniki ekranowe. Panel preferencji nie zastępuje tych właściwości. Obecny raport nie jest deklaracją pełnego audytu dostępności.

## Prywatność i bezpieczeństwo

Sesje webowe korzystają z cookies `HttpOnly`; tokenów nie zapisujemy w `localStorage`. Publiczne adresy, zaufane originy i sekrety podlegają walidacji. API sprawdza uprawnienia niezależnie od tego, czy interfejs pokazał przycisk.

Operacje wrażliwe wymagają sesji utworzonej w ciągu ostatnich pięciu minut. Lista sesji nie ujawnia surowych tokenów, adresów IP ani pełnego user agenta. Reset hasła nie wyłącza MFA. Nieaktywne lub niezaimplementowane skróty biblioteki nie powinny omijać zasad zestawu.

Proxy kieruje żądania wyłącznie do wskazanego przez operatora backendu, ogranicza rozmiar przesyłanego body i usuwa podstawiane nagłówki adresu klienta. Do czasu sprawdzenia rzeczywistej konfiguracji ingressu użytkownicy za jednym proxy mogą współdzielić jego limit IP. Nie rozwiązujemy tego przez bezwarunkowe zaufanie do `X-Forwarded-For`.

Eksport obecnego przyrostu zawiera tylko profil i preferencje. Nie zastępuje pełnej obsługi prywatności, retencji, kopii zapasowych i usuwania danych przyszłych modułów. Docelowy panel administratora ma zarządzać kontami bez automatycznego dostępu do prywatnej treści; taki panel nie jest jeszcze dostarczony.

Zestaw nie wymaga wysyłania danych do T13. Opcjonalne badania są odrębnym, jeszcze niezaimplementowanym zakresem: osobna decyzja o wybranych materiałach, odbiorcy, celu i retencji. Użycie AI, zachowanie oryginału, udostępnienie innym i badania nie mają być jedną zgodą. Pseudonimizacji nie utożsamiamy z anonimowością ani nie obiecujemy cofnięcia wpływu danych z już wytrenowanych modeli.

## Moduły, usuwanie i aktualizacje

[`t13.project.json`](t13.project.json) zapisuje wersję i zakres projektu. Biblioteki są zależnościami z lockfile; kod ekranów, konfiguracji i integracji T13 pozostaje w repozytorium aplikacji.

Agent usuwa zbędne pliki, importy, trasy, zależności, konfigurację i nieadekwatne testy — nie tylko ukrywa pozycję menu. Nie usuwa testów pozostawionych funkcji, danych produkcyjnych ani zastosowanych migracji. Modułu kont nie można odłączyć, pozostawiając bez ochrony prywatne zasoby.

Przed usunięciem zapisz źródłowy commit i lokalne zmiany. Przywrócenie zaczyna się od zgodnej wersji i porównania z aktualnym projektem, nie od nadpisania plików najnowszym `main`. Poprawki T13 przenosi się jako przeglądane zmiany; aktualizacja zależności nie jest automatycznym wdrożeniem.

Nie ma centralnego mechanizmu, który sam zaktualizuje wszystkie utworzone aplikacje. Odpowiedzialność za wdrożenie poprawki w konkretnym produkcie pozostaje u jego operatora. Karty istniejących modułów: [konta](docs/modules/accounts.md), [bezpieczeństwo](docs/modules/security.md), [UI](docs/modules/ui.md).

## Weryfikacja

Dla scalenia `8d280484` zapisano udany build klienta, SSR i Nitro, pełne kontrole typów webu oraz API, 14 testów reguł/proxy, 8 testów jednostkowych backendu i 6 testów integracyjnych z rzeczywistym PostgreSQL oraz Mailpit. Dowód i dokładne środowisko: [docs/status.md](docs/status.md).

To testy API i kodu, nie pełny przeglądarkowy odbiór hostowanego Lovable, rzeczywistej dostarczalności poczty czy aplikacji mobilnych. Wynik dotyczy wskazanej wersji — nie jest automatycznie przenoszony na późniejsze zmiany.

Podstawowe kontrole uruchamia się lokalnie po spójnym pakiecie zmian:

```sh
node --experimental-strip-types --test tests/*.test.mjs
node scripts/check-source-integrity.mjs
bun run build
./node_modules/.bin/tsc --noEmit -p tsconfig.json
(cd server && bun run typecheck && ./node_modules/.bin/vitest run tests/unit)
```

Integracje wymagają oddzielnej lokalnej bazy `appkit_test`, testowej skrzynki oraz jawnego zezwolenia na czyszczenie danych testowych. Instrukcja jest w [docs/start.md](docs/start.md). CI na `main` jest ręczne; nie uruchamia się po każdym pushu lub PR. Nie usuwamy zabezpieczeń ani testów po to, żeby uzyskać zielony wynik.

## Kierunek rozwoju

Dalszy zakres nie jest listą funkcji już dostępnych w tej wersji.

| Etap | Zakres |
|---|---|
| Domknięcie fundamentu | Weryfikowana zmiana e-maila, usunięcie konta, pełne tłumaczenia, zgody, eksport i retencja, uporządkowanie katalogu i zależności |
| Moduły produktu | Trwałe zadania, prywatne pliki, udostępnianie i zaproszenia, uprawnienia do zasobów, ograniczona administracja, powiadomienia i pochodzenie materiałów |
| Klient natywny | Expo / React Native, iOS i Android, logowanie, deep linki, aparat, nagrania, pliki, push i wybrane operacje offline |
| Rozszerzenia opcjonalne | Organizacje, adapter AI z serwerowymi kluczami i kontrolą kosztów, dobrowolne przekazywanie wybranych materiałów do badań |

Web i mobile mają współdzielić kontrakty, walidację, klienta API, tłumaczenia, tokeny i logikę niezależną od platformy. Komponenty React DOM nie stają się automatycznie komponentami React Native. Kod serwerowy nie trafia na urządzenie.

Użyteczność modułów ma być sprawdzana na trzech różnych scenariuszach: **Przepiśniku** z rodzinnymi materiałami i współpracą, **Mediatorze** z prywatnymi wypowiedziami i zatwierdzanymi fragmentami oraz **Inwentarzu** z trwałym zapisem zdjęcia przed AI. To scenariusze projektowe, nie dostarczone tutaj aplikacje demonstracyjne. Ich logika domenowa nie należy do rdzenia.

## Relacja do innych produktów T13

| Produkt | Odpowiedzialność |
|---|---|
| T13 App Kit | Fundament aplikacji React i docelowo klientów natywnych |
| [T13 Site Kit](https://github.com/t13foundation/T13-Site-Kit) | Strony Astro, opcjonalny CMS, formularze, analityka i standard wdrożenia |
| T13 Sitecase | Oddzielny projekt panelu realizacji stron, materiałów, dostępów i odbioru |

Produkty rozwijają się niezależnie. Nie wymagają wspólnego monorepo, konta użytkownika ani jednoczesnego wydania. Można przenosić sprawdzone rozwiązania, ale nie powstaje obowiązek „najpierw ukończyć App Kit, potem budować stronę”.

## Dokumentacja i wkład

Zacznij od [uruchomienia](docs/start.md), [manifestu](t13.project.json), [instrukcji agenta](AGENTS.md) i [raportu stanu](docs/status.md). Karty modułów wskazują ich pliki i granice. [Porównanie początkowych projektów Lovable](docs/reference/lovable-template-comparison.md) wyjaśnia pochodzenie powłoki, a [opis scalenia](docs/reference/merge-2026-09-09.md) dokumentuje połączenie pierwszych przyrostów.

Zmiana w zestawie powinna rozwiązywać powtarzalny problem, mieć wyraźny zakres i aktualizować odpowiednią instrukcję. Dla błędu podaj wersję, środowisko, sposób odtworzenia i oczekiwany wynik. Nie dodawaj haseł, tokenów ani prywatnych materiałów do zgłoszeń. Funkcje specyficzne dla jednego produktu pozostają poza rdzeniem.

## Licencja

Docelową licencją własnego kodu startera jest MIT. W opisanym stanie repozytorium nie ma jeszcze głównego pliku `LICENSE` obejmującego cały projekt; trzeba go uzupełnić przed deklarowaniem kompletnego wydania na tej licencji.

Skopiowane publiczne komponenty Untitled UI mają osobny [tekst MIT](third-party/untitledui-react/LICENSE) i [rejestr pochodzenia](third-party/untitledui-react/SOURCE.md), które należy zachować. Ich licencja nie obejmuje automatycznie całego repozytorium, kodu PRO, innych zależności, zdjęć ani znaków towarowych. White label dotyczy wyglądu aplikacji, nie usuwania wymaganych oznaczeń licencyjnych ze źródeł.
