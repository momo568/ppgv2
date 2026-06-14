from django.db import models
from django.conf import settings
from apps.leagues.models import League, LeagueMember
from apps.matches.models import Match
from apps.rosters.models import Roster


class FantasyScore(models.Model):
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fantasy_scores'
    )
    league     = models.ForeignKey(League, on_delete=models.CASCADE, related_name='scores')
    match      = models.ForeignKey(Match,  on_delete=models.CASCADE, related_name='fantasy_scores')
    points     = models.FloatField(default=0.0)
    breakdown  = models.JSONField(default=dict)   # {player_id: points, ...}
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together     = ['user', 'league', 'match']
        ordering            = ['-points']
        verbose_name        = 'Score Fantasy'
        verbose_name_plural = 'Scores Fantasy'

    def __str__(self):
        return f"{self.user.username} | {self.league.name} | {self.match} → {self.points}pts"


def calculate_scores_for_match(match):
    """
    KPI_Total = (SUM(S_indiv) × 0.70) + (S_team_global × 0.30)
    S_indiv   = K×3 + A×2 + D×(-1.5) + CS×0.02 + VS×0.1
    S_collectif = Win×5 + Barons×2 + Dragons×2 + Tours×1
    S_team_global = moyenne des S_collectif des 5 joueurs du roster
    Capitaine : son S_indiv est multiplié par 1.5
    """
    player_stats = {ps.player_id: ps for ps in match.player_stats.all()}
    if not player_stats:
        return 0

    rosters = Roster.objects.filter(
        slots__player_id__in=player_stats.keys()
    ).distinct().select_related('user', 'league')

    count = 0
    for roster in rosters:
        slots = list(roster.slots.select_related('player').all())
        breakdown = {}

        # ── Score individuel total (avec bonus capitaine) ──────────────
        sum_indiv = 0.0
        for slot in slots:
            ps = player_stats.get(slot.player_id)
            if ps is None:
                continue
            s = ps.score_individuel
            if slot.is_captain:
                s = round(s * 1.5, 2)
            breakdown[str(slot.player_id)] = {
                'name'      : slot.player.in_game_name,
                'indiv'     : s,
                'collectif' : ps.score_collectif,
                'captain'   : slot.is_captain,
            }
            sum_indiv += s

        # ── Score collectif moyen du roster (5 joueurs) ────────────────
        collectifs = []
        for slot in slots:
            ps = player_stats.get(slot.player_id)
            if ps is not None:
                collectifs.append(ps.score_collectif)

        s_team_global = round(sum(collectifs) / 5, 2) if collectifs else 0.0

        # ── KPI Total 70% / 30% ────────────────────────────────────────
        kpi_total = round(sum_indiv * 0.70 + s_team_global * 0.30, 2)

        score, _ = FantasyScore.objects.update_or_create(
            user=roster.user, league=roster.league, match=match,
            defaults={
                'points'   : kpi_total,
                'breakdown': {
                    'players'        : breakdown,
                    'sum_indiv'      : round(sum_indiv, 2),
                    's_team_global'  : s_team_global,
                    'kpi_total'      : kpi_total,
                },
            },
        )
        LeagueMember.objects.filter(
            league=roster.league, user=roster.user
        ).update(total_points=models.F('total_points') + kpi_total)
        roster.user.points = roster.user.points + int(kpi_total)
        roster.user.niveau = max(1, roster.user.points // 50 + 1)
        roster.user.save(update_fields=['points', 'niveau'])
        count += 1

    return count
