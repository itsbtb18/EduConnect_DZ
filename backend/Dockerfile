# ============================================================
# EduConnect Algeria — Production Dockerfile
# ============================================================
# Multi-stage build: deps → runtime (smaller final image)
# Uses Daphne ASGI for HTTP + WebSocket support
# ============================================================

# ---------- Stage 1: Build dependencies ----------
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt


# ---------- Stage 2: Runtime ----------
FROM python:3.11-slim AS runtime

LABEL maintainer="EduConnect DZ <admin@educonnect.dz>" \
      description="EduConnect Algeria — Django ASGI Backend" \
      version="1.0.0"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    DJANGO_SETTINGS_MODULE=educonnect.settings.production \
    APP_HOME=/app

# Install runtime-only libs (no build tools → smaller image)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        libcairo2 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libgdk-pixbuf-2.0-0 \
        shared-mime-info \
        curl \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages from wheels (fast, no compilation)
COPY --from=builder /build/wheels /tmp/wheels
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir /tmp/wheels/*.whl \
    && rm -rf /tmp/wheels /tmp/requirements.txt

# Create non-root user
RUN groupadd -r django && useradd -r -g django -d $APP_HOME -s /sbin/nologin django

# Set up application directory
WORKDIR $APP_HOME

# Copy project code
COPY --chown=django:django . .

# Create directories for static/media/logs
RUN mkdir -p $APP_HOME/staticfiles $APP_HOME/media $APP_HOME/logs \
    && chown -R django:django $APP_HOME

# Copy and set entrypoint
COPY --chown=django:django entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Collect static files (uses dummy SECRET_KEY if not set)
RUN DJANGO_SECRET_KEY=build-placeholder python manage.py collectstatic --noinput 2>/dev/null || true

# Switch to non-root user
USER django

EXPOSE 8000

# Health check — hits Django /api/v1/ or returns unhealthy after 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]

# Default command: Daphne ASGI (HTTP + WebSocket)
CMD ["daphne", \
     "-b", "0.0.0.0", \
     "-p", "8000", \
     "--proxy-headers", \
     "--access-log", "-", \
     "-v", "1", \
     "educonnect.asgi:application"]
