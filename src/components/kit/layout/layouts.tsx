import type { ComponentProps, ReactNode } from "react";
import { Container } from "./container";
import { PageHeader } from "../blocks/page-header";

/** One page header and content area aligned with the global navigation. */
export function PageLayout({
  children,
  ...header
}: ComponentProps<typeof PageHeader> & { children: ReactNode }) {
  return (
    <>
      <PageHeader {...header} />
      <Container>
        <div className="kit-section kit-stack">{children}</div>
      </Container>
    </>
  );
}

/** A form inside a page, with no second set of page gutters. */
export function FormLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kit-measure kit-stack" data-measure="form">
      {children}
    </div>
  );
}

/** Reading width stays bounded even inside a wide page or sidebar layout. */
export function ArticleLayout({ children }: { children: ReactNode }) {
  return (
    <article className="kit-measure kit-stack" data-measure="prose">
      {children}
    </article>
  );
}

/** The sidebar stacks above the content when its own container becomes narrow. */
export function SidebarLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="kit-sidebar">
      <div>{sidebar}</div>
      <div className="kit-stack">{children}</div>
    </div>
  );
}

/** Columns depend on available space, rather than device names. */
export function ContentGrid({ children }: { children: ReactNode }) {
  return <div className="kit-grid">{children}</div>;
}
