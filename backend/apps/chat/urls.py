from django.urls import path

from . import views

app_name = "chat"

urlpatterns = [
    # Conversations
    path(
        "conversations/",
        views.ConversationListCreateView.as_view(),
        name="conversation-list-create",
    ),
    path(
        "conversations/contacts/",
        views.ContactListView.as_view(),
        name="contact-list",
    ),
    path(
        "conversations/<uuid:conversation_id>/",
        views.ConversationDeleteView.as_view(),
        name="conversation-delete",
    ),
    # Messages
    path(
        "conversations/<uuid:conversation_id>/messages/",
        views.MessageListView.as_view(),
        name="message-list",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/upload/",
        views.MessageUploadView.as_view(),
        name="message-upload",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/read/",
        views.MessageReadReceiptView.as_view(),
        name="message-read-receipt",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/<uuid:message_id>/",
        views.MessageDeleteView.as_view(),
        name="message-delete",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/<uuid:message_id>/pin/",
        views.MessagePinView.as_view(),
        name="message-pin",
    ),
    # Message search
    path(
        "messages/search/",
        views.MessageSearchView.as_view(),
        name="message-search",
    ),
    # Message templates
    path(
        "templates/",
        views.MessageTemplateListCreateView.as_view(),
        name="template-list-create",
    ),
    path(
        "templates/<uuid:template_id>/",
        views.MessageTemplateDetailView.as_view(),
        name="template-detail",
    ),
    # Chat Rooms (group / broadcast)
    path(
        "rooms/",
        views.ChatRoomListCreateView.as_view(),
        name="room-list-create",
    ),
    path(
        "rooms/<uuid:room_id>/",
        views.ChatRoomDetailView.as_view(),
        name="room-detail",
    ),
    path(
        "rooms/<uuid:room_id>/messages/",
        views.ChatRoomMessageListView.as_view(),
        name="room-message-list",
    ),
    path(
        "rooms/<uuid:room_id>/messages/<uuid:message_id>/",
        views.RoomMessageDeleteView.as_view(),
        name="room-message-delete",
    ),
    path(
        "rooms/<uuid:room_id>/messages/<uuid:message_id>/pin/",
        views.RoomMessagePinView.as_view(),
        name="room-message-pin",
    ),
]
