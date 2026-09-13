import type { ReactNode } from "react";

import { Container } from "@/components/kit/layout/container";

/**
 * Opening block of a page: one eyebrow, one title, one lead paragraph and
 * optional inline facts and actions. Every page uses the same rhythm.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-secondary bg-primary kit-section">
      <Container>
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.14em] text-tertiary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="kit-page-title mt-3 font-semibold tracking-tight text-primary">{title}</h1>
        {description ? (
          <p data-measure="prose" className="kit-measure mt-4 text-md text-tertiary">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-6 flex flex-wrap items-center gap-2">{meta}</div> : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </Container>
    </header>
  );
}
