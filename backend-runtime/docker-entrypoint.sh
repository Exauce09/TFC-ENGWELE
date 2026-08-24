#!/bin/sh
set -e
cd /app

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
  php artisan key:generate --force || true
fi

# Normalize APP_URL if Render injects host only
case "$APP_URL" in
  http*|https*) ;;
  *)
    if [ -n "$APP_URL" ]; then
      export APP_URL="https://$APP_URL"
    fi
    ;;
esac

php artisan migrate --force || true
php artisan config:cache || true
php artisan route:cache || true

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
