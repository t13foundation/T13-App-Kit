import { createFileRoute } from '@tanstack/react-router';

async function proxy({ request }: { request: Request }) {
  const { proxyApi } = await import('../lib/api-proxy.server');
  return proxyApi(request, process.env['API_INTERNAL_URL']);
}
export const Route = createFileRoute('/api/$')({
  server: { handlers: { GET: proxy, POST: proxy, PUT: proxy, PATCH: proxy, DELETE: proxy } },
});
