from django.urls import path
from .views import PlayerListView, PlayerDetailView, PlayerStatsView

urlpatterns = [
    path('',              PlayerListView.as_view(),  name='player-list'),
    path('<int:pk>/',     PlayerDetailView.as_view(), name='player-detail'),
    path('<int:pk>/stats/', PlayerStatsView.as_view(), name='player-stats'),
]
