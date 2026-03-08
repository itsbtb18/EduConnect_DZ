"""
Reader abstraction layer — supports ZKTeco, Suprema, DigitalPersona
via their local REST APIs.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

import requests

logger = logging.getLogger(__name__)

READER_TIMEOUT = 10  # seconds


@dataclass
class CaptureResult:
    """Result from a fingerprint capture attempt."""

    success: bool
    template_data: bytes | None = None
    quality_score: int = 0
    error: str = ""


@dataclass
class VerifyResult:
    """Result from a fingerprint verification attempt."""

    success: bool
    matched: bool = False
    confidence: int = 0
    error: str = ""


@dataclass
class ReaderStatus:
    """Health / diagnostic info from a reader."""

    online: bool
    firmware: str = ""
    sensor_quality: int = 100  # 0-100
    serial: str = ""
    error: str = ""


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------


class BaseReader(ABC):
    """Abstract biometric reader interface."""

    def __init__(self, ip: str, port: int = 4370, api_url: str = ""):
        self.ip = ip
        self.port = port
        self.api_url = api_url or f"http://{ip}:{port}"

    @abstractmethod
    def capture(self) -> CaptureResult:
        """Capture a single fingerprint template from the sensor."""

    @abstractmethod
    def verify(self, template_data: bytes) -> VerifyResult:
        """Verify a live scan against a stored template."""

    @abstractmethod
    def get_status(self) -> ReaderStatus:
        """Get reader health / diagnostic info."""

    def _post(self, path: str, json_data: dict | None = None) -> dict:
        try:
            r = requests.post(
                f"{self.api_url}{path}",
                json=json_data or {},
                timeout=READER_TIMEOUT,
            )
            r.raise_for_status()
            return r.json()
        except requests.RequestException as e:
            logger.error("Reader %s POST %s failed: %s", self.ip, path, e)
            return {"error": str(e)}

    def _get(self, path: str) -> dict:
        try:
            r = requests.get(
                f"{self.api_url}{path}",
                timeout=READER_TIMEOUT,
            )
            r.raise_for_status()
            return r.json()
        except requests.RequestException as e:
            logger.error("Reader %s GET %s failed: %s", self.ip, path, e)
            return {"error": str(e)}


# ---------------------------------------------------------------------------
# ZKTeco
# ---------------------------------------------------------------------------


class ZKTecoReader(BaseReader):
    """ZKTeco reader — communicates via ZKBioAccess REST API."""

    def capture(self) -> CaptureResult:
        data = self._post("/api/fingerprint/capture")
        if "error" in data:
            return CaptureResult(success=False, error=data["error"])
        import base64

        tpl = base64.b64decode(data.get("template", ""))
        return CaptureResult(
            success=True,
            template_data=tpl,
            quality_score=data.get("quality", 0),
        )

    def verify(self, template_data: bytes) -> VerifyResult:
        import base64

        data = self._post(
            "/api/fingerprint/verify",
            {
                "template": base64.b64encode(template_data).decode(),
            },
        )
        if "error" in data:
            return VerifyResult(success=False, error=data["error"])
        return VerifyResult(
            success=True,
            matched=data.get("matched", False),
            confidence=data.get("score", 0),
        )

    def get_status(self) -> ReaderStatus:
        data = self._get("/api/device/status")
        if "error" in data:
            return ReaderStatus(online=False, error=data["error"])
        return ReaderStatus(
            online=True,
            firmware=data.get("firmware", ""),
            sensor_quality=data.get("sensor_quality", 100),
            serial=data.get("serial", ""),
        )


# ---------------------------------------------------------------------------
# Suprema
# ---------------------------------------------------------------------------


class SupremaReader(BaseReader):
    """Suprema BioStar 2 reader — REST API."""

    def __init__(self, ip: str, port: int = 443, api_url: str = ""):
        super().__init__(ip, port, api_url or f"https://{ip}:{port}/api")

    def capture(self) -> CaptureResult:
        data = self._post("/fingers/scan")
        if "error" in data:
            return CaptureResult(success=False, error=data["error"])
        import base64

        tpl = base64.b64decode(data.get("templateData", ""))
        return CaptureResult(
            success=True,
            template_data=tpl,
            quality_score=data.get("quality", 0),
        )

    def verify(self, template_data: bytes) -> VerifyResult:
        import base64

        data = self._post(
            "/fingers/verify",
            {
                "templateData": base64.b64encode(template_data).decode(),
            },
        )
        if "error" in data:
            return VerifyResult(success=False, error=data["error"])
        return VerifyResult(
            success=True,
            matched=data.get("verified", False),
            confidence=data.get("score", 0),
        )

    def get_status(self) -> ReaderStatus:
        data = self._get("/devices/status")
        if "error" in data:
            return ReaderStatus(online=False, error=data["error"])
        return ReaderStatus(
            online=data.get("status") == "ACTIVE",
            firmware=data.get("firmwareVersion", ""),
            sensor_quality=data.get("sensorStatus", 100),
            serial=data.get("serialNumber", ""),
        )


# ---------------------------------------------------------------------------
# DigitalPersona
# ---------------------------------------------------------------------------


class DigitalPersonaReader(BaseReader):
    """DigitalPersona / HID reader — REST API."""

    def __init__(self, ip: str, port: int = 5000, api_url: str = ""):
        super().__init__(ip, port, api_url or f"http://{ip}:{port}")

    def capture(self) -> CaptureResult:
        data = self._post("/api/v1/fingerprints/capture")
        if "error" in data:
            return CaptureResult(success=False, error=data["error"])
        import base64

        tpl = base64.b64decode(data.get("fmd", ""))
        return CaptureResult(
            success=True,
            template_data=tpl,
            quality_score=data.get("quality", 0),
        )

    def verify(self, template_data: bytes) -> VerifyResult:
        import base64

        data = self._post(
            "/api/v1/fingerprints/verify",
            {
                "fmd": base64.b64encode(template_data).decode(),
            },
        )
        if "error" in data:
            return VerifyResult(success=False, error=data["error"])
        return VerifyResult(
            success=True,
            matched=data.get("match", False),
            confidence=data.get("confidence", 0),
        )

    def get_status(self) -> ReaderStatus:
        data = self._get("/api/v1/device/info")
        if "error" in data:
            return ReaderStatus(online=False, error=data["error"])
        return ReaderStatus(
            online=True,
            firmware=data.get("version", ""),
            sensor_quality=data.get("sensorQuality", 100),
            serial=data.get("serial", ""),
        )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

READER_MAP: dict[str, type[BaseReader]] = {
    "ZKTECO": ZKTecoReader,
    "SUPREMA": SupremaReader,
    "DIGITAL_PERSONA": DigitalPersonaReader,
    "GENERIC": ZKTecoReader,  # fallback
}


def get_reader(device) -> BaseReader:
    """Create reader instance from a FingerprintDevice model."""
    cls = READER_MAP.get(device.device_type, ZKTecoReader)
    return cls(
        ip=str(device.ip_address or "127.0.0.1"),
        port=device.port,
        api_url=device.api_url,
    )
