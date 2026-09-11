import type { ReactNode } from "react";

import { cx } from "@/components/kit/utils/cx";

export type BadgeTone = "neutral" | "subtle";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-secondary text-secondary ring-secondary",
  subtle: "bg-primary text-tertiary ring-secondary",
};

/** Small inline fact: license, version, stack element. Never the only carrier of meaning. */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
