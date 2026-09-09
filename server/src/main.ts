import { buildApp } from "./app.ts";
import { env } from "./env.ts";

const cfg = env(); // throws (and exits) when configuration is missing/invalid
const app = await buildApp();

try {
  await app.listen({ port: cfg.PORT, host: cfg.HOST });
} catch (error) {
  // Name only: a startup failure must not print configuration or secrets.
  app.log.error({ err: error instanceof Error ? error.name : "Error" }, "listen_failed");
  process.exit(1);
}
