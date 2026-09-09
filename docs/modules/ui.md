# Module card: UI catalog (core)

Status: enabled. One canonical directory: `src/components/kit`.

## Provenance

Base primitives are copied from the public MIT repository
`github.com/untitleduico/react`, commit
`c981a73bcd6b6c68d2a54070f20f020191212828` (2026-08-26). The license and the
list of copied files are kept in `third-party/untitledui-react/` — see
`LICENSE` and `SOURCE.md`. Nothing from the PRO offering is used, and no
imitation is labelled as Untitled UI.

## Structure

```
tokens/      upstream design tokens, untouched
themes/      white-label override: pure white, strictly neutral R=G=B ramp
controls/    button, checkbox, toggle
forms/       input, label, hint, textarea, native select, pin input, form
navigation/  application header
feedback/    tooltip, alert
blocks/      auth card, page section
```

`src/components/kit/index.ts` is the only import surface used by screens.
`/catalog` renders documented live examples and needs no account and no
backend.

## Look

White `#FFFFFF` background, neutral grays, near-black primary buttons. No brand
colors, gradients, illustrations, logos or marketing content.

## Tests

Covered by `bun run build` and `bunx tsgo --noEmit`, plus a browser check of
`/`, `/catalog` and `/sign-in`.

## Removing / restoring

Components are plain files with no runtime registry. Delete what a project does
not use and keep `index.ts` in sync; restore by copying the files back from a
previous version or from the pinned upstream commit.
