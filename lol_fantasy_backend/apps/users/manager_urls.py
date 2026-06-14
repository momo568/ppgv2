from django.urls import path
from .manager_views import (
    ManagerDashboardView, ManagerLeaguesView, ManagerLeagueDetailView,
    ManagerInviteView, ManagerMembersView, ManagerRostersView,
    ManagerLockLeagueView, ManagerRankingView,
    PromoteToManagerView, DemoteManagerView,
)

urlpatterns = [
    # Dashboard
    path('dashboard/',                          ManagerDashboardView.as_view(),    name='manager-dashboard'),

    # Ligues
    path('leagues/',                            ManagerLeaguesView.as_view(),      name='manager-leagues'),
    path('leagues/<int:pk>/',                   ManagerLeagueDetailView.as_view(), name='manager-league-detail'),
    path('leagues/<int:pk>/invite/',            ManagerInviteView.as_view(),       name='manager-invite'),
    path('leagues/<int:pk>/members/',           ManagerMembersView.as_view(),      name='manager-members'),
    path('leagues/<int:pk>/rosters/',           ManagerRostersView.as_view(),      name='manager-rosters'),
    path('leagues/<int:pk>/lock/',              ManagerLockLeagueView.as_view(),   name='manager-lock'),
    path('leagues/<int:pk>/ranking/',           ManagerRankingView.as_view(),      name='manager-ranking'),

    # Gestion des rôles (admin only)
    path('users/<int:pk>/promote-manager/',     PromoteToManagerView.as_view(),    name='promote-manager'),
    path('users/<int:pk>/demote-manager/',      DemoteManagerView.as_view(),       name='demote-manager'),
]
