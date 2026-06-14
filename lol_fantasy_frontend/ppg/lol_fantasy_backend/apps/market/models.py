from django.db import models
from django.conf import settings
from apps.players.models import Player
from apps.leagues.models import League


class Transfer(models.Model):
    ACTION_CHOICES = [
        ('buy',  'Achat'),
        ('sell', 'Vente'),
    ]

    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transfers'
    )
    player    = models.ForeignKey(Player, on_delete=models.CASCADE)
    league    = models.ForeignKey(League, on_delete=models.CASCADE)
    action    = models.CharField(max_length=5, choices=ACTION_CHOICES)
    price     = models.DecimalField(max_digits=8, decimal_places=1)
    date      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering        = ['-date']
        verbose_name    = 'Transfert'
        verbose_name_plural = 'Transferts'

    def __str__(self):
        return f"{self.user.username} — {self.action} {self.player.in_game_name} ({self.league.name})"
