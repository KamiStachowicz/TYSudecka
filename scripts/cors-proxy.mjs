// Proxy tylko do testów wersji przeglądarkowej (npm run web): kanały RSS nie wysyłają nagłówków CORS.
// Aplikacje na iPhone i Androida nie korzystają z niego.
import http from 'node:http';

const ALLOWED = ['https://www.tvsudecka.pl/', 'https://www.youtube.com/feeds/'];

http
  .createServer(async (req, res) => {
    const target = new URL(req.url ?? '/', 'http://localhost').searchParams.get('url') ?? '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!ALLOWED.some((prefix) => target.startsWith(prefix))) {
      res.writeHead(403).end('Niedozwolony adres');
      return;
    }
    try {
      const upstream = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 TVSudeckaApp' } });
      res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') ?? 'text/xml' });
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (e) {
      res.writeHead(502).end(String(e));
    }
  })
  .listen(8787, () => console.log('CORS proxy: http://localhost:8787'));
