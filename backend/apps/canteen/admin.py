from django.contrib import admin

from .models import CanteenStudent, MealAttendance, Menu, MenuItem

admin.site.register(CanteenStudent)
admin.site.register(Menu)
admin.site.register(MenuItem)
admin.site.register(MealAttendance)
