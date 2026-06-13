from django.urls import path
from .views import LeagueRankingView, MyScoresView, GlobalRankingView, CalculateScoresView

urlpatterns = [
    path('my/',                            MyScoresView.as_view(),      name='my-scores'),
    path('global/',                        GlobalRankingView.as_view(), name='global-ranking'),
    path('ranking/<int:league_id>/',       LeagueRankingView.as_view(), name='league-ranking'),
    path('calculate/<int:match_pk>/',      CalculateScoresView.as_view(), name='calculate-scores'),
]
