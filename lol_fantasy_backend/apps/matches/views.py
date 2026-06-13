from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import ProTeam, Match, MatchPlayerStat
from .serializers import ProTeamSerializer, MatchSerializer, MatchPlayerStatSerializer
from . import lolesports


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


# ── MATCHS EN DIRECT + RÉCEMMENT TERMINÉS ────────────
class LiveEsportsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            live = lolesports.get_live()
            recently_finished = lolesports.get_recently_finished(limit=8)
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
