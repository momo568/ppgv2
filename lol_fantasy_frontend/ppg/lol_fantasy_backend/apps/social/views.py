from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q

from .models import Pronostic, Follow
from .serializers import PronosticSerializer, FollowSerializer
from apps.matches.models import Match, ProTeam
from apps.users.models import Utilisateur


# ── PRONOSTICS ───────────────────────────────────────
class PronosticListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        match_id = request.query_params.get('match_id')
        qs = Pronostic.objects.filter(user=request.user)
        if match_id:
            qs = qs.filter(match_id=match_id)
        return Response(PronosticSerializer(qs, many=True).data)

    def post(self, request):
        match_id   = request.data.get('match_id')
        team_id    = request.data.get('predicted_winner_id')

        if not match_id or not team_id:
            return Response({'error': 'match_id et predicted_winner_id requis.'}, status=400)

        try:
            match = Match.objects.get(pk=match_id)
        except Match.DoesNotExist:
            return Response({'error': 'Match introuvable.'}, status=404)

        if match.status != 'scheduled':
            return Response({'error': 'Le match a déjà commencé ou est terminé.'}, status=400)

        try:
            team = ProTeam.objects.get(pk=team_id)
        except ProTeam.DoesNotExist:
            return Response({'error': 'Équipe introuvable.'}, status=404)

        if team not in [match.team1, match.team2]:
            return Response({'error': 'L\'équipe ne joue pas ce match.'}, status=400)

        pronostic, created = Pronostic.objects.update_or_create(
            user=request.user, match=match,
            defaults={'predicted_winner': team},
        )
        return Response(
            PronosticSerializer(pronostic).data,
            status=201 if created else 200
        )


# ── FOLLOW ───────────────────────────────────────────
class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_pk):
        if user_pk == request.user.pk:
            return Response({'error': 'Vous ne pouvez pas vous suivre vous-même.'}, status=400)
        try:
            target = Utilisateur.objects.get(pk=user_pk)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)

        follow, created = Follow.objects.get_or_create(follower=request.user, following=target)
        if not created:
            return Response({'error': 'Vous suivez déjà cet utilisateur.'}, status=400)
        return Response({'message': f'Vous suivez maintenant {target.username}.'}, status=201)


class UnfollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_pk):
        try:
            follow = Follow.objects.get(follower=request.user, following_id=user_pk)
            follow.delete()
            return Response({'message': 'Vous ne suivez plus cet utilisateur.'})
        except Follow.DoesNotExist:
            return Response({'error': 'Vous ne suivez pas cet utilisateur.'}, status=404)


# ── LISTE FOLLOWING / FOLLOWERS ──────────────────────
class FollowingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        follows = Follow.objects.filter(follower=request.user).select_related('following')
        data = [{
            'user_id':  f.following.id,
            'username': f.following.username,
            'since':    f.created_at.strftime('%d/%m/%Y'),
        } for f in follows]
        return Response(data)


class FollowersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        follows = Follow.objects.filter(following=request.user).select_related('follower')
        data = [{
            'user_id':  f.follower.id,
            'username': f.follower.username,
            'since':    f.created_at.strftime('%d/%m/%Y'),
        } for f in follows]
        return Response(data)


# ── CLASSEMENT GLOBAL (SOCIAL) ────────────────────────
class SocialRankingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count
        from apps.users.models import Utilisateur

        users = Utilisateur.objects.filter(is_staff=False).annotate(
            total_points=Sum('fantasy_scores__points'),
            pronostics_ok=Count('pronostics', filter=Q(pronostics__is_correct=True)),
        ).order_by('-total_points')[:100]

        data = []
        for idx, u in enumerate(users):
            is_followed = Follow.objects.filter(follower=request.user, following=u).exists()
            data.append({
                'rank':          idx + 1,
                'user_id':       u.id,
                'username':      u.username,
                'total_points':  u.total_points or 0,
                'pronostics_ok': u.pronostics_ok,
                'is_followed':   is_followed,
            })
        return Response(data)
