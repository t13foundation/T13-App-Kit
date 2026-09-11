import { buildApp } from "./app.ts";
import { closeDatabase } from "./db/client.ts";
import { env } from "./env.ts";

try {
  const cfg = env();
  const app = await buildApp();
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await app.close();
    await closeDatabase();
  };
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void stop().catch(() => {
        process.exitCode = 1;
      });
    });
  }
  await app.listen({ port: cfg.PORT, host: cfg.HOST });
} catch {
  // Do not serialize errors that can contain a DB URL, SMTP credentials or tokens.
  console.error(
    "API startup failed. Check local environment configuration and service availability.",
  );
  await closeDatabase().catch(() => {});
  process.exitCode = 1;
}
