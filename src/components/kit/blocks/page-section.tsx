import type { ReactNode } from "react";

import { cx } from "@/components/kit/utils/cx";

/** Plain content section with a heading and generous spacing. */
export const PageSection = ({
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
}) => (
  <section className={cx("rounded-xl border border-gray-200 bg-white p-6", className)}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      </div>
      {actions}
    </div>
    {children ? <div className="mt-5">{children}</div> : null}
  </section>
);
