from django.urls import path
from .views import (
    PronosticListView, FollowView, UnfollowView,
    FollowingListView, FollowersListView, SocialRankingView,
)

urlpatterns = [
    path('ranking/',                SocialRankingView.as_view(),  name='social-ranking'),
    path('pronostics/',             PronosticListView.as_view(),  name='pronostics'),
    path('follow/<int:user_pk>/',   FollowView.as_view(),         name='follow'),
    path('unfollow/<int:user_pk>/', UnfollowView.as_view(),       name='unfollow'),
    path('following/',              FollowingListView.as_view(),  name='following'),
    path('followers/',              FollowersListView.as_view(),  name='followers'),
]
