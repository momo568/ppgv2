from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Transfer
from .serializers import TransferSerializer


# ── HISTORIQUE DES TRANSFERTS ─────────────────────────
class TransferHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        league_id = request.query_params.get('league_id')
        qs = Transfer.objects.filter(user=request.user)
        if league_id:
            qs = qs.filter(league_id=league_id)
        return Response(TransferSerializer(qs.order_by('-date'), many=True).data)


# ── TRANSFERTS D'UNE LIGUE (admin / manager) ─────────
class LeagueTransfersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, league_id):
        qs = Transfer.objects.filter(league_id=league_id).order_by('-date')
        return Response(TransferSerializer(qs, many=True).data)
