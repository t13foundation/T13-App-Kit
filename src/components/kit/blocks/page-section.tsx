import type { ReactNode } from "react";

import { Container } from "@/components/kit/layout/container";

/**
 * Document-level section: a numbered-feeling heading, an optional lead and the
 * content. Sections are separated by a single rule and one vertical rhythm.
 */
export function PageSection({
  id,
  title,
  description,
  actions,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-secondary kit-section">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-primary">{title}</h2>
            {description ? (
              <p data-measure="prose" className="kit-measure mt-2 text-sm text-tertiary">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
        {children ? <div className="kit-stack mt-8">{children}</div> : null}
      </Container>
    </section>
  );
}
