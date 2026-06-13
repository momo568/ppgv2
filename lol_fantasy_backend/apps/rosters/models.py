from django.db import models
from django.conf import settings
from apps.players.models import Player
from apps.leagues.models import League


class Roster(models.Model):
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rosters'
    )
    league      = models.ForeignKey(League, on_delete=models.CASCADE, related_name='rosters')
    budget_used = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    is_locked   = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together     = ['user', 'league']
        verbose_name        = 'Roster'
        verbose_name_plural = 'Rosters'

    def __str__(self):
        return f"{self.user.username} — {self.league.name}"

    @property
    def budget_remaining(self):
        return self.league.budget_per_team - self.budget_used

    @property
    def is_complete(self):
        return self.slots.count() == 5


class RosterSlot(models.Model):
    POSITION_CHOICES = [
        ('top',     'Top'),
        ('jungle',  'Jungle'),
        ('mid',     'Mid'),
        ('adc',     'ADC'),
        ('support', 'Support'),
    ]

    roster     = models.ForeignKey(Roster, on_delete=models.CASCADE, related_name='slots')
    player     = models.ForeignKey(Player, on_delete=models.CASCADE)
    position   = models.CharField(max_length=10, choices=POSITION_CHOICES)
    is_captain = models.BooleanField(default=False)

    class Meta:
        unique_together     = ['roster', 'position']
        verbose_name        = 'Slot Roster'
        verbose_name_plural = 'Slots Roster'

    def __str__(self):
        cap = ' ★' if self.is_captain else ''
        return f"{self.roster} — {self.position}: {self.player.in_game_name}{cap}"
