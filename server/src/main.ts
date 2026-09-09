import { buildApp } from './app.ts';
import { closeDatabase } from './db/client.ts';
import { env } from './env.ts';

const cfg = env();
const app = await buildApp();
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  try { await app.close(); await closeDatabase(); }
  catch { process.exitCode = 1; }
}
process.once('SIGTERM', () => { void stop(); });
process.once('SIGINT', () => { void stop(); });
try { await app.listen({ port: cfg.PORT, host: cfg.HOST }); }
catch { app.log.error({ code: 'listen_failed' }, 'startup'); await stop(); process.exitCode = 1; }
