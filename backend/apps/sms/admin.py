from django.contrib import admin

from .models import SMSCampaign, SMSConfig, SMSMessage, SMSTemplate

admin.site.register(SMSConfig)
admin.site.register(SMSTemplate)
admin.site.register(SMSMessage)
admin.site.register(SMSCampaign)
