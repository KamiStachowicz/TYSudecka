// Funkcja Vercel dla wersji przeglądarkowej: kanały RSS i strony tvsudecka.pl nie wysyłają nagłówków CORS,
// więc przeglądarka pobiera je przez /api/proxy?url=... Aplikacje na iPhone i Androida z niej nie korzystają.
// Odpowiedzi są trzymane w cache Vercel przez 2 minuty, żeby nie obciążać serwera stacji.

const ALLOWED = ['https://www.tvsudecka.pl/', 'https://www.youtube.com/feeds/'];

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('url') ?? '';
  if (!ALLOWED.some((prefix) => target.startsWith(prefix))) {
    return new Response('Niedozwolony adres', { status: 403 });
  }
  try {
    const upstream = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 TVSudeckaApp' } });
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'text/xml',
        'Cache-Control': upstream.ok ? 'public, s-maxage=120, stale-while-revalidate=600' : 'no-store',
      },
    });
  } catch (e) {
    return new Response(String(e), { status: 502 });
  }
}
