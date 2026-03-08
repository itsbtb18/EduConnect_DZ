"""
SMS Gateway abstraction — supports multiple Algerian and international providers.

Each provider implements the BaseSMSGateway interface.
"""

import abc
import logging

logger = logging.getLogger(__name__)


class SMSResult:
    """Result of a single SMS send attempt."""

    __slots__ = ("success", "message_id", "error")

    def __init__(self, success: bool, message_id: str = "", error: str = ""):
        self.success = success
        self.message_id = message_id
        self.error = error


class BaseSMSGateway(abc.ABC):
    """Abstract base class for SMS gateways."""

    def __init__(self, api_key: str, api_secret: str, api_url: str, sender_name: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.api_url = api_url
        self.sender_name = sender_name

    @abc.abstractmethod
    def send(self, phone: str, message: str) -> SMSResult:
        """Send a single SMS. Returns SMSResult."""

    @abc.abstractmethod
    def check_balance(self) -> int:
        """Return remaining SMS balance from the gateway."""

    def send_bulk(self, recipients: list[dict]) -> list[SMSResult]:
        """
        Send to multiple recipients. Default: loop over send().
        Override for providers with native bulk API.
        recipients: [{"phone": "...", "message": "..."}]
        """
        results = []
        for r in recipients:
            results.append(self.send(r["phone"], r["message"]))
        return results


# ---------------------------------------------------------------------------
# Mobilis SMS Pro (Algeria)
# ---------------------------------------------------------------------------


class MobilisGateway(BaseSMSGateway):
    """Mobilis SMS Pro gateway integration."""

    def send(self, phone: str, message: str) -> SMSResult:
        import requests

        try:
            resp = requests.post(
                self.api_url or "https://sms.mobilis.dz/api/send",
                json={
                    "api_key": self.api_key,
                    "sender": self.sender_name,
                    "to": phone,
                    "message": message,
                },
                timeout=15,
            )
            data = resp.json()
            if resp.status_code == 200 and data.get("status") == "success":
                return SMSResult(True, message_id=data.get("message_id", ""))
            return SMSResult(False, error=data.get("error", "Unknown error"))
        except Exception as e:
            logger.exception("Mobilis SMS send error")
            return SMSResult(False, error=str(e))

    def check_balance(self) -> int:
        import requests

        try:
            resp = requests.get(
                self.api_url or "https://sms.mobilis.dz/api/balance",
                params={"api_key": self.api_key},
                timeout=10,
            )
            return resp.json().get("balance", 0)
        except Exception:
            logger.exception("Mobilis balance check error")
            return 0


# ---------------------------------------------------------------------------
# Djezzy Business (Algeria)
# ---------------------------------------------------------------------------


class DjezzyGateway(BaseSMSGateway):
    """Djezzy Business SMS gateway."""

    def send(self, phone: str, message: str) -> SMSResult:
        import requests

        try:
            resp = requests.post(
                self.api_url or "https://api.djezzy.dz/sms/send",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "from": self.sender_name,
                    "to": phone,
                    "text": message,
                },
                timeout=15,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                return SMSResult(True, message_id=data.get("id", ""))
            return SMSResult(False, error=data.get("message", "Send failed"))
        except Exception as e:
            logger.exception("Djezzy SMS send error")
            return SMSResult(False, error=str(e))

    def check_balance(self) -> int:
        import requests

        try:
            resp = requests.get(
                self.api_url or "https://api.djezzy.dz/sms/balance",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10,
            )
            return resp.json().get("credits", 0)
        except Exception:
            logger.exception("Djezzy balance check error")
            return 0


# ---------------------------------------------------------------------------
# Ooredoo Business (Algeria)
# ---------------------------------------------------------------------------


class OoredooGateway(BaseSMSGateway):
    """Ooredoo Business SMS gateway."""

    def send(self, phone: str, message: str) -> SMSResult:
        import requests

        try:
            resp = requests.post(
                self.api_url or "https://api.ooredoo.dz/sms/v1/send",
                headers={"X-API-Key": self.api_key},
                json={
                    "sender_id": self.sender_name,
                    "recipient": phone,
                    "body": message,
                },
                timeout=15,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                return SMSResult(True, message_id=data.get("sms_id", ""))
            return SMSResult(False, error=data.get("error", "Send failed"))
        except Exception as e:
            logger.exception("Ooredoo SMS send error")
            return SMSResult(False, error=str(e))

    def check_balance(self) -> int:
        import requests

        try:
            resp = requests.get(
                self.api_url or "https://api.ooredoo.dz/sms/v1/balance",
                headers={"X-API-Key": self.api_key},
                timeout=10,
            )
            return resp.json().get("remaining", 0)
        except Exception:
            logger.exception("Ooredoo balance check error")
            return 0


# ---------------------------------------------------------------------------
# Custom / Generic HTTP gateway
# ---------------------------------------------------------------------------


class CustomGateway(BaseSMSGateway):
    """Generic HTTP-based SMS gateway — configurable URL."""

    def send(self, phone: str, message: str) -> SMSResult:
        if not self.api_url:
            logger.warning("Custom gateway: no api_url configured, simulating send")
            return SMSResult(True, message_id="sim-local")

        import requests

        try:
            resp = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": self.sender_name,
                    "to": phone,
                    "message": message,
                },
                timeout=15,
            )
            if resp.status_code in (200, 201):
                data = (
                    resp.json()
                    if resp.headers.get("content-type", "").startswith(
                        "application/json"
                    )
                    else {}
                )
                return SMSResult(True, message_id=data.get("id", "ok"))
            return SMSResult(False, error=f"HTTP {resp.status_code}")
        except Exception as e:
            logger.exception("Custom gateway SMS send error")
            return SMSResult(False, error=str(e))

    def check_balance(self) -> int:
        return 0  # Not applicable for generic gateway


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

GATEWAY_MAP = {
    "MOBILIS": MobilisGateway,
    "DJEZZY": DjezzyGateway,
    "OOREDOO": OoredooGateway,
    "CHINGUITEL": CustomGateway,  # use custom for now
    "TWILIO": CustomGateway,
    "CUSTOM": CustomGateway,
}


def get_gateway(config) -> BaseSMSGateway:
    """
    Build a gateway instance from an SMSConfig model instance.
    """
    cls = GATEWAY_MAP.get(config.provider, CustomGateway)
    return cls(
        api_key=config.api_key,
        api_secret=config.api_secret,
        api_url=config.api_url,
        sender_name=config.sender_name,
    )
