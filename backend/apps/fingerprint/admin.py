from django.contrib import admin

from .models import (
    BiometricAttendanceLog,
    FingerprintDevice,
    FingerprintRecord,
    FingerprintTemplate,
)

admin.site.register(FingerprintDevice)
admin.site.register(FingerprintRecord)
admin.site.register(FingerprintTemplate)
admin.site.register(BiometricAttendanceLog)
