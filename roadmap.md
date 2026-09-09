# T13 App Kit — roadmap przyrostu 1

Zakres: konfiguracja, katalog UI (MIT), pionowa ścieżka konta web + backend, testy.

## Do domknięcia (przegląd z 2026-09-09)

- [ ] 1. Frontend: naprawić `src/lib/account.ts` (SessionList, preferences PUT, revoke-others),
      dodać `/account`, `/catalog`, poprawić root/index, typecheck + build web.
- [ ] 2. Auth UX: brak połykania błędów w `forgot-password` i `verify-email`; sukces tylko po
      poprawnej odpowiedzi; `callbackURL`/`redirectTo` na publiczny origin; `AUTH_URL` = origin proxy;
      użyć oficjalnego klienta Better Auth zamiast ręcznego protokołu.
- [ ] 3. White label: neutralna skala R=G=B w `neutral.css`, usunąć T13/@t13/Lovable CTA z meta i UI,
      katalog z udokumentowanymi przykładami i PL/EN, poprawić `third-party/.../SOURCE.md`
      (timezones/badges usunięte).
- [ ] 4. Bezpieczeństwo API: `trustProxy` bez listy — usunąć; odrzucać `Forwarded`/`X-Forwarded-*`/
      `X-Real-IP` od klienta; ochrona Origin/CSRF na mutacjach `/me`; zablokować `/api/auth/list-sessions`;
      `trustDevice` wyłączony serwerowo; świeża sesja <=5 min dla operacji wrażliwych.
- [ ] 5. Konfiguracja i odpowiedzi: env odrzuca `change-me`, URL z credentials/query/path/wildcard;
      HTTPS w produkcji; secure cookies na HTTPS preview; `/status` sprawdza realną gotowość bazy;
      błędy bez SQL/sekretów/URL resetu; `no-store`; limit payloadu w trakcie odczytu.
- [ ] 6. Testy: `.gitignore` na wszystkie `.env` (w tym `server/.env.test`); testy odmawiają czyszczenia
      bez jawnej lokalnej bazy testowej `appkit_test`; dokładne statusy; testy obcego użytkownika,
      Origin, direct list-sessions, ponownego kodu backup.
- [ ] 7. Dokumentacja: README, `docs/start.md`, `docs/status.md`, `t13.project.json`, compose PG+Mailpit,
      skrypty, krótki `AGENTS.md` z zachowaną sekcją LOVABLE; zachować
      `docs/reference/lovable-template-comparison.md`; zapisany raport z komendami i wynikami.

## Poza tym przyrostem

Organizacje, pliki, sharing, admin, provenance, klient Expo, AI i badania — planned.
