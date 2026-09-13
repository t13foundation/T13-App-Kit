import type { ReactNode } from "react";
import { cx } from "@/components/kit/utils/cx";

export type ContentWidth = "page" | "wide" | "form" | "prose";

/** Page gutters and named widths. Nested content uses FormLayout/ArticleLayout. */
export function Container({
  children,
  className,
  size = "page",
}: {
  children: ReactNode;
  className?: string;
  size?: ContentWidth;
}) {
  return (
    <div data-width={size} className={cx("kit-container", className)}>
      {children}
    </div>
  );
}
