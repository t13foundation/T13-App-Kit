import { renderErrorPage } from "./lib/error-page";
type ServerEntry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response };
let serverEntryPromise: Promise<ServerEntry> | undefined;
async function getServerEntry(): Promise<ServerEntry> {
  serverEntryPromise ??= import("@tanstack/react-start/server-entry").then((module) => (module.default ?? module) as ServerEntry);
  return serverEntryPromise;
}
function failure(request: Request): Response {
  const api = new URL(request.url).pathname.startsWith("/api/");
  return new Response(api ? JSON.stringify({ error: { code: "request_failed", message: "request_failed" } }) : renderErrorPage(), {
    status: 500, headers: { "content-type": api ? "application/json" : "text/html; charset=utf-8",
      "cache-control": "private, no-store", "referrer-policy": "no-referrer" },
  });
}
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      if (response.status >= 500 && response.headers.get("content-type")?.includes("application/json")) {
        const payload: unknown = await response.clone().json().catch(() => null);
        if (payload && typeof payload === "object" && "unhandled" in payload && payload.unhandled === true) {
          console.error("web_ssr_failed"); return failure(request);
        }
      }
      return response;
    } catch {
      // Never print exception contents, request URLs, cookies or reset tokens.
      console.error("web_request_failed"); return failure(request);
    }
  },
};
