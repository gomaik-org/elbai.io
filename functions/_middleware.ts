// Cloudflare Pages Middleware
// Routes alpha.elbai.io traffic to /alpha internally while preserving host

export async function onRequest(context: { request: Request; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);

  // If request arrives on alpha.elbai.io and path is root "/", rewrite to "/alpha"
  if (url.hostname === 'alpha.elbai.io' && (url.pathname === '/' || url.pathname === '')) {
    url.pathname = '/alpha';
    return context.next(new Request(url.toString(), context.request));
  }

  return context.next();
}
