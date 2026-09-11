import { createFileRoute } from "@tanstack/react-router";
import { proxyApi } from "../lib/api-proxy.server";
const proxy = ({ request }: { request: Request }) =>
  proxyApi(request, process.env["API_INTERNAL_URL"]);
export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: proxy,
      HEAD: proxy,
      POST: proxy,
      PUT: proxy,
      PATCH: proxy,
      DELETE: proxy,
      OPTIONS: proxy,
    },
  },
});
