import type { ReactNode } from "react";
import { Container } from "../layout/container";

/**
 * Centered card used by every account screen. Classic, roomy, no illustration
 * and no marketing copy.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Container size="form" className="kit-section">
      <h1 className="text-display-xs font-semibold tracking-tight text-primary">{title}</h1>
      {description ? <p className="mt-2 text-sm text-tertiary">{description}</p> : null}
      <div className="mt-8 flex flex-col gap-5">{children}</div>
      {footer ? <div className="mt-8 text-sm text-tertiary">{footer}</div> : null}
    </Container>
  );
}
