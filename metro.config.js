// Domyślna konfiguracja Expo + proxy RSS pod adresem /__cors-proxy serwera deweloperskiego.
// Dzięki temu wersja przeglądarkowa (np. w GitHub Codespaces) pobiera kanały z tej samej domeny,
// bez osobnego portu. Działa tylko w `expo start`; aplikacje na telefon pobierają dane bezpośrednio.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const PROXY_PATH = '/__cors-proxy';
const ALLOWED = ['https://www.tvsudecka.pl/', 'https://www.youtube.com/feeds/'];

async function corsProxy(req, res) {
  const target = new URL(req.url ?? '/', 'http://localhost').searchParams.get('url') ?? '';
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
}

const previous = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const inner = previous ? previous(middleware, server) : middleware;
    return (req, res, next) => {
      if (req.url && req.url.startsWith(PROXY_PATH)) {
        corsProxy(req, res);
        return;
      }
      return inner(req, res, next);
    };
  },
};

module.exports = config;
