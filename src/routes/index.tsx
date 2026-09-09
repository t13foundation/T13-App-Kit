import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "T13 App Kit" },
      { name: "description", content: "Minimal starter kit for structured applications." },
      { property: "og:title", content: "T13 App Kit" },
      { property: "og:description", content: "Minimal starter kit for structured applications." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          T13 App Kit
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Minimal starter for structured applications. Add routes, components, and data as needed.
        </p>
        <div className="mt-8">
          <a
            href="https://docs.lovable.dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Read the docs
          </a>
        </div>
      </div>
    </div>
  );
}
