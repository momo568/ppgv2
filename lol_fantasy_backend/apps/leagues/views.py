from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import League, LeagueMember
from .serializers import LeagueSerializer, LeagueMemberSerializer


# ── LISTE / CRÉATION ─────────────────────────────────
class LeagueListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        public  = League.objects.filter(is_private=False)
        joined  = League.objects.filter(members__user=request.user)
        leagues = (public | joined).distinct()
        return Response(LeagueSerializer(leagues, many=True).data)

    def post(self, request):
        serializer = LeagueSerializer(data=request.data)
        if serializer.is_valid():
            league = serializer.save(created_by=request.user)
            LeagueMember.objects.create(league=league, user=request.user, role='manager')
            return Response(LeagueSerializer(league).data, status=201)
        return Response(serializer.errors, status=400)


# ── DÉTAIL ────────────────────────────────────────────
class LeagueDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return League.objects.get(pk=pk)
        except League.DoesNotExist:
            return None

    def get(self, request, pk):
        league = self._get(pk)
        if not league:
            return Response({'error': 'Ligue introuvable.'}, status=404)
        return Response(LeagueSerializer(league).data)

    def put(self, request, pk):
        league = self._get(pk)
        if not league:
            return Response({'error': 'Ligue introuvable.'}, status=404)
        if league.created_by != request.user and not request.user.is_staff:
            return Response({'error': 'Accès refusé.'}, status=403)
        serializer = LeagueSerializer(league, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        league = self._get(pk)
        if not league:
            return Response({'error': 'Ligue introuvable.'}, status=404)
        if league.created_by != request.user and not request.user.is_staff:
            return Response({'error': 'Accès refusé.'}, status=403)
        league.delete()
        return Response({'message': 'Ligue supprimée.'}, status=204)


# ── REJOINDRE ─────────────────────────────────────────
class JoinLeagueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('invite_code', '').strip().upper()
        if not code:
            return Response({'error': 'Code d\'invitation requis.'}, status=400)
        try:
            league = League.objects.get(invite_code=code)
        except League.DoesNotExist:
            return Response({'error': 'Code invalide.'}, status=404)

        if LeagueMember.objects.filter(league=league, user=request.user).exists():
            return Response({'error': 'Vous êtes déjà membre de cette ligue.'}, status=400)

        if league.members.count() >= league.max_members:
            return Response({'error': 'La ligue est complète.'}, status=400)

        LeagueMember.objects.create(league=league, user=request.user)
        return Response({'message': f'Vous avez rejoint "{league.name}".'})


# ── QUITTER ───────────────────────────────────────────
class LeaveLeagueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            member = LeagueMember.objects.get(league_id=pk, user=request.user)
        except LeagueMember.DoesNotExist:
            return Response({'error': 'Vous n\'êtes pas membre de cette ligue.'}, status=404)
        if member.role == 'manager' and member.league.created_by == request.user:
            return Response({'error': 'Le créateur ne peut pas quitter sa ligue.'}, status=400)
        member.delete()
        return Response({'message': 'Vous avez quitté la ligue.'})


# ── MEMBRES ───────────────────────────────────────────
class LeagueMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        members = LeagueMember.objects.filter(league_id=pk).order_by('-total_points')
        return Response(LeagueMemberSerializer(members, many=True).data)


# ── MES LIGUES ────────────────────────────────────────
class MyLeaguesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = LeagueMember.objects.filter(user=request.user).select_related('league')
        data = []
        for m in memberships:
            d = LeagueSerializer(m.league).data
            d['my_role']          = m.role
            d['my_total_points']  = m.total_points
            data.append(d)
        return Response(data)
