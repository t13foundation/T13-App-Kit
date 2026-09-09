# T13 App Kit — specyfikacja produktu

## Cel i zakres

Niezależny, neutralny wizualnie starter aplikacji. Docelowy stos to TanStack Start, React, Supabase Auth, PostgreSQL i Storage oraz Cloudflare. Interfejs korzysta z istniejących komponentów MIT Untitled UI. Resend i Turnstile należą do późniejszych zadań. Repozytorium, konta usług, wdrożenia i cykl wydawniczy są niezależne od Site Kitu i platformy T13.

Zakres i kolejność wykonania określają [epik #2](https://github.com/t13foundation/T13-App-Kit/issues/2), jego podzadania i natywne zależności GitHub. Ten dokument nie jest drugą tablicą zadań. Wersja 1 nie obejmuje płatności, organizacji, modułów AI, współpracy na żywo ani natywnych aplikacji mobilnych.

## Pierwszy przyrost: WBS-APP1-01

Na `/notes` użytkownik tworzy konto, potwierdza adres kodem e-mail, loguje się, wylogowuje i zarządza własnymi notatkami. Formularze mają stany oczekiwania, błędu i potwierdzonego wyniku. Edycja/usunięcie uwzględnia zmianę rekordu od momentu jego odczytu. Interfejs nie wyświetla prywatnych danych podczas SSR.

Notatka zawiera identyfikator, właściciela, tytuł, treść i daty utworzenia/zmiany. Właściciel i daty nie są dowolnie edytowalne przez API. Baza ogranicza tytuł do 120 znaków i treść do 20 000 znaków. Każda operacja wymaga własności i potwierdzonego, niezablokowanego konta, sprawdzanych w bazie. Użytkownik nie może wybrać cudzego właściciela ani przenieść własności. Testy mają wykazać to przez bezpośrednie wywołania API, bez interfejsu.

Przeglądarka przechowuje sesję zarządzaną przez SDK Supabase; wcześniejsza obietnica wyłącznie HttpOnly nie obowiązuje dla nowej ścieżki. JWT może pozostać ważny po wylogowaniu do jego wygaśnięcia; konfiguracja lokalna zakłada 600 sekund. Nie przedstawiamy odświeżenia tokenu jako świeżego uwierzytelnienia.

## Granica migracji i odbioru

Stary backend i jego ekrany pozostają dostępne jako oddzielna ścieżka porównawcza. Nie ma automatycznego przenoszenia użytkowników, haseł ani sesji. Nie zmieniamy danych produkcyjnych. Pierwszy przyrost nie oznacza ukończenia pozostałych funkcji konta.

Odbiór wymaga czystego uruchomienia, rzeczywistych testów dwóch kont, zachowania izolacji przy bezpośrednim API, demonstracji mobilnej i desktopowej oraz osobno autoryzowanego środowiska testowego Cloudflare. Dopiero demonstracja i GO Marka otwierają dalsze zadania. Wygenerowane artefakty i wykonane sprawdzenia muszą być rzeczywiste; bieżące dowody i braki pozostają w Issue/PR, nie w deklaracjach gotowości produktu.
