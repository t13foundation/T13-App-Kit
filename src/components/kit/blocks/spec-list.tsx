import type { ReactNode } from "react";

/** Two-column list of stable facts: path, value, status. */
export function SpecList({ items }: { items: { term: string; description: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-secondary border-y border-secondary">
      {items.map((item) => (
        <div key={item.term} className="kit-spec-row">
          <dt className="text-sm font-medium text-secondary">{item.term}</dt>
          <dd data-measure="prose" className="kit-measure text-sm text-tertiary">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}
