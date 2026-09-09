import type { ReactNode } from "react";
import { cx } from "@/components/kit/utils/cx";

type AlertTone = "info" | "error" | "success";
const styles: Record<AlertTone, string> = {
  info: "border-gray-200 bg-gray-50 text-gray-700",
  error: "border-gray-300 bg-gray-100 text-gray-900",
  success: "border-gray-200 bg-white text-gray-900",
};

/** T13 composition; state is conveyed by text and semantics, not color alone. */
export function Alert({ tone, variant, title, children, className }: {
  tone?: AlertTone;
  /** Compatibility with the initial composition; prefer tone in new screens. */
  variant?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const state = tone ?? variant ?? "info";
  return (
    <div role={state === "error" ? "alert" : "status"}
      className={cx("rounded-lg border px-4 py-3 text-sm", styles[state], className)}>
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? <div className={cx(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
