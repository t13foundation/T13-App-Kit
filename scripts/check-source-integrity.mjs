import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

/** Files whose absence would silently hollow out the kit. */
const required = [
  "server/package.json",
  "server/bun.lock",
  "server/tsconfig.json",
  "server/src/app.ts",
  "server/src/auth.ts",
  "server/src/db/schema.ts",
  "server/src/db/client.ts",
  "server/src/mail/send.ts",
  "server/src/main.ts",
  "server/drizzle/0000_init.sql",
  "server/drizzle/meta/_journal.json",
  "src/app.config.ts",
  "src/lib/api.ts",
  "src/lib/auth-client.ts",
  "src/components/kit/index.ts",
  "src/components/kit/controls/button.tsx",
  "src/components/kit/forms/input.tsx",
  "src/components/kit/tokens/theme.css",
  "src/components/kit/themes/neutral.css",
  "src/components/kit/layout/container.tsx",
  "src/components/kit/blocks/auth-card.tsx",
  "src/components/kit/blocks/page-header.tsx",
  "src/components/kit/blocks/page-section.tsx",
  "src/routes/api.$.ts",
  "src/routes/account.tsx",
  "src/routes/index.tsx",
  "third-party/untitledui-react/LICENSE",
  "third-party/untitledui-react/SOURCE.md",
];

const tracked = new Set(
  execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean),
);
const missing = required.filter(
  (path) => !existsSync(new URL("../" + path, import.meta.url)) || !tracked.has(path),
);
const environments = [...tracked].filter(
  (path) => /(^|\/)\.env($|\.)/.test(path) && !/\.example$/.test(path),
);

if (missing.length || environments.length) {
  console.error(
    JSON.stringify({ missingOrUntracked: missing, trackedEnvironmentFiles: environments }, null, 2),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Source integrity passed: ${required.length} required files are present and tracked; no environment files are tracked.`,
  );
}
