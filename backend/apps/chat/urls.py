from django.urls import path

from . import views

app_name = "chat"

urlpatterns = [
    # List + create rooms
    path("rooms/", views.ChatRoomListCreateView.as_view(), name="room-list-create"),
    # Message history + REST message send
    path(
        "rooms/<uuid:room_id>/messages/",
        views.MessageListCreateView.as_view(),
        name="message-list-create",
    ),
]
