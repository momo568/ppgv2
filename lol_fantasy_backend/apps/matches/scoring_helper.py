"""
Garantit que chaque match termine produit des scores fantasy.

L'API LoL Esports ne fournit pas toujours les stats detaillees des joueurs
(notamment LPL, VCS, LJL, EMEA). Sans stats, aucun score ne peut etre calcule.
Ce module genere des stats coherentes basees sur le role du joueur et le
resultat (victoire/defaite) pour que les points soient TOUJOURS attribues.
"""
import random
from apps.players.models import Player
from apps.matches.models import MatchPlayerStat
from apps.scores.models import calculate_scores_for_match

# Stats moyennes par role : (kills, deaths, assists, cs, vision)
_ROLE_STATS = {
    'top':     (3, 2.5, 4,  255, 26),
    'jungle':  (4, 2.8, 8,  148, 40),
    'mid':     (4, 2.0, 6,  278, 30),
    'adc':     (5, 2.0, 4,  300, 20),
    'support': (1, 2.0, 10, 38,  58),
}


def _determine_winner_side(match):
    """Retourne (team1_won, team2_won) de facon robuste."""
    if match.winner_id == match.team1_id:
        return True, False
    if match.winner_id == match.team2_id:
        return False, True
    # Fallback sur le score si winner non defini
    if match.team1_score > match.team2_score:
        return True, False
    if match.team2_score > match.team1_score:
        return False, True
    return False, False


def generate_fallback_stats(match):
    """Cree des MatchPlayerStat pour les joueurs des 2 equipes si absentes."""
    t1_won, t2_won = _determine_winner_side(match)
    rng = random.Random(match.id)  # deterministe : meme match = memes stats

    def vary(v):
        return max(0, round(v * rng.uniform(0.8, 1.2)))

    created = 0
    for team, won in [(match.team1, t1_won), (match.team2, t2_won)]:
        players = Player.objects.filter(team_code=team.acronym, is_active=True)
        towers  = 10 if won else 3
        dragons = 4 if won else 1
        barons  = 2 if won else 0
        for p in players:
            if MatchPlayerStat.objects.filter(match=match, player=p).exists():
                continue
            base = _ROLE_STATS.get(p.role, (3, 2, 5, 200, 25))
            MatchPlayerStat.objects.create(
                match=match, player=p,
                kills=vary(base[0] + (1 if won else 0)),
                deaths=vary(base[1] + (0 if won else 1)),
                assists=vary(base[2] + (1 if won else 0)),
                cs=vary(base[3]),
                vision_score=vary(base[4]),
                gold=rng.randint(8000, 14000),
                damage=rng.randint(10000, 35000),
                duration_minutes=rng.uniform(28, 36),
                won=won,
                team_towers=towers, team_dragons=dragons, team_barons=barons,
            )
            created += 1
    return created


def has_rostered_player(match):
    """True si au moins un joueur d'une des 2 equipes est dans un roster."""
    from apps.rosters.models import RosterSlot
    codes = [match.team1.acronym, match.team2.acronym]
    return RosterSlot.objects.filter(player__team_code__in=codes).exists()


def ensure_scores(match):
    """Garantit stats + scores pour un match termine. Retourne le nb de rosters scores.

    N'agit que si un joueur du match est dans un roster (sinon inutile de scorer
    un match que personne n'a choisi)."""
    if not has_rostered_player(match):
        return 0
    if not match.player_stats.exists():
        generate_fallback_stats(match)
    if match.player_stats.exists():
        return calculate_scores_for_match(match)
    return 0
