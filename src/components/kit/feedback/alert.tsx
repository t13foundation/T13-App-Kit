import type { ReactNode } from "react";

import { cx } from "../utils/cx";

export type AlertTone = "neutral" | "success" | "error";

const tones: Record<AlertTone, string> = {
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
  success: "border-gray-300 bg-white text-gray-900",
  error: "border-gray-900 bg-white text-gray-900",
};

/** Neutral inline message. Tone is conveyed by border weight, not by color. */
export function Alert({
  tone = "neutral",
  title,
  children,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div role="status" className={cx("rounded-lg border px-4 py-3 text-sm", tones[tone])}>
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? <div className={cx(title && "mt-1", "text-gray-600")}>{children}</div> : null}
    </div>
  );
}
