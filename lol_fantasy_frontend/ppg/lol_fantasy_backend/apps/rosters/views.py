from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Roster, RosterSlot
from .serializers import RosterSerializer
from apps.players.models import Player
from apps.leagues.models import League, LeagueMember


# ── ROSTER DE L'UTILISATEUR DANS UNE LIGUE ──────────
class RosterView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, league_id):
        try:
            roster = Roster.objects.get(user=request.user, league_id=league_id)
        except Roster.DoesNotExist:
            return Response({'error': 'Roster introuvable.'}, status=404)
        return Response(RosterSerializer(roster).data)

    def post(self, request, league_id):
        try:
            league = League.objects.get(pk=league_id)
        except League.DoesNotExist:
            return Response({'error': 'Ligue introuvable.'}, status=404)

        if not LeagueMember.objects.filter(league=league, user=request.user).exists():
            return Response({'error': 'Vous n\'êtes pas membre de cette ligue.'}, status=403)

        roster, created = Roster.objects.get_or_create(user=request.user, league=league)
        return Response(RosterSerializer(roster).data, status=201 if created else 200)


# ── AJOUTER UN JOUEUR ────────────────────────────────
class AddPlayerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, league_id):
        player_id = request.data.get('player_id')
        position  = request.data.get('position')
        is_captain = request.data.get('is_captain', False)

        if not player_id or not position:
            return Response({'error': 'player_id et position requis.'}, status=400)

        try:
            player = Player.objects.get(pk=player_id, is_active=True)
        except Player.DoesNotExist:
            return Response({'error': 'Joueur introuvable.'}, status=404)

        try:
            roster = Roster.objects.get(user=request.user, league_id=league_id)
        except Roster.DoesNotExist:
            return Response({'error': 'Créez votre roster d\'abord.'}, status=404)

        if roster.is_locked:
            return Response({'error': 'Le roster est verrouillé.'}, status=400)

        if RosterSlot.objects.filter(roster=roster, player=player).exists():
            return Response({'error': 'Ce joueur est déjà dans votre roster.'}, status=400)

        if RosterSlot.objects.filter(roster=roster, position=position).exists():
            return Response({'error': f'La position {position} est déjà occupée.'}, status=400)

        if float(roster.budget_remaining) < float(player.price):
            return Response({
                'error': f'Budget insuffisant. Disponible: {roster.budget_remaining}, Prix: {player.price}'
            }, status=400)

        if is_captain:
            RosterSlot.objects.filter(roster=roster, is_captain=True).update(is_captain=False)

        RosterSlot.objects.create(
            roster=roster, player=player, position=position, is_captain=is_captain
        )
        roster.budget_used = roster.budget_used + player.price
        roster.save()

        from apps.market.models import Transfer
        Transfer.objects.create(
            user=request.user, player=player,
            league=roster.league, action='buy', price=player.price
        )

        return Response(RosterSerializer(roster).data, status=201)


# ── RETIRER UN JOUEUR ────────────────────────────────
class RemovePlayerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, league_id):
        player_id = request.data.get('player_id')
        if not player_id:
            return Response({'error': 'player_id requis.'}, status=400)

        try:
            roster = Roster.objects.get(user=request.user, league_id=league_id)
        except Roster.DoesNotExist:
            return Response({'error': 'Roster introuvable.'}, status=404)

        if roster.is_locked:
            return Response({'error': 'Le roster est verrouillé.'}, status=400)

        try:
            slot = RosterSlot.objects.get(roster=roster, player_id=player_id)
        except RosterSlot.DoesNotExist:
            return Response({'error': 'Joueur non trouvé dans votre roster.'}, status=404)

        player = slot.player
        slot.delete()
        from decimal import Decimal
        roster.budget_used = max(Decimal(0), roster.budget_used - player.price)
        roster.save()

        from apps.market.models import Transfer
        Transfer.objects.create(
            user=request.user, player=player,
            league=roster.league, action='sell', price=player.price
        )

        return Response(RosterSerializer(roster).data)


# ── DÉFINIR LE CAPITAINE ─────────────────────────────
class SetCaptainView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, league_id):
        player_id = request.data.get('player_id')
        if not player_id:
            return Response({'error': 'player_id requis.'}, status=400)

        try:
            roster = Roster.objects.get(user=request.user, league_id=league_id)
        except Roster.DoesNotExist:
            return Response({'error': 'Roster introuvable.'}, status=404)

        try:
            slot = RosterSlot.objects.get(roster=roster, player_id=player_id)
        except RosterSlot.DoesNotExist:
            return Response({'error': 'Joueur non trouvé dans votre roster.'}, status=404)

        RosterSlot.objects.filter(roster=roster).update(is_captain=False)
        slot.is_captain = True
        slot.save()

        return Response(RosterSerializer(roster).data)
