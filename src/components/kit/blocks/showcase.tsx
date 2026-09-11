import type { ReactNode } from "react";

import { CodeBlock } from "@/components/kit/blocks/code-block";

/**
 * One component presented the same way everywhere: what it is called, what it
 * is for, a live instance and the exact code that produced it.
 */
export function Showcase({
  name,
  description,
  code,
  children,
}: {
  name: string;
  description: string;
  code: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-primary">{name}</h3>
        <p className="mt-1 text-sm text-tertiary">{description}</p>
      </div>
      <div className="flex flex-wrap items-start gap-4 rounded-lg border border-secondary bg-primary p-5">
        {children}
      </div>
      <CodeBlock>{code}</CodeBlock>
    </article>
  );
}
