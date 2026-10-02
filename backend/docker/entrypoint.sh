#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
    echo "WARNING: APP_KEY is not set; generating an ephemeral key. Set APP_KEY for persistent deployments." >&2
    APP_KEY="$(php artisan key:generate --show --no-ansi)"
    export APP_KEY
fi

php artisan config:cache
php artisan route:cache

# docker-compose waits for the database healthcheck before starting this container.
php artisan migrate --force

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
    php artisan db:seed --force
fi

exec "$@"
