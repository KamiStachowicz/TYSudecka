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
- **VIP:** bez reklam, zapisywanie bez limitu (bez VIP: 10 artykułów) i odznaka VIP.

Artykuł otwiera się w aplikacji (zdjęcie, lead, pełna treść, „Zapisz” i „Udostępnij”). Aplikacja nie potrzebuje
własnego serwera: wszystko pobiera z publicznych kanałów RSS i stron tvsudecka.pl oraz YouTube.

**Co działa w Expo Go, a co dopiero w wersji testowej (EAS):** w Expo Go działa wszystko poza reklamami,
zakupami VIP, powiadomieniami w tle i widżetem. Te cztery rzeczy wymagają `eas build --profile development`.

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

**Bez instalowania czegokolwiek – GitHub Codespaces:** na GitHubie *Code → Codespaces → Create codespace*.
Zależności instalują się same, a `expo start --web` rusza automatycznie (port 8081 w zakładce *Ports*).
Proxy RSS działa wtedy pod adresem `/__cors-proxy` tego samego serwera (`metro.config.js`), więc nie trzeba
otwierać ani upubliczniać dodatkowego portu. Log serwera: `/tmp/expo-web.log`.

## Reklamy i subskrypcja VIP

- **Reklamy (Google AdMob):** baner co 6 artykułów i co 4 filmy, baner na dole ekranu artykułu i pod filmem.
  Przy pierwszym uruchomieniu pokazuje się okno zgody RODO (Google UMP), a na iPhonie także pytanie Apple o śledzenie.
  W zakładce Działy pojawia się „Ustawienia prywatności reklam”, jeśli Google tego wymaga.
- **VIP (RevenueCat):** subskrypcja miesięczna i roczna usuwa wszystkie reklamy. Przycisk „VIP” jest w nagłówku,
  karta w zakładce Działy, a przy każdej reklamie link „Usuń reklamy”. Jest też „Przywróć zakupy” i „Zarządzaj subskrypcją”.
  Subskrybentom VIP nie pokazujemy nawet okna zgody na reklamy.

Wszystkie ustawienia są w `src/lib/monetization/config.ts` (identyfikatory reklam, klucze RevenueCat, linki do regulaminu).

### Jak to uruchomić naprawdę

Reklamy i zakupy mają kod natywny, więc **nie działają w Expo Go ani w przeglądarce**. W Expo Go aplikacja
działa dalej, tylko bez reklam. W trybie deweloperskim bez skonfigurowanego sklepu ekran VIP symuluje zakup.
Do testów potrzebna jest własna wersja testowa (development build):

```bash
npx eas-cli@latest build --profile development --platform android
```

1. **AdMob** (https://admob.google.com): dodaj aplikację na iOS i Androida. Identyfikatory aplikacji (`ca-app-pub-…~…`)
   wpisz w `app.json` (teraz są tam testowe identyfikatory Google), a identyfikatory jednostek banerowych (`ca-app-pub-…/…`)
   w `AD_UNIT_IDS` w `config.ts`. W „Prywatność i wiadomości” włącz komunikat RODO (EOG) i komunikat IDFA (iOS).
2. **Produkty w sklepach:** w App Store Connect i Google Play Console utwórz subskrypcje, np. `vip_monthly` i `vip_yearly`.
3. **RevenueCat** (https://app.revenuecat.com): podłącz oba sklepy, dodaj produkty, utwórz entitlement `vip`
   i ofertę (Offering) z pakietami Monthly i Annual. Publiczne klucze SDK (`appl_…`, `goog_…`) wpisz w `REVENUECAT_API_KEYS`.
4. **Polityka prywatności:** w sklepach trzeba podać politykę, która opisuje reklamy i subskrypcje.
   Domyślnie aplikacja linkuje do polityki ze strony tvsudecka.pl. Trzeba ją uzupełnić albo podać własną w `config.ts`.

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
- `src/lib/monetization/` – reklamy (`ads.tsx`), subskrypcja VIP (`vip.tsx`), ustawienia (`config.ts`)
- `src/lib/settings.tsx` – ustawienia użytkownika, motyw jasny/ciemny, rozmiar tekstu
- `src/lib/saved.tsx` – zapisane artykuły (offline)
- `src/lib/notifications.ts` – sprawdzanie nowych artykułów w tle i powiadomienia
- `src/widgets/` – widżet na ekran główny (`.ios.tsx` SwiftUI, `.android.tsx` Jetpack Compose)
- `src/app/vip.tsx`, `szukaj.tsx`, `ramowka.tsx`, `wyslij.tsx`, `ustawienia.tsx`, `miejscowosci.tsx` – ekrany
- `scripts/make-icons.cjs` – generuje ikony z `assets/brand/tvs.jpg`
