/** No account state is server-rendered in the first Notes slice. Keep its shell private too. */
export function protectNotesResponse(request: Request, response: Response): Response {
  const path = new URL(request.url).pathname;
  if (path !== "/notes" && path !== "/notes/") return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
