# Layout contract

Use the existing layout before adding a page. Shared layout code and tokens are
identical in both kits; each client can brand and configure its own copy.

| Width   | Maximum | Use                                                   |
| ------- | ------- | ----------------------------------------------------- |
| `page`  | 80rem   | Default page and global navigation alignment          |
| `wide`  | 96rem   | Explicit wide data section; not the default for prose |
| `form`  | 32rem   | Forms and authentication                              |
| `prose` | 65ch    | Articles and explanatory text                         |

These are configurable defaults, not universal UX limits. Maxima exclude the
outer gutter. Gutters vary from 1rem to 2rem; section spacing from 2rem to 4rem;
content gaps from 1rem to 1.5rem. All live in
`src/components/kit/themes/layout.css`. Text width remains bounded on ultrawide
screens, and every measure shrinks to the available width.

- `Container` owns page gutters. Avoid nesting it; use `FormLayout` or
  `ArticleLayout` for a narrower block inside a page.
- `PageLayout` aligns a page header and content with default navigation.
  `PageHeader` and `PageSection` compose multi-section pages using the same rules.
- `SidebarLayout` stacks its sidebar before the content below 56rem of container
  width. It does not depend on the device name or viewport alone.
- `ContentGrid` fits as many columns as available space permits, with a preferred
  minimum of 18rem and a single shrinking column on small containers.
- Reuse the named widths and spacing; do not introduce route-specific max-widths,
  fixed page heights or global overflow hiding. Buttons and navigation groups wrap.
  Long text must stay inside its container; code/table scrolling remains local.

The overview includes live layout examples. Check every changed screen across
widths and on either side of a layout transition, including low-height windows,
long content, keyboard navigation and zoom/text resizing. Check bounds as well as
appearance; a screenshot at one phone and one desktop size is insufficient.
Do not describe finite tests as proof of every possible viewport/content combination.

Design references: [GOV.UK layout](https://design-system.service.gov.uk/styles/layout/)
recommends screen-based layouts and bounded line lengths;
[WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) describes
320 CSS px reflow and the 400% zoom equivalent. Our width values are project choices.
