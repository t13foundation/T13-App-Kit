import { buildApp } from "./app.ts";
import { env } from "./env.ts";

const cfg = env(); // throws (and exits) when configuration is missing/invalid
const app = await buildApp();

try {
  await app.listen({ port: cfg.PORT, host: cfg.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
