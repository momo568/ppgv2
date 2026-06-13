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
        from django.db.models import Sum
        from apps.users.models import Utilisateur

        users = Utilisateur.objects.annotate(
            total=Sum('fantasy_scores__points')
        ).order_by('-total')[:50]

        data = [{
            'rank':         idx + 1,
            'username':     u.username,
            'total_points': u.total or 0,
        } for idx, u in enumerate(users)]

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
