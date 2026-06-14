from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Player, PlayerStats
from .serializers import PlayerSerializer, PlayerStatsSerializer


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


# ── LISTE / CRÉATION ─────────────────────────────────
class PlayerListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        qs = Player.objects.filter(is_active=True)
        region = request.query_params.get('region')
        role   = request.query_params.get('role')
        team   = request.query_params.get('team')
        if region:
            qs = qs.filter(region=region)
        if role:
            qs = qs.filter(role=role)
        if team:
            from django.db.models import Q
            qs = qs.filter(Q(team__icontains=team) | Q(team_code__iexact=team))
        return Response(PlayerSerializer(qs, many=True).data)

    def post(self, request):
        serializer = PlayerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── DÉTAIL / MODIFICATION ─────────────────────────────
class PlayerDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdminUser()]
        return [AllowAny()]

    def _get(self, pk):
        try:
            return Player.objects.get(pk=pk)
        except Player.DoesNotExist:
            return None

    def get(self, request, pk):
        player = self._get(pk)
        if not player:
            return Response({'error': 'Joueur introuvable.'}, status=404)
        return Response(PlayerSerializer(player).data)

    def put(self, request, pk):
        player = self._get(pk)
        if not player:
            return Response({'error': 'Joueur introuvable.'}, status=404)
        serializer = PlayerSerializer(player, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        player = self._get(pk)
        if not player:
            return Response({'error': 'Joueur introuvable.'}, status=404)
        player.delete()
        return Response({'message': 'Joueur supprimé.'}, status=204)


# ── STATS D'UN JOUEUR ─────────────────────────────────
class PlayerStatsView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            player = Player.objects.get(pk=pk)
        except Player.DoesNotExist:
            return Response({'error': 'Joueur introuvable.'}, status=404)
        stats = player.stats.all().order_by('-season')
        return Response(PlayerStatsSerializer(stats, many=True).data)

    def post(self, request, pk):
        try:
            player = Player.objects.get(pk=pk)
        except Player.DoesNotExist:
            return Response({'error': 'Joueur introuvable.'}, status=404)
        serializer = PlayerStatsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(player=player)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
