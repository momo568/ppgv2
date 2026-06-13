import random
import string
from django.db import models
from django.conf import settings


def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class League(models.Model):
    STATUS_CHOICES = [
        ('pending',  'En attente'),
        ('active',   'Active'),
        ('finished', 'Terminée'),
    ]

    name            = models.CharField(max_length=100)
    description     = models.TextField(blank=True, default='')
    is_private      = models.BooleanField(default=True)
    invite_code     = models.CharField(max_length=10, unique=True, blank=True)
    max_members     = models.IntegerField(default=10)
    budget_per_team = models.DecimalField(max_digits=8, decimal_places=1, default=150.0)
    created_by      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_leagues'
    )
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_date      = models.DateField(null=True, blank=True)
    end_date        = models.DateField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering        = ['-created_at']
        verbose_name    = 'Ligue'
        verbose_name_plural = 'Ligues'

    def save(self, *args, **kwargs):
        if not self.invite_code:
            code = generate_invite_code()
            while League.objects.filter(invite_code=code).exists():
                code = generate_invite_code()
            self.invite_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class LeagueMember(models.Model):
    ROLE_CHOICES = [
        ('member',  'Membre'),
        ('manager', 'Manager'),
    ]

    league       = models.ForeignKey(League, on_delete=models.CASCADE, related_name='members')
    user         = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='league_memberships'
    )
    role         = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at    = models.DateTimeField(auto_now_add=True)
    total_points = models.FloatField(default=0.0)

    class Meta:
        unique_together     = ['league', 'user']
        ordering            = ['-total_points']
        verbose_name        = 'Membre de ligue'
        verbose_name_plural = 'Membres de ligue'

    def __str__(self):
        return f"{self.user.username} — {self.league.name}"
