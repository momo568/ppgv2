from django.urls import path
from .views import TransferHistoryView, LeagueTransfersView

urlpatterns = [
    path('history/',                    TransferHistoryView.as_view(),  name='transfer-history'),
    path('league/<int:league_id>/',     LeagueTransfersView.as_view(),  name='league-transfers'),
]
