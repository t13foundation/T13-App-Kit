/**
 * Guard for every destructive test operation (TRUNCATE, Mailpit wipe).
 *
 * The tests refuse to touch anything that is not an explicitly enabled, local,
 * dedicated `appkit_test` database. The development database `appkit` is never
 * cleared.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const REQUIRED_DATABASE = "appkit_test";

export function assertResettableTestDatabase(source: NodeJS.ProcessEnv = process.env): URL {
  if (source["NODE_ENV"] !== "test") {
    throw new Error("test_database_guard: NODE_ENV must be 'test'");
  }
  if (source["ALLOW_TEST_DATABASE_RESET"] !== "true") {
    throw new Error("test_database_guard: ALLOW_TEST_DATABASE_RESET must be 'true'");
  }
  const raw = source["DATABASE_URL"];
  if (!raw) throw new Error("test_database_guard: DATABASE_URL is not set");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("test_database_guard: DATABASE_URL is malformed");
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    throw new Error("test_database_guard: DATABASE_URL must be a postgres url");
  }
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error("test_database_guard: refusing a non-local database host");
  }
  const database = url.pathname.replace(/^\//, "");
  if (database !== REQUIRED_DATABASE) {
    throw new Error(`test_database_guard: refusing database '${database}', expected '${REQUIRED_DATABASE}'`);
  }
  return url;
}

/** Mailpit is only wiped when it is a local instance. */
export function assertLocalMailpit(api: string): string {
  const url = new URL(api);
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error("test_database_guard: refusing a non-local Mailpit instance");
  }
  return url.origin;
}
