from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "chat"
router = DefaultRouter()
router.register("conversations", views.ConversationViewSet, basename="conversation")
router.register("templates", views.MessageTemplateViewSet, basename="message-template")
router.register(
    r"conversations/(?P<conversation_pk>[^/.]+)/messages",
    views.MessageViewSet,
    basename="message",
)
urlpatterns = [path("", include(router.urls))]
