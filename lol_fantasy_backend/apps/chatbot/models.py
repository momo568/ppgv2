from django.db import models
from django.conf import settings


class ChatMessage(models.Model):
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages'
    )
    message    = models.TextField()
    response   = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering        = ['-created_at']
        verbose_name    = 'Message Chatbot'
        verbose_name_plural = 'Messages Chatbot'

    def __str__(self):
        return f"{self.user.username}: {self.message[:50]}"
