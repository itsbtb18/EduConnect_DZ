#!/usr/bin/env python
"""
EduConnect Algeria — System Health Check
==========================================
Production-grade diagnostic script that validates every external service
the platform depends on: Firebase, PostgreSQL, Redis, OpenAI, Pinecone,
and Django configuration.

Usage (from backend/):
    python system_health_check.py          # standalone (reads .env itself)
    python manage.py shell < system_health_check.py   # inside Django

Author: EduConnect DevOps
"""

from __future__ import annotations

import json
import os
import socket
import struct
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Bootstrap: ensure we can import Django settings even when run standalone
# ---------------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent

# Load .env before Django tries to read config()
# python-decouple looks for .env in cwd → make sure we're in the right place
os.chdir(_BACKEND_DIR)

# If the user didn't export DJANGO_SETTINGS_MODULE, default to development
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "educonnect.settings.development")

# Append backend/ to sys.path so Django can find the project package
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402

# ---------------------------------------------------------------------------
# Console helpers
# ---------------------------------------------------------------------------
_GREEN = "\033[92m"
_RED = "\033[91m"
_YELLOW = "\033[93m"
_CYAN = "\033[96m"
_BOLD = "\033[1m"
_RESET = "\033[0m"

PASS = f"{_GREEN}✔ PASS{_RESET}"
FAIL = f"{_RED}✘ FAIL{_RESET}"
WARN = f"{_YELLOW}⚠ WARN{_RESET}"


def _header(title: str) -> None:
    width = 60
    print()
    print(f"{_CYAN}{_BOLD}{'=' * width}{_RESET}")
    print(f"{_CYAN}{_BOLD}  {title}{_RESET}")
    print(f"{_CYAN}{_BOLD}{'=' * width}{_RESET}")


def _result(label: str, status: str, detail: str = "") -> None:
    extra = f"  → {detail}" if detail else ""
    print(f"  {status}  {label}{extra}")


# Accumulator for the final summary
_results: list[tuple[str, bool, str]] = []


def _record(service: str, ok: bool, detail: str = "") -> None:
    _results.append((service, ok, detail))


# ---------------------------------------------------------------------------
# 1. Firebase Validation
# ---------------------------------------------------------------------------
def check_firebase() -> None:
    _header("FIREBASE STATUS")

    sa_path: str = getattr(settings, "FIREBASE_SERVICE_ACCOUNT_PATH", "")
    project_id: str = getattr(settings, "FIREBASE_PROJECT_ID", "")

    # 1a — file existence
    if not sa_path:
        _result("Service-account path", FAIL, "FIREBASE_SERVICE_ACCOUNT_PATH is empty")
        _record("Firebase", False, "path not configured")
        return

    sa_file = Path(sa_path)
    if not sa_file.is_file():
        _result("Service-account file", FAIL, f"Not found: {sa_file}")
        _result(
            "Hint",
            WARN,
            "Download from Firebase Console → Project Settings → "
            "Service accounts → Generate new private key",
        )
        _record("Firebase", False, f"file missing: {sa_file}")
        return

    _result("Service-account file", PASS, str(sa_file))

    # 1b — valid JSON
    try:
        with open(sa_file, encoding="utf-8") as fh:
            sa_data = json.load(fh)
    except json.JSONDecodeError as exc:
        _result("JSON validity", FAIL, str(exc))
        _record("Firebase", False, "invalid JSON")
        return

    _result("JSON validity", PASS, f"project_id={sa_data.get('project_id', '?')}")

    # 1c — SDK initialisation
    try:
        import firebase_admin
        from firebase_admin import credentials

        # Avoid double-init if script is run repeatedly in the same process
        try:
            app = firebase_admin.get_app()
        except ValueError:
            cred = credentials.Certificate(str(sa_file))
            app = firebase_admin.initialize_app(cred)

        _result("Firebase Admin SDK", PASS, f"app={app.project_id}")
        _record("Firebase", True)
    except Exception as exc:
        _result("Firebase Admin SDK", FAIL, str(exc))
        _record("Firebase", False, str(exc))


# ---------------------------------------------------------------------------
# 2. PostgreSQL Check
# ---------------------------------------------------------------------------
def check_database() -> None:
    _header("DATABASE STATUS (PostgreSQL)")

    try:
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            _result("Connection", PASS)
            _result("Server version", PASS, version.split(",")[0])

            # Quick sanity: count tables
            cursor.execute(
                "SELECT count(*) FROM information_schema.tables "
                "WHERE table_schema = 'public';"
            )
            table_count = cursor.fetchone()[0]
            _result("Public tables", PASS, f"{table_count} tables")
        _record("PostgreSQL", True)
    except Exception as exc:
        _result("Connection", FAIL, str(exc))
        _record("PostgreSQL", False, str(exc))


# ---------------------------------------------------------------------------
# 3. Redis Check
# ---------------------------------------------------------------------------
def check_redis() -> None:
    _header("REDIS STATUS")

    redis_url = getattr(settings, "CACHES", {}).get("default", {}).get(
        "LOCATION", os.environ.get("REDIS_URL", "redis://localhost:6380/0")
    )

    try:
        import redis

        client = redis.Redis.from_url(redis_url, socket_connect_timeout=5)
        pong = client.ping()
        if pong:
            _result("Ping", PASS, f"url={redis_url}")
            info = client.info("server")
            _result(
                "Server",
                PASS,
                f"Redis {info.get('redis_version', '?')} | "
                f"uptime {info.get('uptime_in_seconds', '?')}s",
            )
            _record("Redis", True)
        else:
            _result("Ping", FAIL, "PONG not received")
            _record("Redis", False, "ping failed")
    except ImportError:
        _result("redis-py", FAIL, "Package 'redis' is not installed")
        _record("Redis", False, "redis package missing")
    except Exception as exc:
        _result("Connection", FAIL, str(exc))
        _record("Redis", False, str(exc))


# ---------------------------------------------------------------------------
# 4. OpenAI API Check
# ---------------------------------------------------------------------------
def check_openai() -> None:
    _header("OPENAI API STATUS")

    api_key: str = getattr(settings, "OPENAI_API_KEY", "") or os.environ.get(
        "OPENAI_API_KEY", ""
    )

    if not api_key or api_key.startswith("sk-your"):
        _result("API key", WARN, "Not configured (placeholder or empty)")
        _record("OpenAI", False, "API key not set")
        return

    _result("API key", PASS, f"{api_key[:8]}…{api_key[-4:]}")

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key, timeout=10)
        models = client.models.list()
        model_ids = [m.id for m in models.data[:5]]
        _result("API call", PASS, f"models available: {', '.join(model_ids)} …")
        _record("OpenAI", True)
    except ImportError:
        _result("openai package", FAIL, "Package 'openai' is not installed")
        _record("OpenAI", False, "openai package missing")
    except Exception as exc:
        _result("API call", FAIL, str(exc))
        _record("OpenAI", False, str(exc))


# ---------------------------------------------------------------------------
# 5. Pinecone Check
# ---------------------------------------------------------------------------
def check_pinecone() -> None:
    _header("PINECONE STATUS")

    api_key: str = getattr(settings, "PINECONE_API_KEY", "") or os.environ.get(
        "PINECONE_API_KEY", ""
    )
    index_name: str = getattr(settings, "PINECONE_INDEX_NAME", "")

    if not api_key or api_key.startswith("your-"):
        _result("API key", WARN, "Not configured (placeholder or empty)")
        _record("Pinecone", False, "API key not set")
        return

    _result("API key", PASS, f"{api_key[:8]}…{api_key[-4:]}")

    try:
        from pinecone import Pinecone

        pc = Pinecone(api_key=api_key)
        indexes = pc.list_indexes().names()
        _result("Connection", PASS, f"indexes: {list(indexes)}")

        if index_name and index_name in indexes:
            _result("Target index", PASS, index_name)
        elif index_name:
            _result("Target index", WARN, f"'{index_name}' not found in {list(indexes)}")

        _record("Pinecone", True)
    except ImportError:
        _result("pinecone package", FAIL, "Package 'pinecone' is not installed")
        _record("Pinecone", False, "pinecone package missing")
    except Exception as exc:
        _result("Connection", FAIL, str(exc))
        _record("Pinecone", False, str(exc))


# ---------------------------------------------------------------------------
# 6. Django ALLOWED_HOSTS Check
# ---------------------------------------------------------------------------
def _get_local_ip() -> str | None:
    """Return the LAN IP by connecting a dummy UDP socket to a public DNS."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return None


def check_allowed_hosts() -> None:
    _header("DJANGO ALLOWED_HOSTS")

    allowed = getattr(settings, "ALLOWED_HOSTS", [])
    _result("Current value", PASS if allowed else WARN, str(allowed))

    local_ip = _get_local_ip()
    if local_ip:
        _result("Detected LAN IP", PASS, local_ip)
        if local_ip in allowed or "*" in allowed:
            _result("LAN IP in ALLOWED_HOSTS", PASS)
            _record("ALLOWED_HOSTS", True)
        else:
            _result(
                "LAN IP in ALLOWED_HOSTS",
                WARN,
                f"'{local_ip}' is MISSING — Flutter on a real device won't connect",
            )
            _result(
                "Fix",
                WARN,
                f"Add to .env:  DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,{local_ip}",
            )
            _record("ALLOWED_HOSTS", False, f"add {local_ip}")
    else:
        _result("LAN IP detection", WARN, "Could not detect (no network?)")
        _record("ALLOWED_HOSTS", True)


# ---------------------------------------------------------------------------
# 7. Local Network Test Instructions
# ---------------------------------------------------------------------------
def print_network_instructions() -> None:
    _header("LOCAL NETWORK SETUP (Flutter ↔ Django)")

    local_ip = _get_local_ip() or "<YOUR_IP>"

    print(f"""
  Find your machine's LAN IP:

    {_BOLD}Windows:{_RESET}   ipconfig          → look for "IPv4 Address"
    {_BOLD}macOS:{_RESET}     ifconfig en0      → look for "inet"
    {_BOLD}Linux:{_RESET}     ip -4 addr show   → look for non-127 "inet"

  Your detected LAN IP: {_BOLD}{local_ip}{_RESET}

  Flutter app_constants.dart should use:
    {_CYAN}static const baseUrl   = 'http://{local_ip}:8001/api/v1';{_RESET}
    {_CYAN}static const wsBaseUrl = 'ws://{local_ip}:8001/ws';{_RESET}

  Make sure the Flutter device/emulator is on the {_BOLD}same Wi-Fi network{_RESET}.
  For Android emulator use 10.0.2.2 instead of the LAN IP.
""")


# ---------------------------------------------------------------------------
# 8. Firewall Check Instructions
# ---------------------------------------------------------------------------
def print_firewall_instructions() -> None:
    _header("FIREWALL INSTRUCTIONS (port 8001)")

    print(f"""
  If the Flutter device cannot reach Django, open port 8001 in your firewall.

  {_BOLD}Windows (PowerShell as Administrator):{_RESET}
    netsh advfirewall firewall add rule name="EduConnect Django" ^
        dir=in action=allow protocol=TCP localport=8001

  {_BOLD}macOS:{_RESET}
    System Settings → Network → Firewall → Options
    → Add Django/python to "Allow incoming connections"
    OR:
    sudo /usr/libexec/ApplicationFirewall/socketfilterfw \\
        --add /usr/local/bin/python3 --unblockapp /usr/local/bin/python3

  {_BOLD}Linux (ufw):{_RESET}
    sudo ufw allow 8001/tcp
    sudo ufw reload

  {_BOLD}Linux (firewalld):{_RESET}
    sudo firewall-cmd --permanent --add-port=8001/tcp
    sudo firewall-cmd --reload
""")


# ---------------------------------------------------------------------------
# 9. Summary
# ---------------------------------------------------------------------------
def print_summary() -> None:
    _header("SYSTEM STATUS SUMMARY")

    all_ok = True
    for service, ok, detail in _results:
        icon = f"{_GREEN}✔{_RESET}" if ok else f"{_RED}✘{_RESET}"
        suffix = f"  ({detail})" if detail and not ok else ""
        print(f"  {icon}  {service}{suffix}")
        if not ok:
            all_ok = False

    print()
    if all_ok:
        print(f"  {_GREEN}{_BOLD}All services healthy — ready to go!{_RESET}")
    else:
        failed = [s for s, ok, _ in _results if not ok]
        print(
            f"  {_RED}{_BOLD}Action required on: {', '.join(failed)}{_RESET}"
        )
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    start = time.monotonic()

    print()
    print(
        f"{_BOLD}EduConnect Algeria — System Health Check{_RESET}  "
        f"({time.strftime('%Y-%m-%d %H:%M:%S')})"
    )

    check_firebase()
    check_database()
    check_redis()
    check_openai()
    check_pinecone()
    check_allowed_hosts()

    print_network_instructions()
    print_firewall_instructions()
    print_summary()

    elapsed = time.monotonic() - start
    print(f"  Completed in {elapsed:.2f}s\n")


if __name__ == "__main__":
    main()
