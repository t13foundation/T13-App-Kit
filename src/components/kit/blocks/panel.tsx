import type { ReactNode } from "react";

import { cx } from "@/components/kit/utils/cx";

/** Bordered card grouping one set of related controls or facts. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-xl border border-secondary bg-primary p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-md font-semibold text-primary">{title}</h2>
          {description ? <p className="mt-1 text-sm text-tertiary">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children ? <div className="mt-5 flex flex-col gap-5">{children}</div> : null}
    </section>
  );
}
