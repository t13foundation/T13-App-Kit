# Lovable — porównanie stanu początkowego App Kit i Site Kit

Data odczytu: 2026-09-09. Ten dokument opisuje stan PRZED budową App Kita, a nie bieżący zakres implementacji.

## Źródła

- App: `t13foundation/t13-app-kit`, commit `ef4882b6cccfa033349968d6c84102c99d2a8d02`, projekt Lovable `cdc378d5-2f96-47a7-b963-8a35e01af300`.
- Site: `t13foundation/t13-site-kit`, commit `f48e4e1c43ba14e98f8ba31d81470495fd99883b`, projekt Lovable `abfd5955-8076-4b9e-a306-f0005965bd61`.
- Sprawdzono pliki, identyfikatory zawartości drzew Git, historię wiadomości i zmian Lovable. Nie uruchamiano testów integracyjnych stanu początkowego.

## Wniosek

Oba projekty otrzymały TEN SAM szablon techniczny. Nie jest to osobny szablon backendu dla aplikacji i osobny dla stron. Agent inaczej zinterpretował polecenie i zmodyfikował jedynie ekran, metadane oraz — w Site Kicie — nazwę pakietu i README.

`.lovable/project.json` w obu projektach:

```json
{
  "schemaVersion": 1,
  "template": "tanstack_start_ts_current",
  "revision": "tanstack_start_ts_current-7da8770d11d6"
}
```

## Wspólna baza

| Element | Identyczna deklaracja w obu projektach |
|---|---|
| React / React DOM | `^19.2.0` |
| TanStack Start | `1.168.32` |
| TanStack Router | `1.170.18` |
| Vite | `8.1.5` |
| TypeScript | `^5.8.3` |
| Tailwind CSS | `^4.2.1` |
| Konfiguracja Lovable | `@lovable.dev/vite-tanstack-config: ^2.20.0` |
| Nitro | `3.0.260603-beta` |
| Skrypty | `dev`, `build`, `build:dev`, `preview`, `lint`, `format` |

Wersje z zakresami `^` są deklaracjami package.json, nie twierdzeniem o dokładnej wersji zainstalowanej każdej zależności. Oba pliki blokady zależności są jednak identyczne.

Identyczne są wszystkie `dependencies`, `devDependencies`, skrypty i override `rolldown: 1.2.1`. Identyczne są również `vite.config.ts`, `tsconfig.json`, ESLint, Prettier, `bunfig.toml`, `components.json`, `AGENTS.md`, style, router, drzewo tras, middleware oraz katalogi `components`, `hooks`, `lib` i `public`.

Dowody porównania zawartości Git:

| Plik lub drzewo | Wspólny blob/tree SHA |
|---|---|
| `.lovable/project.json` | `6c5b6ac278d15f9fa45ed1b6df38559da5e66939` |
| `bun.lock` | `b8a01cbea14fbe620416975d7b40f95aef1eae85` |
| `vite.config.ts` | `174e074ca30e73877870b02eb162b0c28848051e` |
| `tsconfig.json` | `a522d218dc57d4ca2577d8fc1f8ac864b7711ba7` |
| `src/styles.css` | `a9806b42292adb007181f1689c453142d503f116` |
| `src/components` | `0076fcaa105bc14eb91627cfed1d1657d6c0ad4b` |
| `src/server.ts` | `20500c7f347db7dd59ff59e295be226aa317757f` |

Domyślny katalog zawiera kilkadziesiąt komponentów shadcn/Radix i zależności między innymi wykresów, karuzeli i paneli. Polecenie „minimum konfiguracyjne” NIE spowodowało ich usunięcia. To gotowy szablon Lovable z pustą stroną, nie przycięty zestaw zależności i nie katalog Untitled UI.

`src/server.ts` należy do powłoki TanStack/Lovable. Jego obecność nie oznacza zaimplementowanego backendu kont, PostgreSQL ani Better Auth. Te elementy dopiero budujemy.

## Różnice

| Plik | App Kit | Site Kit |
|---|---|---|
| `package.json` | Nazwa `tanstack_start_ts`, bez wersji | Nazwa `t13-site-kit`, wersja `0.0.1` |
| `README.md` | Domyślny opis projektu Lovable | Krótki opis T13 Site Kit i uruchomienia |
| `src/routes/__root.tsx` | Nagłówek z nazwą, meta author T13, wpis `twitter:site` o wartości `@t13` | Zmienione metadane; usunięty author i twitter:site; bez dodatkowego nagłówka |
| `src/routes/index.tsx` | Nazwa, angielski opis, przycisk do dokumentacji Lovable | Sama nazwa na wyśrodkowanym ekranie |

Wpis `@t13` został dodany przez agenta; nie był potwierdzonym kontem społecznościowym projektu i nie powinien pozostać w zestawie white label.

Site Kit wykonał zmianę bez pytania. App Kit najpierw odpowiedział, że nie potrafi utworzyć nowego projektu i zapytał o konfigurację bieżącego. Po odpowiedzi użytkownika „Tak” dodał nagłówek, opis i przycisk. Identyczny był zatem prompt początkowy poza nazwą, ale nie pełny przebieg rozmowy.

## Konsekwencje dla budowy App Kita

Zachowujemy działającą powłokę Lovable, ale zastępujemy stockowy katalog potrzebnymi rzeczywistymi źródłami Untitled UI MIT, przygotowujemy neutralne białe UI i dokładamy uzgodniony backend. Nie nadajemy aplikacji kolorów ani obowiązkowego logo T13. Nie ma potrzeby zmiany architektury z powodu różnic między tymi dwiema odpowiedziami agenta.

To odczyt i porównanie Site Kita — nie polecenie jego przebudowy. W tym zadaniu zmieniamy wyłącznie App Kit.
