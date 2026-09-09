import type { ReactNode } from "react";

import { cx } from "@/components/kit/utils/cx";

type AlertVariant = "info" | "error" | "success";

const variants: Record<AlertVariant, string> = {
  info: "border-gray-200 bg-gray-50 text-gray-700",
  error: "border-gray-300 bg-gray-100 text-gray-900",
  success: "border-gray-200 bg-white text-gray-900",
};

/**
 * Neutral status message. Deliberately monochrome: state is carried by the
 * text and the optional title, not by color.
 */
export const Alert = ({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) => (
  <div
    role={variant === "error" ? "alert" : "status"}
    className={cx("rounded-lg border px-4 py-3 text-sm", variants[variant], className)}
  >
    {title ? <p className="font-medium">{title}</p> : null}
    {children ? <div className={cx(title && "mt-1")}>{children}</div> : null}
  </div>
);
