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
    <header className="border-b border-secondary bg-primary py-12 sm:py-16">
      <Container>
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.14em] text-tertiary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-display-xs font-semibold tracking-tight text-primary sm:text-display-sm">
          {title}
        </h1>
        {description ? <p className="mt-4 max-w-2xl text-md text-tertiary">{description}</p> : null}
        {meta ? <div className="mt-6 flex flex-wrap items-center gap-2">{meta}</div> : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </Container>
    </header>
  );
}
