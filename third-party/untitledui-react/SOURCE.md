# Untitled UI React (upstream source)

- Upstream: https://github.com/untitleduico/react (public, MIT)
- License: MIT — full text in `./LICENSE`
- Vendored commit: `c981a73bcd6b6c68d2a54070f20f020191212828` (main, 2026-08-26)
- Fetched via `codeload.github.com/untitleduico/react/tar.gz/refs/heads/main`

Only the free/public parts of the repository are vendored. No PRO components,
no marketing pages, no image/logo assets, no demo or story files.

## Vendored files (upstream path -> repo path)

| Upstream | Here |
| --- | --- |
| `utils/cx.ts` | `src/components/kit/utils/cx.ts` |
| `utils/is-react-component.ts` | `src/components/kit/utils/is-react-component.ts` |
| `utils/timezones.tsx` | `src/components/kit/utils/timezones.tsx` |
| `styles/theme.css` | `src/components/kit/tokens/theme.css` |
| `components/base/buttons/button.tsx` | `src/components/kit/controls/button.tsx` |
| `components/base/checkbox/checkbox.tsx` | `src/components/kit/controls/checkbox.tsx` |
| `components/base/toggle/toggle.tsx` | `src/components/kit/controls/toggle.tsx` |
| `components/base/input/input.tsx` | `src/components/kit/forms/input.tsx` |
| `components/base/input/label.tsx` | `src/components/kit/forms/label.tsx` |
| `components/base/input/hint-text.tsx` | `src/components/kit/forms/hint-text.tsx` |
| `components/base/input/pin-input.tsx` | `src/components/kit/forms/pin-input.tsx` |
| `components/base/textarea/textarea.tsx` | `src/components/kit/forms/textarea.tsx` |
| `components/base/select/select-native.tsx` | `src/components/kit/forms/select-native.tsx` |
| `components/base/form/form.tsx` | `src/components/kit/forms/form.tsx` |
| `components/base/tooltip/tooltip.tsx` | `src/components/kit/feedback/tooltip.tsx` |
| `components/base/badges/badges.tsx` | `src/components/kit/feedback/badges.tsx` |

## Local modifications

1. Import specifiers rewritten from `@/utils/*` and `@/components/base/*`
   to `@/components/kit/*`. No logic changes.
2. Brand color ramp neutralized in `src/components/kit/themes/neutral.css`
   (an override layer; `tokens/theme.css` itself is unmodified).

Everything under `src/components/kit/{navigation,blocks}` and `index.ts` is
original code written for this kit on top of the vendored primitives.
