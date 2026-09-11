# Module card: UI catalog (core)

Status: enabled. One canonical directory: `src/components/kit`.

## Provenance

Base primitives are copied from the public MIT repository
`github.com/untitleduico/react`, commit
`c981a73bcd6b6c68d2a54070f20f020191212828` (2026-08-26). The license and the
list of copied files are kept in `third-party/untitledui-react/` — see
`LICENSE` and `SOURCE.md`. Nothing from the PRO offering is used, and no
imitation is labelled as Untitled UI.

Vendored files are excluded from Prettier and from the repository lint rules so
they stay byte-identical to upstream and remain diffable against it.

## Structure

```
tokens/      upstream design tokens, untouched
themes/      white-label override: pure white, strictly neutral R=G=B ramp
utils/       class merging helpers
controls/    button, checkbox, toggle
forms/       input, label, hint, textarea, native select, pin input, form
feedback/    alert, badge, tooltip
layout/      the single page measure shared by every screen
navigation/  shell navigation and footer
blocks/      auth card, account settings, page header, page section, panel,
             code block, spec list, showcase
```

`src/components/kit/index.ts` is the only import surface used by screens. The
overview route `/` is both the readme and a live presentation of this catalog;
it needs no account and no backend.

## Shared with T13 Site Kit

Everything except `forms/pin-input.tsx` and `blocks/{auth-card,account-settings}`
is vendored into T13 Site Kit as identical files, so the two kits render the
same controls at the same sizes. `kit-manifest.json` records the SHA-256 of each
shared file and `bun run check:kit` fails when a copy drifts. Change the shared
layer in both kits, then refresh the manifest with
`node scripts/check-kit-parity.mjs --write`.

## Look

White `#FFFFFF` background, neutral grays, near-black primary buttons. No brand
colors, gradients, illustrations, logos or marketing content. Alert tone is
carried by an icon, the wording and the ARIA role, never by color alone.

Compositions use the semantic token names (`text-primary`, `bg-secondary`,
`border-secondary`) rather than raw gray steps, so one theme change restyles the
whole kit.

## Tests

Covered by `bun run verify`, which includes the build, the full typecheck, the
shared-layer parity check and ESLint.

## Removing / restoring

Components are plain files with no runtime registry. Delete what a project does
not use and keep `index.ts` and `kit-manifest.json` in sync; restore by copying
the files back from a previous version or from the pinned upstream commit.
