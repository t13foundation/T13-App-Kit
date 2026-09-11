import type { ReactNode } from "react";

import { cx } from "@/components/kit/utils/cx";

/**
 * The single horizontal measure shared by every page in the T13 kits.
 * Changing it here changes every screen; do not hardcode a width elsewhere.
 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-3xl px-5 sm:px-6", className)}>{children}</div>;
}
