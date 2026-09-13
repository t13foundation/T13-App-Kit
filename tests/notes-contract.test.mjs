import test from "node:test";
import assert from "node:assert/strict";
import { readSupabaseConfig } from "../src/lib/supabase/config.ts";
import { protectNotesResponse } from "../src/lib/supabase/response-policy.ts";
import { validateNoteDraft } from "../src/features/notes/validation.ts";
import { listNotes, saveNote, deleteNote } from "../src/features/notes/repository.ts";

// Synthetic strings for key classification only; these are not usable credentials.
const publicKey = "sb_publishable_synthetic";
const env = (url, key = publicKey) => ({
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_PUBLISHABLE_KEY: key,
});
const jwt = (role) =>
  `synthetic.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.synthetic`;

test("missing configuration is distinguishable from partial configuration", () => {
  assert.equal(readSupabaseConfig({}), null);
  assert.throws(() => readSupabaseConfig({ VITE_SUPABASE_URL: "https://example.test" }));
  assert.throws(() => readSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: publicKey }));
});
test("accepts only HTTPS or HTTP loopback origins", () => {
  for (const url of [
    "https://example.test",
    "http://localhost:54321",
    "http://127.0.0.1:54321",
    "http://[::1]:54321",
  ]) {
    assert.equal(readSupabaseConfig(env(url)).url, url);
  }
  for (const url of [
    "http://example.test",
    "https://user:pass@example.test",
    "https://example.test/path",
    "https://example.test?token=x",
    "https://example.test#token",
    "file:///tmp",
  ]) {
    assert.throws(() => readSupabaseConfig(env(url)));
  }
});
test("configuration errors never echo supplied keys or malformed URLs", () => {
  const unsafe = "SENSITIVE_INPUT_DO_NOT_ECHO";
  assert.throws(
    () => readSupabaseConfig(env(unsafe)),
    (error) => !error.message.includes(unsafe),
  );
  assert.throws(
    () => readSupabaseConfig(env("https://example.test", unsafe)),
    (error) => !error.message.includes(unsafe),
  );
});
test("rejects service-role and secret keys but permits legacy local anon JWT shape", () => {
  assert.equal(readSupabaseConfig(env("http://localhost:54321", jwt("anon"))).key, jwt("anon"));
  for (const key of [
    jwt("service_role"),
    jwt("authenticated"),
    "sb_secret_synthetic",
    "not-a-jwt",
  ]) {
    assert.throws(() => readSupabaseConfig(env("https://example.test", key)));
  }
});
test("note input trims title, preserves body, and enforces bounds", () => {
  assert.deepEqual(validateNoteDraft({ title: "  Example  ", body: "  text\n" }), {
    title: "Example",
    body: "  text\n",
  });
  for (const title of ["", " \n\t", "x".repeat(121)])
    assert.throws(() => validateNoteDraft({ title, body: "" }));
  assert.throws(() => validateNoteDraft({ title: "Valid", body: "x".repeat(20001) }));
  assert.equal(
    validateNoteDraft({ title: "x".repeat(120), body: "x".repeat(20000) }).body.length,
    20000,
  );
});
test("private Notes response strips public caching without touching unrelated responses", async () => {
  for (const path of ["/notes", "/notes/"]) {
    const original = new Response("shell", {
      headers: { "cache-control": "public,max-age=3600", "set-cookie": "synthetic=value" },
    });
    const response = protectNotesResponse(new Request(`https://example.test${path}`), original);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("cdn-cache-control"), "no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("set-cookie"), "synthetic=value");
    assert.equal(await response.text(), "shell");
  }
  const original = new Response("catalog");
  assert.equal(
    protectNotesResponse(new Request("https://example.test/catalog"), original),
    original,
  );
});

// These tests inspect repository calls/feedback, not actual PostgreSQL RLS behavior.
function fakeClient(result) {
  const calls = [];
  const chain = {};
  for (const method of ["from", "select", "eq", "order", "range", "insert", "update", "delete"]) {
    chain[method] = (...args) => {
      calls.push([method, ...args]);
      return chain;
    };
  }
  for (const method of ["single", "maybeSingle", "abortSignal"]) {
    chain[method] = (...args) => {
      calls.push([method, ...args]);
      return Promise.resolve(result);
    };
  }
  return { client: chain, calls };
}
const original = {
  id: "note-a",
  title: "Before",
  body: "",
  created_at: "2026-01-01",
  updated_at: "2026-01-02",
};
test("listing binds actor, uses stable ordering and requests one look-ahead row", async () => {
  const { client, calls } = fakeClient({
    data: Array.from({ length: 21 }, (_, id) => ({ ...original, id: String(id) })),
    error: null,
  });
  const signal = new AbortController().signal;
  const result = await listNotes(client, "actor-a", 2, signal);
  assert.equal(result.notes.length, 20);
  assert.equal(result.hasMore, true);
  assert.ok(
    calls.some(
      ([method, key, value]) => method === "eq" && key === "owner_id" && value === "actor-a",
    ),
  );
  assert.deepEqual(
    calls.find(([method]) => method === "range"),
    ["range", 40, 60],
  );
  assert.equal(calls.at(-1)[1], signal);
  await assert.rejects(listNotes(client, "actor-a", -1, signal));
});
test("insert binds the originating identity, not whichever session wins a later race", async () => {
  const { client, calls } = fakeClient({ data: original, error: null });
  await saveNote(client, "actor-a", { title: " New ", body: "Body" });
  assert.deepEqual(
    calls.find(([method]) => method === "insert"),
    ["insert", { title: "New", body: "Body", owner_id: "actor-a" }],
  );
});
test("update and delete require actor, identity and original timestamp", async () => {
  for (const operation of ["update", "delete"]) {
    const { client, calls } = fakeClient({ data: original, error: null });
    if (operation === "update")
      await saveNote(client, "actor-a", { title: "After", body: "" }, original);
    else await deleteNote(client, "actor-a", original);
    assert.deepEqual(
      calls.filter(([method]) => method === "eq"),
      [
        ["eq", "owner_id", "actor-a"],
        ["eq", "id", original.id],
        ["eq", "updated_at", original.updated_at],
      ],
    );
  }
});
test("zero-row and unknown outcomes are not reported as successful mutations", async () => {
  const missing = fakeClient({ data: null, error: null }).client;
  await assert.rejects(
    saveNote(missing, "actor-a", { title: "After", body: "" }, original),
    /zmieniona/,
  );
  await assert.rejects(deleteNote(missing, "actor-a", original), /zmieniona/);
  const failed = fakeClient({ data: null, error: { message: "SENSITIVE_PROVIDER_ERROR" } }).client;
  await assert.rejects(
    saveNote(failed, "actor-a", { title: "After", body: "" }),
    (error) => !error.message.includes("SENSITIVE_PROVIDER_ERROR"),
  );
  await assert.rejects(deleteNote(failed, "actor-a", original), /Nie potwierdzono/);
});
