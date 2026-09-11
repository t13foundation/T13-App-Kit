import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, InfoCircle } from "@untitledui/icons";

import { cx } from "@/components/kit/utils/cx";

export type AlertTone = "info" | "success" | "error";

/**
 * Status message. The tone is carried by the icon, the wording and the ARIA
 * role, never by color alone, so the kit stays white-label and accessible.
 */
const tones = {
  info: {
    icon: InfoCircle,
    ring: "ring-secondary",
    surface: "bg-secondary",
    mark: "text-fg-quaternary",
  },
  success: {
    icon: CheckCircle,
    ring: "ring-secondary",
    surface: "bg-primary",
    mark: "text-fg-success-secondary",
  },
  error: {
    icon: AlertCircle,
    ring: "ring-primary",
    surface: "bg-primary",
    mark: "text-fg-error-secondary",
  },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, ring, surface, mark } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex gap-3 rounded-lg p-4 text-sm ring-1 ring-inset",
        ring,
        surface,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 stroke-[2.25px] text-fg-quaternary"
      />
      <div className="min-w-0">
        {title ? <p className="font-medium text-primary">{title}</p> : null}
        {children ? <div className={cx("text-tertiary", title && "mt-1")}>{children}</div> : null}
      </div>
    </div>
  );
}
