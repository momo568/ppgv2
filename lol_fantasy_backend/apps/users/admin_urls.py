from django.urls import path
from .admin_views import (
    AdminStatsView,
    AdminDemandesView,
    AdminApprouverDemandeView,
    AdminRejeterDemandeView,
    AdminUtilisateursView,
    AdminToggleUserView,
    AdminDeleteUserView,
    AdminPromouvoirView,
    AdminRetirerAdminView,
)
from .manager_views import PromoteToManagerView, DemoteManagerView

urlpatterns = [
    # Stats
    path('stats/',
         AdminStatsView.as_view(),
         name='admin-stats'),

    # Demandes
    path('demandes/',
         AdminDemandesView.as_view(),
         name='admin-demandes'),
    path('demandes/<int:pk>/approuver/',
         AdminApprouverDemandeView.as_view(),
         name='admin-approuver'),
    path('demandes/<int:pk>/rejeter/',
         AdminRejeterDemandeView.as_view(),
         name='admin-rejeter'),

    # Utilisateurs
    path('utilisateurs/',
         AdminUtilisateursView.as_view(),
         name='admin-users'),
    path('utilisateurs/<int:pk>/toggle/',
         AdminToggleUserView.as_view(),
         name='admin-toggle'),
    path('utilisateurs/<int:pk>/promouvoir/',
         AdminPromouvoirView.as_view(),
         name='admin-promouvoir'),
    path('utilisateurs/<int:pk>/retirer-admin/',
         AdminRetirerAdminView.as_view(),
         name='admin-retirer'),
    path('utilisateurs/<int:pk>/',
         AdminDeleteUserView.as_view(),
         name='admin-delete'),

    # Gestion rôle Manager
    path('utilisateurs/<int:pk>/set-manager/',
         PromoteToManagerView.as_view(),
         name='admin-set-manager'),
    path('utilisateurs/<int:pk>/unset-manager/',
         DemoteManagerView.as_view(),
         name='admin-unset-manager'),
]