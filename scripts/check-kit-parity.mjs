import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The shared UI layer is vendored into T13 App Kit and T13 Site Kit as identical
 * files. This check fails when a copy drifts, so the two kits cannot silently
 * grow apart. Regenerate with `node scripts/check-kit-parity.mjs --write` only
 * after deliberately changing the layer in both kits.
 */
const root = new URL("../", import.meta.url);
const manifestPath = new URL("kit-manifest.json", root);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const digest = (path) =>
  createHash("sha256")
    .update(readFileSync(new URL(path, root)))
    .digest("hex");

if (process.argv.includes("--write")) {
  const files = Object.fromEntries(manifest.files.map((path) => [path, undefined]));
  manifest.sha256 = Object.fromEntries(Object.keys(files).map((path) => [path, digest(path)]));
  const { writeFileSync } = await import("node:fs");
  writeFileSync(fileURLToPath(manifestPath), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Kit manifest rewritten for ${manifest.files.length} shared files.`);
  process.exit(0);
}

const missing = manifest.files.filter((path) => !existsSync(new URL(path, root)));
const drifted = manifest.files
  .filter((path) => !missing.includes(path))
  .filter((path) => digest(path) !== manifest.sha256[path]);

if (missing.length || drifted.length) {
  console.error(JSON.stringify({ missing, drifted }, null, 2));
  console.error(
    "The shared UI layer no longer matches the recorded manifest. Apply the same change to the other kit, then rerun with --write.",
  );
  process.exitCode = 1;
} else {
  console.log(
    `Kit parity verified: ${manifest.files.length} shared files match the recorded manifest.`,
  );
}
