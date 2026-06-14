from django.urls import path
from .views import LeagueListView, LeagueDetailView, JoinLeagueView, LeaveLeagueView, LeagueMembersView, MyLeaguesView

urlpatterns = [
    path('',                      LeagueListView.as_view(),   name='league-list'),
    path('my/',                   MyLeaguesView.as_view(),    name='my-leagues'),
    path('join/',                 JoinLeagueView.as_view(),   name='join-league'),
    path('<int:pk>/',             LeagueDetailView.as_view(), name='league-detail'),
    path('<int:pk>/leave/',       LeaveLeagueView.as_view(),  name='leave-league'),
    path('<int:pk>/members/',     LeagueMembersView.as_view(), name='league-members'),
]
