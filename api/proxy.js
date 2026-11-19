// Proxy dla wersji przeglądarkowej na Vercel: kanały RSS tvsudecka.pl i YouTube nie wysyłają nagłówków CORS,
// więc przeglądarka pobiera je przez tę funkcję (ta sama domena). Aplikacje na iPhone i Androida z niej nie korzystają.
// Dozwolone są tylko adresy stacji i kanał RSS YouTube, żeby proxy nie dało się użyć do czegoś innego.

const ALLOWED = [
  { host: 'www.tvsudecka.pl', path: '/' },
  { host: 'www.youtube.com', path: '/feeds/' },
];

function isAllowed(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && ALLOWED.some((a) => url.hostname === a.host && url.pathname.startsWith(a.path));
}

module.exports = async (req, res) => {
  const target = String(req.query.url ?? '');
  if (!isAllowed(target)) {
    res.status(403).send('Niedozwolony adres');
    return;
  }
  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 TVSudeckaApp', Accept: req.headers.accept ?? '*/*' },
    });
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'text/xml; charset=utf-8');
    // Krótki cache na brzegu Vercela, żeby nie obciążać serwera stacji przy wielu czytelnikach.
    if (upstream.ok) res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (e) {
    res.status(502).send(String(e));
  }
};
