#!/bin/sh
# ============================================================
# EduConnect Algeria — Docker Entrypoint
# ============================================================
# Waits for PostgreSQL + Redis, runs migrations, then starts
# the CMD passed by docker-compose / Dockerfile.
# ============================================================
set -e

# ---- Colour helpers ----
info()  { echo "\033[1;34m[entrypoint]\033[0m $*"; }
ok()    { echo "\033[1;32m[entrypoint]\033[0m $*"; }
warn()  { echo "\033[1;33m[entrypoint]\033[0m $*"; }
err()   { echo "\033[1;31m[entrypoint]\033[0m $*"; }

# ---- Wait for PostgreSQL ----
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
MAX_RETRIES=30
RETRY=0

info "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    RETRY=$((RETRY + 1))
    if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
        err "PostgreSQL not reachable after ${MAX_RETRIES} attempts. Aborting."
        exit 1
    fi
    sleep 1
done
ok "PostgreSQL is ready."

# ---- Wait for Redis ----
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
RETRY=0

info "Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT}..."
while ! nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; do
    RETRY=$((RETRY + 1))
    if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
        err "Redis not reachable after ${MAX_RETRIES} attempts. Aborting."
        exit 1
    fi
    sleep 1
done
ok "Redis is ready."

# ---- Run database migrations ----
info "Running database migrations..."
python manage.py migrate --noinput
ok "Migrations complete."

# ---- Collect static files (only if COLLECT_STATIC=1) ----
if [ "${COLLECT_STATIC:-0}" = "1" ]; then
    info "Collecting static files..."
    python manage.py collectstatic --noinput
    ok "Static files collected."
fi

# ---- Optional: create default superuser if env vars set ----
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    info "Ensuring superuser exists..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='${DJANGO_SUPERUSER_EMAIL}').exists():
    User.objects.create_superuser(
        email='${DJANGO_SUPERUSER_EMAIL}',
        password='${DJANGO_SUPERUSER_PASSWORD}',
        first_name='Admin',
        last_name='EduConnect',
        role='superadmin',
    )
    print('Superuser created.')
else:
    print('Superuser already exists.')
" 2>/dev/null || warn "Superuser creation skipped (custom User model may differ)."
fi

ok "Entrypoint complete — starting: $*"
exec "$@"
