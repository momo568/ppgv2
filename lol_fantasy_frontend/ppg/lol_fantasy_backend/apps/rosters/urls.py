from django.urls import path
from .views import RosterView, AddPlayerView, RemovePlayerView, SetCaptainView

urlpatterns = [
    path('<int:league_id>/',          RosterView.as_view(),      name='roster'),
    path('<int:league_id>/add/',      AddPlayerView.as_view(),   name='roster-add'),
    path('<int:league_id>/remove/',   RemovePlayerView.as_view(), name='roster-remove'),
    path('<int:league_id>/captain/',  SetCaptainView.as_view(),  name='roster-captain'),
]
