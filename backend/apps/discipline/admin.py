from django.contrib import admin

from .models import BehaviorReport, Incident, Sanction, WarningThreshold

admin.site.register(Incident)
admin.site.register(Sanction)
admin.site.register(BehaviorReport)
admin.site.register(WarningThreshold)
