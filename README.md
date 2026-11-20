# Telewizja Sudecka – aplikacja na iPhone i Androida

Aplikacja w Expo (React Native): jeden kod na iOS, Androida i przeglądarkę.

## Co jest w środku

| Zakładka | Źródło danych |
|---|---|
| **Wiadomości** – najnowsze artykuły, „Moje” (ulubione miejscowości) + szybkie filtry | RSS `tvsudecka.pl/rss/articles/pl` |
| **Wideo** – najnowsze filmy, odtwarzane w aplikacji | kanał RSS YouTube TVSUDECKA PL |
| **Na żywo** – transmisja z YouTube | `youtube.com/embed/live_stream?channel=…` |
| **Zapisane** – artykuły do przeczytania później, także offline | pamięć telefonu |
| **Menu** – miejscowości, Program TV, Wyślij info, Szukaj, Ustawienia, działy, kontakt | RSS działu `…/rss/articles/pl/<id>` |

Pozostałe funkcje:

- **Szukaj** (lupa w nagłówku): wyszukiwarka serwisu `/szukaj?word=…`, 20 wyników na stronę, z doładowywaniem.
  Starsze artykuły (spoza RSS) aplikacja odczytuje bezpośrednio ze strony artykułu.
- **Moje miejscowości:** wybrane miejscowości dają zakładkę „Moje” i mogą być źródłem powiadomień.
- **Program TV:** ramówka z `/ramowka`. Na dziś stacja nie wpisała tam programu, więc ekran pokazuje „Brak programu”.
  Gdy stacja ją uzupełni, pojawi się automatycznie (jeśli format będzie inny, trzeba poprawić `fetchSchedule` w `feeds.ts`).
- **Wyślij info do redakcji:** opis, miejscowość, do 5 zdjęć/filmów. Wysyłka idzie e-mailem z telefonu użytkownika
  na kontakt@tvsudecka.pl (bez serwera).
- **Ustawienia:** motyw (jak w telefonie / jasny / ciemny), rozmiar tekstu artykułów (4 stopnie), powiadomienia.
- **Powiadomienia o nowych artykułach:** wszystkie albo tylko z moich miejscowości. Bez serwera: telefon co około
  30 minut (czasem rzadziej) uruchamia zadanie w tle, które sprawdza RSS i pokazuje lokalne powiadomienie.
  Dotknięcie powiadomienia otwiera artykuł. Natychmiastowe alerty „PILNE” wysyłane przez redakcję wymagają serwera
  i usługi push (np. Expo Push lub Firebase), czyli współpracy ze stacją.
- **Widżet na ekran główny** (iOS i Android): najnowsze nagłówki, odświeżane przy otwarciu aplikacji i w tle.

Artykuł otwiera się w aplikacji (zdjęcie, lead, pełna treść, „Zapisz” i „Udostępnij”). Aplikacja nie potrzebuje
własnego serwera: wszystko pobiera z publicznych kanałów RSS i stron tvsudecka.pl oraz YouTube.

Aplikacja nie ma reklam ani płatnych funkcji.

**Co działa w Expo Go, a co dopiero w wersji testowej (EAS):** w Expo Go działa wszystko poza powiadomieniami w tle
i widżetem. Te dwie rzeczy wymagają `eas build --profile development`.

## Uruchomienie na telefonie (bez Maca i bez Android Studio)

1. Zainstaluj Node.js LTS z https://nodejs.org (albo użyj przenośnego z folderu `.tools/node`).
2. W tym folderze:
   ```bash
   npm install
   npx expo start
   ```
3. Zainstaluj na telefonie aplikację **Expo Go** (App Store / Google Play) i zeskanuj kod QR z terminala.
   Telefon i komputer muszą być w tej samej sieci Wi-Fi (albo użyj `npx expo start --tunnel`).

## Podgląd w przeglądarce

Kanały RSS nie pozwalają na pobieranie z innej domeny (CORS), więc do testów w przeglądarce potrzebne jest małe proxy:

```bash
node scripts/cors-proxy.mjs
```

```bash
npx expo start --web
```

Aplikacje na telefon pobierają dane bezpośrednio i proxy nie używają.

## Wersja web na Vercel

Repo jest gotowe do importu w Vercel (https://vercel.com/new): ustawienia są w `vercel.json`
(build `npx expo export --platform web`, katalog `dist`, przekierowanie wszystkich ścieżek na `index.html`).
W wersji produkcyjnej przeglądarka pobiera kanały RSS przez funkcję `api/proxy.js` na tej samej domenie.
Funkcja przepuszcza tylko adresy `www.tvsudecka.pl` i kanał RSS YouTube, a odpowiedzi trzyma 2 minuty w cache Vercela.

W przeglądarce nie ma powiadomień ani widżetu, tak jak w podglądzie `npx expo start --web`.

## Polityka prywatności

Sklepy wymagają linku do polityki prywatności. Aplikacja nie wyświetla reklam i nie zbiera danych osobowych;
zgłoszenia do redakcji idą e-mailem z poczty użytkownika. Polityka ze strony tvsudecka.pl powinna to opisywać.

## Wersja do testów na telefonach (bez sklepów)

Android: plik APK do zainstalowania na dowolnym telefonie, link i kod QR pojawiają się po buildzie na expo.dev.

```bash
npx eas-cli@latest build --platform android --profile preview
```

Na telefonie trzeba zezwolić na instalację z nieznanych źródeł. iPhone bez sklepu wymaga płatnego konta Apple Developer
(TestFlight albo instalacja na zarejestrowane urządzenia). Do tego czasu iPhone'y testują przez Expo Go.

## Publikacja w App Store i Google Play

Budowanie odbywa się w chmurze przez EAS, Mac nie jest potrzebny:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform all
```

Potrzebne konta: Apple Developer Program (99 USD/rok) i Google Play Console (jednorazowo 25 USD).
Identyfikator aplikacji: `pl.tvsudecka.app` (zmień w `app.json`, jeśli trzeba).

**Ważne:** treści, nazwa i logo należą do Telewizji Sudeckiej. Przed publikacją w sklepach potrzebna jest zgoda
stacji, a najlepiej publikacja z jej konta deweloperskiego.

## Struktura

- `src/app/` – ekrany (Expo Router): `(tabs)/` zakładki, `artykul/[id]`, `dzial/[id]`, `wideo/[id]`
- `src/lib/feeds.ts` – pobieranie i parsowanie RSS
- `src/lib/categories.ts` – lista działów i miejscowości (ID z menu strony)
- `src/lib/html.ts` – szablon HTML artykułu i odtwarzacza YouTube
- `src/lib/settings.tsx` – ustawienia użytkownika, motyw jasny/ciemny, rozmiar tekstu
- `src/lib/saved.tsx` – zapisane artykuły (offline)
- `src/lib/notifications.ts` – sprawdzanie nowych artykułów w tle i powiadomienia
- `src/widgets/` – widżet na ekran główny (`.ios.tsx` SwiftUI, `.android.tsx` Jetpack Compose)
- `src/app/szukaj.tsx`, `ramowka.tsx`, `wyslij.tsx`, `ustawienia.tsx`, `miejscowosci.tsx` – ekrany
- `scripts/make-icons.cjs` – generuje ikony z `assets/brand/tvs.jpg`
