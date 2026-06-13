from django.urls import path
from .views import (
    ProTeamListView, MatchListView, MatchDetailView, MatchStatsView,
    LiveEsportsView, ScheduleEsportsView, EsportsTeamsView,
    TournamentsView, StandingsView, MyRosterMatchesView, AutoSyncResultsView,
)

urlpatterns = [
    path('teams/',             ProTeamListView.as_view(),       name='team-list'),
    path('live/',              LiveEsportsView.as_view(),       name='live-esports'),
    path('schedule/',          ScheduleEsportsView.as_view(),   name='schedule-esports'),
    path('esports-teams/',     EsportsTeamsView.as_view(),      name='esports-teams'),
    path('tournaments/',       TournamentsView.as_view(),       name='tournaments'),
    path('standings/',         StandingsView.as_view(),         name='standings'),
    path('my-roster/',         MyRosterMatchesView.as_view(),   name='my-roster-matches'),
    path('auto-sync/',         AutoSyncResultsView.as_view(),   name='auto-sync'),
    path('',                   MatchListView.as_view(),         name='match-list'),
    path('<int:pk>/',          MatchDetailView.as_view(),       name='match-detail'),
    path('<int:pk>/stats/',    MatchStatsView.as_view(),        name='match-stats'),
]
