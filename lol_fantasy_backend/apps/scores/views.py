from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import FantasyScore, calculate_scores_for_match
from .serializers import FantasyScoreSerializer
from apps.leagues.models import LeagueMember


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


# ── CLASSEMENT D'UNE LIGUE ──────────────────────────
class LeagueRankingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, league_id):
        members = LeagueMember.objects.filter(
            league_id=league_id
        ).order_by('-total_points').select_related('user')

        data = [{
            'rank':         idx + 1,
            'username':     m.user.username,
            'total_points': m.total_points,
            'role':         m.role,
        } for idx, m in enumerate(members)]

        return Response(data)


# ── MES SCORES ──────────────────────────────────────
class MyScoresView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        league_id = request.query_params.get('league_id')
        qs = FantasyScore.objects.filter(user=request.user)
        if league_id:
            qs = qs.filter(league_id=league_id)
        return Response(FantasyScoreSerializer(qs.order_by('-created_at'), many=True).data)


# ── CLASSEMENT GLOBAL ────────────────────────────────
class GlobalRankingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count
        from apps.users.models import Utilisateur
        from apps.scores.models import FantasyScore
        from apps.social.models import Pronostic

        # Points fantasy separement
        pts_map = {}
        for fs in FantasyScore.objects.values('user_id').annotate(t=Sum('points')):
            pts_map[fs['user_id']] = round(fs['t'] or 0, 2)

        # Points pronostics corrects
        prono_map = {}
        for p in Pronostic.objects.filter(is_correct=True).values('user_id').annotate(b=Sum('points_earned')):
            prono_map[p['user_id']] = round(p['b'] or 0, 2)

        rows = []
        for u in Utilisateur.objects.all():
            total = round(pts_map.get(u.id, 0.0) + prono_map.get(u.id, 0.0), 2)
            rows.append({'username': u.username, 'total_points': total})

        rows.sort(key=lambda r: (-r['total_points'], r['username']))

        data = [{'rank': i + 1, **r} for i, r in enumerate(rows[:50])]
        return Response(data)


# ── CALCULER SCORES (ADMIN) ──────────────────────────
class CalculateScoresView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, match_pk):
        from apps.matches.models import Match
        try:
            match = Match.objects.get(pk=match_pk)
        except Match.DoesNotExist:
            return Response({'error': 'Match introuvable.'}, status=404)

        if match.status != 'finished':
            return Response({'error': 'Le match n\'est pas terminé.'}, status=400)

        count = calculate_scores_for_match(match)
        return Response({'message': f'Scores calculés pour {count} roster(s).'})
