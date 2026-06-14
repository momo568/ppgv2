from django.db import models


class Player(models.Model):
    ROLE_CHOICES = [
        ('top',     'Top'),
        ('jungle',  'Jungle'),
        ('mid',     'Mid'),
        ('adc',     'ADC'),
        ('support', 'Support'),
    ]
    REGION_CHOICES = [
        ('LEC', 'LEC'),
        ('LCK', 'LCK'),
        ('LCS', 'LCS'),
        ('LPL', 'LPL'),
        ('VCS', 'VCS'),
        ('LJL', 'LJL'),
        ('PCS', 'PCS'),
        ('CBLOL', 'CBLOL'),
    ]

    name          = models.CharField(max_length=100)
    in_game_name  = models.CharField(max_length=50, unique=True)
    team          = models.CharField(max_length=100)
    team_code     = models.CharField(max_length=10, blank=True, default='')  # ex: C9, T1, GEN
    role          = models.CharField(max_length=10, choices=ROLE_CHOICES)
    region        = models.CharField(max_length=5,  choices=REGION_CHOICES)
    price         = models.DecimalField(max_digits=8, decimal_places=1, default=10.0)
    image_url     = models.URLField(blank=True, default='')
    is_active     = models.BooleanField(default=True)
    bio           = models.TextField(blank=True, default='')
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['region', 'team', 'role']
        verbose_name        = 'Joueur Pro'
        verbose_name_plural = 'Joueurs Pro'

    def __str__(self):
        return f"{self.in_game_name} ({self.team})"


class PlayerStats(models.Model):
    player         = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='stats')
    season         = models.CharField(max_length=30)   # ex: "2024 Spring"
    games_played   = models.IntegerField(default=0)
    kills          = models.FloatField(default=0.0)    # moyenne par game
    deaths         = models.FloatField(default=0.0)
    assists        = models.FloatField(default=0.0)
    kda            = models.FloatField(default=0.0)
    cs_per_min     = models.FloatField(default=0.0)
    gold_per_min   = models.FloatField(default=0.0)
    win_rate       = models.FloatField(default=0.0)    # 0–100
    damage_per_min = models.FloatField(default=0.0)

    class Meta:
        unique_together     = ['player', 'season']
        verbose_name        = 'Stats Joueur'
        verbose_name_plural = 'Stats Joueurs'

    def __str__(self):
        return f"{self.player.in_game_name} — {self.season}"
