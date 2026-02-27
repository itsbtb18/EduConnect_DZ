from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "ai_chatbot"
router = DefaultRouter()
router.register("knowledge", views.KnowledgeBaseViewSet, basename="knowledge-base")
router.register("sessions", views.ChatSessionViewSet, basename="chat-session")

urlpatterns = [
    path("", include(router.urls)),
    path("chat/", views.ChatQueryView.as_view(), name="chat-query"),
]
