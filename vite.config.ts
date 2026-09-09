// The Lovable wrapper owns TanStack Start, React, Tailwind, aliases and Nitro/Cloudflare.
// Do not install parallel instances of those plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ResolvedConfig } from "vite";
import { readSupabaseConfig } from "./src/lib/supabase/config";

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: {
    plugins: [{
      name: "app-kit-public-supabase-config",
      configResolved(config: ResolvedConfig) {
        // Fail before emitting assets if a privileged key was put in a public variable.
        // Missing both variables is allowed: the introduction/catalog still work.
        readSupabaseConfig(config.env);
      },
    }],
  },
});
