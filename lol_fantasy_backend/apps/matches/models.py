from django.db import models
from apps.players.models import Player


class ProTeam(models.Model):
    REGION_CHOICES = [
        ('LEC', 'LEC'), ('LCK', 'LCK'), ('LCS', 'LCS'), ('LPL', 'LPL'),
        ('VCS', 'VCS'), ('LJL', 'LJL'), ('PCS', 'PCS'), ('CBLOL', 'CBLOL'),
    ]

    name      = models.CharField(max_length=100)
    acronym   = models.CharField(max_length=10)
    region    = models.CharField(max_length=6, choices=REGION_CHOICES)
    image_url = models.URLField(blank=True, default='')

    class Meta:
        verbose_name        = 'Équipe Pro'
        verbose_name_plural = 'Équipes Pro'

    def __str__(self):
        return f"{self.acronym} ({self.region})"


class Match(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Programmé'),
        ('live',      'En direct'),
        ('finished',  'Terminé'),
        ('cancelled', 'Annulé'),
    ]
    REGION_CHOICES = [
        ('LEC', 'LEC'), ('LCK', 'LCK'), ('LCS', 'LCS'), ('LPL', 'LPL'),
        ('VCS', 'VCS'), ('LJL', 'LJL'), ('PCS', 'PCS'), ('CBLOL', 'CBLOL'),
    ]

    external_id  = models.CharField(max_length=50, blank=True, default='', db_index=True)
    team1        = models.ForeignKey(ProTeam, on_delete=models.CASCADE, related_name='home_matches')
    team2        = models.ForeignKey(ProTeam, on_delete=models.CASCADE, related_name='away_matches')
    region       = models.CharField(max_length=6, choices=REGION_CHOICES)
    tournament   = models.CharField(max_length=100)
    date         = models.DateTimeField()
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    winner       = models.ForeignKey(
        ProTeam, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches'
    )
    team1_score  = models.IntegerField(default=0)
    team2_score  = models.IntegerField(default=0)

    class Meta:
        ordering        = ['-date']
        verbose_name    = 'Match'
        verbose_name_plural = 'Matchs'

    def __str__(self):
        return f"{self.team1.acronym} vs {self.team2.acronym} — {self.date.strftime('%d/%m/%Y')}"


class MatchPlayerStat(models.Model):
    match            = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='player_stats')
    player           = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='match_stats')
    # Stats individuelles
    kills            = models.IntegerField(default=0)
    deaths           = models.IntegerField(default=0)
    assists          = models.IntegerField(default=0)
    cs               = models.IntegerField(default=0)
    vision_score     = models.IntegerField(default=0)
    gold             = models.IntegerField(default=0)
    damage           = models.IntegerField(default=0)
    duration_minutes = models.FloatField(default=30.0)
    # Stats collectives (équipe du joueur pour ce match)
    won              = models.BooleanField(default=False)
    team_barons      = models.IntegerField(default=0)
    team_dragons     = models.IntegerField(default=0)
    team_towers      = models.IntegerField(default=0)

    class Meta:
        unique_together     = ['match', 'player']
        verbose_name        = 'Stat Joueur (Match)'
        verbose_name_plural = 'Stats Joueurs (Match)'

    def __str__(self):
        return f"{self.player.in_game_name} @ {self.match}"

    @property
    def kda(self):
        d = self.deaths or 1
        return round((self.kills + self.assists) / d, 2)

    @property
    def score_individuel(self):
        """S_indiv = K×3 + A×2 + D×(-1.5) + CS×0.02 + VS×0.1"""
        return round(
            self.kills   * 3.0  +
            self.assists * 2.0  +
            self.deaths  * -1.5 +
            self.cs      * 0.02 +
            self.vision_score * 0.1,
            2
        )

    @property
    def score_collectif(self):
        """S_collectif = Victoire×5 + Barons×2 + Dragons×2 + Tours×1"""
        return round(
            (5 if self.won else 0) +
            self.team_barons  * 2 +
            self.team_dragons * 2 +
            self.team_towers  * 1,
            2
        )

    @property
    def fantasy_points(self):
        """Alias pour compatibilité — retourne score_individuel seul (le moteur applique 70/30)"""
        return self.score_individuel
