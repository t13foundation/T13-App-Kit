/** Real REST/Auth + Mailpit test, deliberately separate from the unit-test glob.
 * Requires a disposable local Supabase initialized from this slice's schema.
 * Never runs against a hosted project; never uses a service-role key.
 */
import { randomUUID, randomBytes } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { readSupabaseConfig } from "../src/lib/supabase/config.ts";

class StepFailure extends Error {}
function check(condition, step) {
  if (!condition) throw new StepFailure(step);
}
function loopbackOrigin(raw, port) {
  const url = new URL(raw);
  check(
    url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
      url.port === port &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash,
    "Refusing a nonlocal or unexpected endpoint",
  );
  return url.origin;
}
async function run() {
  check(
    process.env.APP_KIT_TEST_CONFIRM === "LOCAL_SYNTHETIC",
    "Set APP_KIT_TEST_CONFIRM=LOCAL_SYNTHETIC for a disposable local database",
  );
  const origin = loopbackOrigin(process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:55321", "55321");
  const mail = loopbackOrigin(process.env.MAILPIT_TEST_URL ?? "http://127.0.0.1:55324", "55324");
  const config = readSupabaseConfig({
    VITE_SUPABASE_URL: origin,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_TEST_PUBLISHABLE_KEY,
  });
  check(config, "Missing local public key");
  async function api(path, { token, body, method = "GET" } = {}) {
    const headers = {
      apikey: config.key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${origin}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => null);
    return { status: response.status, ok: response.ok, data };
  }
  async function mailJson(path) {
    const response = await fetch(`${mail}${path}`, {
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    check(response.ok, "Local mail capture unavailable");
    return response.json();
  }
  async function confirmationCode(email) {
    for (let attempt = 0; attempt < 25; attempt++) {
      const inbox = await mailJson("/api/v1/messages?limit=100");
      const message = inbox.messages?.find((item) =>
        item.To?.some((to) => to.Address?.toLowerCase() === email),
      );
      if (message) {
        const detail = await mailJson(`/api/v1/message/${encodeURIComponent(message.ID)}`);
        const code = detail.HTML?.match(/id=["']confirmation-code["'][^>]*>\s*(\d{6})\s*</i)?.[1];
        check(code, "Expected confirmation code missing from the local template");
        return code;
      }
      await pause(400);
    }
    throw new StepFailure("Confirmation message was not captured locally");
  }
  const runId = randomUUID();
  async function account(suffix) {
    const email = `appkit-${runId}-${suffix}@example.test`;
    const password = `A!${randomBytes(24).toString("base64url")}`;
    const signup = await api("/auth/v1/signup", { method: "POST", body: { email, password } });
    check(signup.ok && !signup.data?.access_token, "Signup must require email confirmation");
    const unverified = await api("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
    });
    check(!unverified.ok, "Unverified email must not sign in");
    const token = await confirmationCode(email);
    const verified = await api("/auth/v1/verify", {
      method: "POST",
      body: { email, token, type: "signup" },
    });
    check(verified.ok && verified.data?.user?.email_confirmed_at, "Email confirmation failed");
    const replay = await api("/auth/v1/verify", {
      method: "POST",
      body: { email, token, type: "signup" },
    });
    check(!replay.ok, "Confirmation code replay must be rejected");
    const login = await api("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
    });
    check(
      login.ok && login.data?.access_token && login.data?.user?.id,
      "Verified account login failed",
    );
    return { id: login.data.user.id, token: login.data.access_token };
  }
  // Sequential signup avoids a test harness accidentally asserting relaxed signup limits.
  const a = await account("a");
  await pause(1100);
  const b = await account("b");
  const create = async (actor, title) => {
    const result = await api("/rest/v1/notes", {
      method: "POST",
      token: actor.token,
      body: { owner_id: actor.id, title, body: "Synthetic fixture" },
    });
    check(result.ok && result.data?.length === 1, "Owner could not create a note");
    return result.data[0];
  };
  const noteA = await create(a, "A");
  const noteB = await create(b, "B");
  const anon = await api("/rest/v1/notes?select=id");
  check([401, 403].includes(anon.status), "Anonymous Notes access must be denied");
  const own = await api("/rest/v1/notes?select=id,owner_id", { token: a.token });
  check(
    own.ok && own.data.length === 1 && own.data[0].id === noteA.id,
    "User list must contain only owned rows",
  );
  for (const [attacker, target] of [
    [a, noteB],
    [b, noteA],
  ]) {
    for (const method of ["GET", "PATCH", "DELETE"]) {
      const result = await api(`/rest/v1/notes?id=eq.${target.id}&select=id`, {
        token: attacker.token,
        method,
        body: method === "PATCH" ? { title: "Foreign write" } : undefined,
      });
      check(
        (result.ok && Array.isArray(result.data) && result.data.length === 0) ||
          result.status === 403,
        `Cross-account ${method} was not denied`,
      );
    }
  }
  const forged = await api("/rest/v1/notes", {
    token: a.token,
    method: "POST",
    body: { owner_id: b.id, title: "Forged" },
  });
  check(forged.status === 403, "Foreign-owner insert must fail");
  const transfer = await api(`/rest/v1/notes?id=eq.${noteA.id}`, {
    token: a.token,
    method: "PATCH",
    body: { owner_id: b.id },
  });
  check(transfer.status === 403, "Ownership transfer must fail");
  const invalid = await api("/rest/v1/notes", {
    token: a.token,
    method: "POST",
    body: { owner_id: a.id, title: " ", body: "x".repeat(20001) },
  });
  check(invalid.status === 400, "Database constraints must reject invalid content");
  const changed = await api(
    `/rest/v1/notes?id=eq.${noteA.id}&updated_at=eq.${encodeURIComponent(noteA.updated_at)}`,
    { token: a.token, method: "PATCH", body: { title: "A edited" } },
  );
  check(
    changed.ok && changed.data?.length === 1 && changed.data[0].title === "A edited",
    "Owner edit failed",
  );
  const stale = await api(
    `/rest/v1/notes?id=eq.${noteA.id}&updated_at=eq.${encodeURIComponent(noteA.updated_at)}`,
    { token: a.token, method: "PATCH", body: { title: "Stale overwrite" } },
  );
  check(stale.ok && stale.data?.length === 0, "Stale edit must not overwrite a newer record");
  const removed = await api(`/rest/v1/notes?id=eq.${noteA.id}`, {
    token: a.token,
    method: "DELETE",
  });
  check(removed.ok && removed.data?.length === 1, "Owner delete failed");
  const survivor = await api(`/rest/v1/notes?id=eq.${noteB.id}&select=id,title`, {
    token: b.token,
  });
  check(
    survivor.ok && survivor.data?.length === 1 && survivor.data[0].title === "B",
    "Second account must remain intact",
  );
  await api(`/rest/v1/notes?id=eq.${noteB.id}`, { token: b.token, method: "DELETE" });
  for (const actor of [a, b]) {
    const logout = await api("/auth/v1/logout?scope=local", { token: actor.token, method: "POST" });
    check(logout.ok, "Local sign-out was not acknowledged");
  }
  console.log(
    "PASS: two synthetic accounts; confirmation/replay/login; own CRUD; cross-user API denials; immutable ownership; validation; stale edits; logout.",
  );
  console.log(
    "Local synthetic Auth identities remain; discard the disposable local database when finished.",
  );
}
run().catch((error) => {
  // Only step labels authored above are useful; no response bodies, tokens, URLs or OTPs.
  const known = error instanceof StepFailure;
  console.error(
    known
      ? error.message
      : "Local integration request failed; inspect the disposable environment without logging credentials.",
  );
  process.exitCode = 1;
});
