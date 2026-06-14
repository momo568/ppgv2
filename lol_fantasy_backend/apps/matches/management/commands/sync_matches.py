"""
Commande de synchronisation automatique des matchs LoL Esports.
Usage : python manage.py sync_matches
Lancer toutes les 10 minutes via Windows Task Scheduler.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.matches.models import Match, ProTeam, MatchPlayerStat
from apps.players.models import Player
from apps.scores.models import calculate_scores_for_match
from apps.social.models import Pronostic
from apps.matches import lolesports


class Command(BaseCommand):
    help = 'Synchronise les matchs termines depuis LoL Esports API et calcule les scores fantasy'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Affiche sans sauvegarder')

    def handle(self, *args, **options):
        dry = options['dry_run']
        now = timezone.now()
        self.stdout.write(f'[{now.strftime("%d/%m/%Y %H:%M:%S")}] Synchronisation LoL Esports...')

        # 1. Recuperer le calendrier
        try:
            schedule = lolesports.get_schedule()
        except Exception as e:
            self.stderr.write(f'Erreur API schedule: {e}')
            return

        # 2. Recuperer les matchs live
        try:
            live_data = lolesports.get_live()
            live_ids = {m.get('id') for m in live_data if m.get('id')}
        except Exception:
            live_ids = set()

        # 3. Traiter les matchs termines
        completed = [m for m in schedule if m.get('state') == 'completed' and m.get('id')]
        self.stdout.write(f'  Matchs termines dans API: {len(completed)}')

        synced = 0
        scored = 0
        skipped = 0

        for m_api in completed:
            ext_id = str(m_api.get('id', ''))
            if not ext_id:
                continue

            # Deja fini ET deja score ? -> skip. Sinon on (re)traite pour
            # garantir que les scores sont calcules (l'API manque souvent de stats).
            existing = Match.objects.filter(external_id=ext_id, status='finished').first()
            if existing and existing.player_stats.exists():
                skipped += 1
                continue

            t1_data = m_api.get('team1') or {}
            t2_data = m_api.get('team2') or {}
            t1_code = t1_data.get('code', '')
            t2_code = t2_data.get('code', '')

            if not t1_code or not t2_code:
                continue

            # Trouver ou creer les equipes
            team1 = ProTeam.objects.filter(acronym=t1_code).first()
            team2 = ProTeam.objects.filter(acronym=t2_code).first()
            region_raw = m_api.get('league', 'LCK')
            region_code = region_raw[:6] if region_raw else 'LCK'

            if not team1:
                team1, _ = ProTeam.objects.get_or_create(
                    acronym=t1_code,
                    defaults={'name': t1_data.get('name', t1_code), 'region': region_code}
                )
            if not team2:
                team2, _ = ProTeam.objects.get_or_create(
                    acronym=t2_code,
                    defaults={'name': t2_data.get('name', t2_code), 'region': region_code}
                )

            # Score et vainqueur
            t1_wins = t1_data.get('wins', 0) or 0
            t2_wins = t2_data.get('wins', 0) or 0
            t1_outcome = t1_data.get('outcome', '')
            t2_outcome = t2_data.get('outcome', '')
            winner = None
            if t1_outcome == 'win':
                winner = team1
            elif t2_outcome == 'win':
                winner = team2
            elif t1_wins > t2_wins:
                winner = team1
            elif t2_wins > t1_wins:
                winner = team2

            # Date
            start_str = m_api.get('startTime', '')
            match_date = parse_datetime(start_str) if start_str else now
            if not match_date:
                match_date = now

            region = m_api.get('league', 'LCK')
            tournament = m_api.get('blockName') or m_api.get('league', '')

            if dry:
                self.stdout.write(f'  [DRY] {t1_code} {t1_wins}-{t2_wins} {t2_code} | {tournament}')
                synced += 1
                continue

            # Creer ou mettre a jour le match
            match_obj, created = Match.objects.update_or_create(
                external_id=ext_id,
                defaults={
                    'team1': team1, 'team2': team2,
                    'region': region[:6], 'tournament': tournament[:100],
                    'date': match_date,
                    'status': 'finished',
                    'winner': winner,
                    'team1_score': t1_wins,
                    'team2_score': t2_wins,
                }
            )

            action = 'CREE' if created else 'MIS A JOUR'
            synced += 1

            # Si aucun joueur de ce match n'est dans un roster, inutile de chercher
            # les stats / calculer des scores -> on garde juste le resultat pour l'affichage.
            from apps.matches.scoring_helper import has_rostered_player
            if not has_rostered_player(match_obj):
                # Valider quand meme les pronostics sur ce match
                for prono in Pronostic.objects.filter(match=match_obj, is_correct__isnull=True):
                    prono.is_correct = (prono.predicted_winner == winner)
                    prono.points_earned = 5 if prono.is_correct else 0
                    prono.save()
                continue

            self.stdout.write(
                f'  [{action}] {t1_code} {t1_wins}-{t2_wins} {t2_code} '
                f'| {match_date.strftime("%d/%m %H:%M")} | {tournament}'
            )

            # 4. Recuperer les stats detaillees des joueurs (API, best-effort)
            try:
                result = lolesports.get_match_result(ext_id)
            except Exception:
                result = None

            stats_added = 0
            if result and result.get('players'):
                team_stats = result.get('team_stats', {})
                for ign, pdata in result['players'].items():
                    player = (
                        Player.objects.filter(in_game_name__iexact=ign).first() or
                        Player.objects.filter(in_game_name__icontains=ign.split()[-1]).first()
                    )
                    if not player:
                        continue

                    tc = pdata.get('team_code', '')
                    ts = team_stats.get(tc, {})
                    won = pdata.get('won', False)
                    if won is None:
                        won = (tc == (team1.acronym if winner == team1 else team2.acronym if winner else ''))

                    MatchPlayerStat.objects.update_or_create(
                        match=match_obj, player=player,
                        defaults={
                            'kills'       : int(pdata.get('kills', 0) or 0),
                            'deaths'      : int(pdata.get('deaths', 0) or 0),
                            'assists'     : int(pdata.get('assists', 0) or 0),
                            'cs'          : int(pdata.get('cs', 0) or 0),
                            'vision_score': int(pdata.get('vision', 0) or 0),
                            'gold'        : int(pdata.get('gold', 0) or 0),
                            'damage'      : int(pdata.get('damage', 0) or 0),
                            'duration_minutes': float(pdata.get('duration', 30) or 30),
                            'won'         : bool(won),
                            'team_towers' : int(ts.get('towers', 0) or 0),
                            'team_dragons': int(ts.get('dragons', 0) or 0),
                            'team_barons' : int(ts.get('barons', 0) or 0),
                        }
                    )
                    stats_added += 1

            # 5. Garantir stats + scores (genere des stats fallback si l'API n'en a pas)
            from apps.matches.scoring_helper import ensure_scores
            n = ensure_scores(match_obj)
            if n > 0:
                scored += n
                self.stdout.write(f'    -> {n} score(s) fantasy calcule(s)')

            # 6. Valider les pronostics
            for prono in Pronostic.objects.filter(match=match_obj, is_correct__isnull=True):
                prono.is_correct = (prono.predicted_winner == winner)
                prono.points_earned = 5 if prono.is_correct else 0
                prono.save()

        # 7. Mettre a jour les matchs live dans la DB
        for m_api in [m for m in schedule if m.get('state') == 'inProgress' and m.get('id')]:
            ext_id = str(m_api.get('id', ''))
            Match.objects.filter(external_id=ext_id, status='scheduled').update(status='live')

        self.stdout.write(
            f'\n  Termines: {synced} syncs | {scored} scores | {skipped} deja connus'
        )
        self.stdout.write('  Synchronisation terminee.')
