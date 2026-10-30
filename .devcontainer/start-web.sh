#!/usr/bin/env bash
# Uruchamia Expo web w tle (GitHub Codespaces). Proxy RSS działa pod /__cors-proxy tego samego serwera
# (metro.config.js), więc nie trzeba otwierać dodatkowego portu. Log: /tmp/expo-web.log
set -u
cd "$(dirname "$0")/.."

pkill -f 'expo start' 2>/dev/null || true

# setsid: osobna sesja, żeby serwer nie zginął po zakończeniu postStartCommand.
EXPO_PUBLIC_CORS_PROXY_URL=/__cors-proxy CI=1 \
  setsid nohup npx expo start --web --port 8081 > /tmp/expo-web.log 2>&1 < /dev/null &
disown || true
sleep 2

echo "Aplikacja: port 8081 (zakładka Ports), log: /tmp/expo-web.log"
