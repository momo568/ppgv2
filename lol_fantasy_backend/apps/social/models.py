from django.db import models
from django.conf import settings
from apps.matches.models import Match, ProTeam


class Pronostic(models.Model):
    user             = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pronostics'
    )
    match            = models.ForeignKey(Match,   on_delete=models.CASCADE, related_name='pronostics')
    predicted_winner = models.ForeignKey(ProTeam, on_delete=models.CASCADE)
    is_correct       = models.BooleanField(null=True, blank=True)
    points_earned    = models.IntegerField(default=0)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together     = ['user', 'match']
        ordering            = ['-created_at']
        verbose_name        = 'Pronostic'
        verbose_name_plural = 'Pronostics'

    def __str__(self):
        return f"{self.user.username} → {self.predicted_winner.acronym} ({self.match})"


class Follow(models.Model):
    follower   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='following'
    )
    following  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followers'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together     = ['follower', 'following']
        verbose_name        = 'Follow'
        verbose_name_plural = 'Follows'

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"
