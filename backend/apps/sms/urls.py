from django.urls import path

from . import views

app_name = "sms"

urlpatterns = [
    # Config
    path("config/", views.SMSConfigView.as_view(), name="sms-config"),
    # Balance
    path("balance/", views.SMSBalanceView.as_view(), name="sms-balance"),
    # Send single SMS
    path("send/", views.SMSSendView.as_view(), name="sms-send"),
    # History
    path("history/", views.SMSHistoryView.as_view(), name="sms-history"),
    # Templates
    path(
        "templates/",
        views.SMSTemplateListCreateView.as_view(),
        name="sms-template-list",
    ),
    path(
        "templates/<uuid:pk>/",
        views.SMSTemplateDetailView.as_view(),
        name="sms-template-detail",
    ),
    # Campaigns
    path(
        "campaigns/",
        views.SMSCampaignListCreateView.as_view(),
        name="sms-campaign-list",
    ),
    path(
        "campaigns/<uuid:pk>/",
        views.SMSCampaignDetailView.as_view(),
        name="sms-campaign-detail",
    ),
    # Analytics
    path("analytics/", views.SMSAnalyticsView.as_view(), name="sms-analytics"),
]
