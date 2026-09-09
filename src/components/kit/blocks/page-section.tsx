import type { ReactNode } from "react";

/** Settings section: heading, description and a bordered content area. */
export function PageSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-gray-200 py-8 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-lg">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-6 flex max-w-lg flex-col gap-4">{children}</div>
    </section>
  );
}
