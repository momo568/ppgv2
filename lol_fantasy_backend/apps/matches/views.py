from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import ProTeam, Match, MatchPlayerStat
from .serializers import ProTeamSerializer, MatchSerializer, MatchPlayerStatSerializer
from . import lolesports

import threading
_sync_lock = threading.Lock()
_last_sync = [0]  # timestamp derniere sync

def _auto_sync_background():
    """Synchronise les matchs termines en arriere-plan (max 1 fois toutes les 5 min)."""
    import time
    now = time.time()
    with _sync_lock:
        if now - _last_sync[0] < 300:  # 5 minutes entre chaque sync
            return
        _last_sync[0] = now

    try:
        from django.utils import timezone
        from django.utils.dateparse import parse_datetime
        from apps.players.models import Player
        from apps.scores.models import calculate_scores_for_match
        from apps.social.models import Pronostic

        schedule = lolesports.get_schedule()
        completed = [m for m in schedule if m.get('state') == 'completed' and m.get('id')]

        for m_api in completed:
            ext_id = str(m_api['id'])
            # Skip seulement si deja fini ET deja score (sinon on (re)calcule)
            done = Match.objects.filter(external_id=ext_id, status='finished').first()
            if done and done.player_stats.exists():
                continue

            t1d = m_api.get('team1') or {}
            t2d = m_api.get('team2') or {}
            t1c = t1d.get('code', '')
            t2c = t2d.get('code', '')
            if not t1c or not t2c:
                continue

            rg = (m_api.get('league') or 'LCK')[:6]
            team1, _ = ProTeam.objects.get_or_create(acronym=t1c, defaults={'name': t1d.get('name', t1c), 'region': rg})
            team2, _ = ProTeam.objects.get_or_create(acronym=t2c, defaults={'name': t2d.get('name', t2c), 'region': rg})

            t1w = t1d.get('wins', 0) or 0
            t2w = t2d.get('wins', 0) or 0
            winner = team1 if (t1d.get('outcome') == 'win' or t1w > t2w) else (team2 if (t2d.get('outcome') == 'win' or t2w > t1w) else None)

            start = m_api.get('startTime', '')
            date = parse_datetime(start) if start else timezone.now()

            match_obj, _ = Match.objects.update_or_create(
                external_id=ext_id,
                defaults={
                    'team1': team1, 'team2': team2,
                    'region': m_api.get('league', 'LCK')[:6],
                    'tournament': (m_api.get('blockName') or m_api.get('league', ''))[:100],
                    'date': date or timezone.now(),
                    'status': 'finished',
                    'winner': winner,
                    'team1_score': t1w,
                    'team2_score': t2w,
                }
            )

            # Valider les pronostics (toujours, meme sans roster concerne)
            for prono in Pronostic.objects.filter(match=match_obj, is_correct__isnull=True):
                prono.is_correct = (prono.predicted_winner == winner)
                prono.points_earned = 5 if prono.is_correct else 0
                prono.save()

            # Si aucun joueur du match n'est dans un roster : pas d'appel API couteux,
            # pas de scoring. On garde juste le resultat pour l'affichage du calendrier.
            from apps.matches.scoring_helper import has_rostered_player, ensure_scores
            if not has_rostered_player(match_obj):
                continue

            # Stats joueurs depuis l'API (best-effort)
            try:
                result = lolesports.get_match_result(ext_id)
            except Exception:
                result = None

            if result and result.get('players'):
                ts_map = result.get('team_stats', {})
                for ign, pd in result['players'].items():
                    pl = Player.objects.filter(in_game_name__iexact=ign).first()
                    if not pl:
                        continue
                    tc = pd.get('team_code', '')
                    ts = ts_map.get(tc, {})
                    won = pd.get('won') or (tc == (team1.acronym if winner == team1 else ''))
                    MatchPlayerStat.objects.update_or_create(
                        match=match_obj, player=pl,
                        defaults={
                            'kills': int(pd.get('kills') or 0),
                            'deaths': int(pd.get('deaths') or 0),
                            'assists': int(pd.get('assists') or 0),
                            'cs': int(pd.get('cs') or 0),
                            'vision_score': int(pd.get('vision') or 0),
                            'gold': int(pd.get('gold') or 0),
                            'damage': int(pd.get('damage') or 0),
                            'duration_minutes': float(pd.get('duration') or 30),
                            'won': bool(won),
                            'team_towers': int(ts.get('towers') or 0),
                            'team_dragons': int(ts.get('dragons') or 0),
                            'team_barons': int(ts.get('barons') or 0),
                        }
                    )

            # Garantir stats + scores (genere des stats fallback si l'API n'en a pas)
            ensure_scores(match_obj)

        # Mettre a jour les matchs live
        for m_api in schedule:
            if m_api.get('state') == 'inProgress' and m_api.get('id'):
                Match.objects.filter(external_id=str(m_api['id']), status='scheduled').update(status='live')

    except Exception:
        pass  # sync silencieuse, ne jamais crasher la requete


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


# ── ÉQUIPES PRO ──────────────────────────────────────
class ProTeamListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        region = request.query_params.get('region')
        qs = ProTeam.objects.all()
        if region:
            qs = qs.filter(region=region)
        return Response(ProTeamSerializer(qs, many=True).data)

    def post(self, request):
        s = ProTeamSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


# ── MATCHS ───────────────────────────────────────────
class MatchListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        qs = Match.objects.all()
        region     = request.query_params.get('region')
        tournament = request.query_params.get('tournament')
        stat       = request.query_params.get('status')
        if region:
            qs = qs.filter(region=region)
        if tournament:
            qs = qs.filter(tournament__icontains=tournament)
        if stat:
            qs = qs.filter(status=stat)
        return Response(MatchSerializer(qs, many=True).data)

    def post(self, request):
        s = MatchSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


# ── DÉTAIL MATCH ─────────────────────────────────────
class MatchDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [IsAdminUser()]
        return [AllowAny()]

    def _get(self, pk):
        try:
            return Match.objects.get(pk=pk)
        except Match.DoesNotExist:
            return None

    def get(self, request, pk):
        match = self._get(pk)
        if not match:
            return Response({'error': 'Match introuvable.'}, status=404)
        return Response(MatchSerializer(match).data)

    def put(self, request, pk):
        match = self._get(pk)
        if not match:
            return Response({'error': 'Match introuvable.'}, status=404)

        old_status = match.status
        s = MatchSerializer(match, data=request.data, partial=True)
        if s.is_valid():
            updated = s.save()
            if old_status != 'finished' and updated.status == 'finished':
                from apps.scores.models import calculate_scores_for_match
                count = calculate_scores_for_match(updated)
                from apps.social.models import Pronostic
                for p in Pronostic.objects.filter(match=updated, is_correct__isnull=True):
                    p.is_correct     = (p.predicted_winner == updated.winner)
                    p.points_earned  = 5 if p.is_correct else 0
                    p.save()
                return Response({**s.data, 'scores_calculated': count})
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        match = self._get(pk)
        if not match:
            return Response({'error': 'Match introuvable.'}, status=404)
        match.delete()
        return Response({'message': 'Match supprimé.'}, status=204)


# ── STATS D'UN MATCH ─────────────────────────────────
class MatchStatsView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request, pk):
        stats = MatchPlayerStat.objects.filter(match_id=pk)
        return Response(MatchPlayerStatSerializer(stats, many=True).data)

    def post(self, request, pk):
        try:
            match = Match.objects.get(pk=pk)
        except Match.DoesNotExist:
            return Response({'error': 'Match introuvable.'}, status=404)
        s = MatchPlayerStatSerializer(data=request.data)
        if s.is_valid():
            s.save(match=match)
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


# Streams officiels par defaut (chaines Twitch des broadcasts officiels)
# Utilise quand l'API getLive ne retourne pas le stream d'un match en cours
DEFAULT_LEAGUE_STREAMS = {
    'LCK':          [{'provider': 'twitch', 'locale': 'en-US', 'param': 'lck'}],
    'LEC':          [{'provider': 'twitch', 'locale': 'en-US', 'param': 'lec'}],
    'LCS':          [{'provider': 'twitch', 'locale': 'en-US', 'param': 'lcs'}],
    'LPL':          [{'provider': 'twitch', 'locale': 'en-US', 'param': 'lpl'}],
    'EMEA Masters': [{'provider': 'twitch', 'locale': 'en-US', 'param': 'emea_masters'}],
    'PCS':          [{'provider': 'twitch', 'locale': 'en-US', 'param': 'lolpacific'}],
    'CBLOL':        [{'provider': 'twitch', 'locale': 'pt-BR', 'param': 'cblol'}],
    'LJL':          [{'provider': 'twitch', 'locale': 'ja-JP', 'param': 'riotgamesjp'}],
    'VCS':          [{'provider': 'youtube', 'locale': 'vi-VN', 'param': ''}],
}

def _default_streams_for(league_name):
    """Retourne les streams par defaut pour une ligue (matching souple)."""
    if not league_name:
        return []
    for key, streams in DEFAULT_LEAGUE_STREAMS.items():
        if key.lower() in league_name.lower() or league_name.lower() in key.lower():
            # Filtrer les streams sans param (placeholder)
            return [s for s in streams if s.get('param')]
    return []


# ── MATCHS EN DIRECT + RÉCEMMENT TERMINÉS ────────────
class LiveEsportsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            live = lolesports.get_live()
            recently_finished = lolesports.get_recently_finished(limit=8)

            # Enrichir avec les matchs en cours depuis le calendrier
            # (utile pour EMEA Triplex : getLive retourne "? vs ?" sans equipes)
            try:
                schedule = lolesports.get_schedule()
                # Cles de deduplication : ID OU pair d'equipes
                live_ids   = {str(ev.get('id', '')) for ev in live}
                live_pairs = {
                    f"{(ev.get('team1') or {}).get('code','')}|{(ev.get('team2') or {}).get('code','')}"
                    for ev in live
                    if (ev.get('team1') or {}).get('code')
                }

                # Recuperer les streams de l'event anonyme (? vs ?) pour les partager
                shared_streams = []
                anon_idx = None
                for i, ev in enumerate(live):
                    t1c = (ev.get('team1') or {}).get('code', '')
                    t2c = (ev.get('team2') or {}).get('code', '')
                    if not t1c and not t2c and ev.get('streams'):
                        shared_streams = ev.get('streams', [])
                        anon_idx = i
                        break

                added = []
                for m in schedule:
                    if m.get('state') != 'inProgress':
                        continue
                    mid  = str(m.get('id', ''))
                    t1   = m.get('team1') or {}
                    t2   = m.get('team2') or {}
                    c1   = t1.get('code', '')
                    c2   = t2.get('code', '')
                    pair = f"{c1}|{c2}"
                    # Deduplication par ID ET par paire d'equipes
                    if mid in live_ids or pair in live_pairs or not c1 or not c2:
                        continue
                    league_name = m.get('league', '')
                    # Stream : event anonyme partage, sinon stream officiel de la ligue
                    match_streams = shared_streams or _default_streams_for(league_name)
                    added.append({
                        'id'       : mid,
                        'type'     : 'match',
                        'state'    : 'inProgress',
                        'startTime': m.get('startTime', ''),
                        'league'   : league_name,
                        'blockName': m.get('blockName', ''),
                        'leagueImg': '',
                        'streams'  : match_streams,
                        'strategy' : m.get('strategy', 1),
                        'team1'    : t1,
                        'team2'    : t2,
                    })
                    live_pairs.add(pair)  # eviter doublons dans la boucle

                # Supprimer l'event anonyme si on a des matchs identifies
                if added and anon_idx is not None:
                    live.pop(anon_idx)

                live.extend(added)
            except Exception:
                pass

            return Response({
                "live"             : live,
                "recently_finished": recently_finished,
                "count"            : len(live),
            })
        except Exception as e:
            return Response({"live": [], "recently_finished": [], "count": 0, "error": str(e)})


# ── CALENDRIER ESPORTS ───────────────────────────────
class ScheduleEsportsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        league = request.query_params.get("league", "")
        try:
            data = lolesports.get_schedule(league if league else None)
            # Auto-sync en arriere-plan : detecte les matchs termines et calcule les scores
            import threading
            threading.Thread(target=_auto_sync_background, daemon=True).start()
            return Response({"schedule": data, "count": len(data)})
        except Exception as e:
            return Response({"schedule": [], "count": 0, "error": str(e)})


# ── ÉQUIPES + JOUEURS (LoL Esports) ──────────────────
class EsportsTeamsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            data = lolesports.get_teams()
            return Response({"teams": data, "count": len(data)})
        except Exception as e:
            return Response({"teams": [], "count": 0, "error": str(e)})


# ── TOURNOIS D'UNE LIGUE ─────────────────────────────
class TournamentsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        league = request.query_params.get("league", "LEC")
        try:
            data = lolesports.get_tournaments(league)
            return Response({"tournaments": data, "league": league})
        except Exception as e:
            return Response({"tournaments": [], "error": str(e)})


# ── STANDINGS D'UN TOURNOI ───────────────────────────
class StandingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tournament_id = request.query_params.get("tournamentId", "")
        if not tournament_id:
            return Response({"error": "tournamentId requis"}, status=400)
        try:
            data = lolesports.get_standings(tournament_id)
            return Response({"standings": data})
        except Exception as e:
            return Response({"standings": [], "error": str(e)})


# ── MATCHS DE MON ROSTER (filtrés par les équipes du roster) ─────────────────
class MyRosterMatchesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.rosters.models import RosterSlot
        from apps.matches.models import ProTeam as PT

        # Si non authentifié, retourner un message propre
        if not request.user or not request.user.is_authenticated:
            return Response({
                "schedule": [], "count": 0, "teams": [],
                "message": "Connecte-toi pour voir les matchs de ton roster."
            })

        # Equipes dans le roster de l'utilisateur
        team_names = set(
            RosterSlot.objects.filter(roster__user=request.user)
            .values_list('player__team', flat=True)
        )

        if not team_names:
            return Response({
                "schedule": [],
                "count": 0,
                "teams": [],
                "message": "Compose un roster pour voir les matchs de tes equipes."
            })

        # Trouver les acronymes via ProTeam
        team_codes = set()
        for name in team_names:
            pt = PT.objects.filter(name__iexact=name).first()
            if pt:
                team_codes.add(pt.acronym.upper())
            else:
                # Fallback: premier mot du nom d'equipe
                code = name.split()[0].upper()
                team_codes.add(code)

        # Recuperer le calendrier LoL Esports
        try:
            all_schedule = lolesports.get_schedule()
        except Exception as e:
            return Response({"schedule": [], "count": 0, "error": str(e)})

        my_matches = []
        for m in all_schedule:
            t1 = m.get("team1") or {}
            t2 = m.get("team2") or {}
            c1 = (t1.get("code") or "").upper()
            c2 = (t2.get("code") or "").upper()
            matched = (c1 in team_codes or c2 in team_codes)
            if matched:
                m["my_team"] = c1 if c1 in team_codes else c2
                my_matches.append(m)

        my_matches.sort(key=lambda x: x.get("startTime", ""), reverse=True)

        return Response({
            "schedule": my_matches,
            "count"   : len(my_matches),
            "teams"   : list(team_codes),
        })


# ── AUTO-SYNC RÉSULTATS (récupère stats depuis l'API et calcule scores) ───────
class AutoSyncResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.scores.models import calculate_scores_for_match
        from django.utils import timezone
        import datetime

        # Récupérer les matchs completés des dernières 48h depuis l'API
        try:
            schedule = lolesports.get_schedule()
        except Exception as e:
            return Response({"error": f"API indisponible: {e}"}, status=503)

        completed = [m for m in schedule if m.get("state") == "completed"]
        if not completed:
            return Response({"message": "Aucun match complété trouvé.", "synced": 0})

        synced     = 0
        skipped    = 0
        errors     = []
        scores_cal = 0

        for m in completed:
            match_api_id = m.get("id", "")
            if not match_api_id:
                skipped += 1
                continue

            # Éviter de re-syncer un match déjà traité
            if Match.objects.filter(external_id=match_api_id).exists():
                skipped += 1
                continue

            t1_code = (m.get("team1") or {}).get("code", "")
            t2_code = (m.get("team2") or {}).get("code", "")

            # Trouver les ProTeam
            team1 = ProTeam.objects.filter(acronym=t1_code).first()
            team2 = ProTeam.objects.filter(acronym=t2_code).first()
            if not team1 or not team2:
                skipped += 1
                continue

            # Récupérer les stats détaillées
            result = lolesports.get_match_result(match_api_id)

            winner_team = None
            if result and result.get("winner"):
                winner_team = ProTeam.objects.filter(acronym=result["winner"]).first()

            # Créer le match local
            try:
                start = m.get("startTime", "")
                match_date = timezone.now()
                if start:
                    try:
                        from django.utils.dateparse import parse_datetime
                        match_date = parse_datetime(start) or timezone.now()
                    except Exception:
                        pass

                match_obj = Match.objects.create(
                    external_id  = match_api_id,
                    team1        = team1,
                    team2        = team2,
                    region       = m.get("league", team1.region),
                    tournament   = m.get("league", ""),
                    date         = match_date,
                    status       = "finished",
                    winner       = winner_team,
                    team1_score  = (m.get("team1") or {}).get("wins", 0),
                    team2_score  = (m.get("team2") or {}).get("wins", 0),
                )

                # Créer les stats joueurs si disponibles
                stats_added = 0
                if result and result.get("players"):
                    team_stats = result.get("team_stats", {})
                    for name, pdata in result["players"].items():
                        from apps.players.models import Player
                        player = Player.objects.filter(in_game_name__iexact=name).first()
                        if not player:
                            player = Player.objects.filter(in_game_name__icontains=name.split()[-1]).first()
                        if not player:
                            continue
                        tc = pdata.get("team_code", "")
                        ts = team_stats.get(tc, {})
                        MatchPlayerStat.objects.get_or_create(
                            match=match_obj, player=player,
                            defaults={
                                "kills"       : pdata.get("kills",   0),
                                "deaths"      : pdata.get("deaths",  0),
                                "assists"     : pdata.get("assists", 0),
                                "cs"          : pdata.get("cs",      0),
                                "vision_score": pdata.get("vision",  0),
                                "won"         : pdata.get("won", False) or False,
                                "team_towers" : ts.get("towers",  0),
                                "team_dragons": ts.get("dragons", 0),
                                "team_barons" : ts.get("barons",  0),
                            }
                        )
                        stats_added += 1

                synced += 1

                # Calculer les scores si on a des stats
                if stats_added > 0:
                    n = calculate_scores_for_match(match_obj)
                    scores_cal += n

            except Exception as ex:
                errors.append(f"{t1_code} vs {t2_code}: {ex}")

        return Response({
            "message"      : f"{synced} matchs synchronisés, {scores_cal} rosters scorés.",
            "synced"       : synced,
            "skipped"      : skipped,
            "scores_calced": scores_cal,
            "errors"       : errors[:5],
        })
