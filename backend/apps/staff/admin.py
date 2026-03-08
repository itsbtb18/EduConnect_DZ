from django.contrib import admin

from .models import StaffAttendance, StaffDocument, StaffLeave, StaffMember

admin.site.register(StaffMember)
admin.site.register(StaffDocument)
admin.site.register(StaffAttendance)
admin.site.register(StaffLeave)
