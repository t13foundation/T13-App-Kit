import { createFileRoute } from "@tanstack/react-router";
import { SupabaseWorkspace } from "../features/notes/workspace";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [{ title: "Prywatne notatki" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SupabaseWorkspace,
});
