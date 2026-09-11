import { cx } from "@/components/kit/utils/cx";

/**
 * Verbatim command or snippet. Renders without JavaScript and scrolls
 * horizontally instead of wrapping, so a command is never silently broken.
 */
export function CodeBlock({
  caption,
  children,
  className,
}: {
  caption?: string;
  children: string;
  className?: string;
}) {
  return (
    <figure
      className={cx("overflow-hidden rounded-lg border border-secondary bg-secondary", className)}
    >
      {caption ? (
        <figcaption className="border-b border-secondary px-4 py-2 text-xs font-medium text-tertiary">
          {caption}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-5 text-primary">
        <code>{children}</code>
      </pre>
    </figure>
  );
}
