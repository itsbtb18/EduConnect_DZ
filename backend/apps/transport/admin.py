from django.contrib import admin

from .models import (
    BusDriver,
    BusStop,
    GPSPosition,
    StudentTransport,
    TransportLine,
    TripLog,
)

admin.site.register(BusDriver)
admin.site.register(TransportLine)
admin.site.register(BusStop)
admin.site.register(StudentTransport)
admin.site.register(GPSPosition)
admin.site.register(TripLog)
