import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) throw error;
    console.error("web_request_failed");
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }
});
// Defining start.ts opts out of automatic installation; keep server-function CSRF protection.
const csrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
