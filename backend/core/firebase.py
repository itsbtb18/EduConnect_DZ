"""
Firebase V1 API integration for push notifications.

Uses the official `firebase-admin` SDK (replaces legacy pyfcm).
Requires a service-account JSON file configured via FIREBASE_SERVICE_ACCOUNT_PATH.
"""

import logging

import firebase_admin
from firebase_admin import credentials, messaging

from django.conf import settings

logger = logging.getLogger(__name__)

_firebase_app = None


def get_firebase_app():
    """
    Initialize and return the Firebase app singleton.
    Safe to call multiple times — only initializes once.
    """
    global _firebase_app
    if _firebase_app is None:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase app initialized: %s", _firebase_app.project_id)
    return _firebase_app


def send_push_notification(device_token: str, title: str, body: str, data: dict = None):
    """
    Send a push notification to a single device.

    Args:
        device_token: FCM registration token from the user's phone.
        title: Notification title.
        body: Notification body text.
        data: Optional dict of custom key-value pairs (all values must be strings).

    Returns:
        dict with 'success' bool and either 'message_id' or 'error'.
    """
    get_firebase_app()

    # Firebase data payloads require all values to be strings
    str_data = {k: str(v) for k, v in (data or {}).items()}

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=str_data,
        token=device_token,
    )

    try:
        response = messaging.send(message)
        return {"success": True, "message_id": response}
    except messaging.UnregisteredError:
        logger.warning("FCM token unregistered: %s…", device_token[:20])
        return {"success": False, "error": "token_unregistered"}
    except Exception as e:
        logger.error("FCM send failed: %s", e)
        return {"success": False, "error": str(e)}


def send_push_to_multiple(
    device_tokens: list, title: str, body: str, data: dict = None
):
    """
    Send the same notification to multiple devices (max 500 per call).

    Args:
        device_tokens: List of FCM registration tokens.
        title: Notification title.
        body: Notification body text.
        data: Optional dict of custom key-value pairs.

    Returns:
        dict with 'success_count' and 'failure_count'.
    """
    get_firebase_app()

    str_data = {k: str(v) for k, v in (data or {}).items()}

    message = messaging.MulticastMessage(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=str_data,
        tokens=device_tokens,
    )

    response = messaging.send_each_for_multicast(message)
    return {
        "success_count": response.success_count,
        "failure_count": response.failure_count,
    }
