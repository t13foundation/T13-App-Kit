import type { ReactNode } from "react";

/**
 * Centered card used by every account screen. Classic, roomy, no illustration
 * and no marketing copy.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
      <div className="mt-8 flex flex-col gap-5">{children}</div>
      {footer ? <div className="mt-8 text-sm text-gray-600">{footer}</div> : null}
    </div>
  );
}
