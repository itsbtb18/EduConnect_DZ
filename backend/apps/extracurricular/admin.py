from django.contrib import admin

from .models import Activity, Enrollment, Session

admin.site.register(Activity)
admin.site.register(Enrollment)
admin.site.register(Session)
