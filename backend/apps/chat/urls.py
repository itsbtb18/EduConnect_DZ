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
]
