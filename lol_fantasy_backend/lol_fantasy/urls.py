from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'user_routes': {
            'inscription'   : 'http://localhost:8000/api/auth/demande/',
            'login'         : 'http://localhost:8000/api/auth/login/',
            'choose_otp'    : 'http://localhost:8000/api/auth/login/choose-otp/',
            'verify_otp'    : 'http://localhost:8000/api/auth/login/verify/',
            'forgot_password': 'http://localhost:8000/api/auth/forgot-password/',
            'profile'       : 'http://localhost:8000/api/auth/profile/',
        },
        'admin_routes': {
            'stats'         : 'http://localhost:8000/api/admin/stats/',
            'demandes'      : 'http://localhost:8000/api/admin/demandes/',
            'utilisateurs'  : 'http://localhost:8000/api/admin/utilisateurs/',
        }
    })

urlpatterns = [
    path('admin/',            admin.site.urls),
    path('api/auth/',         include('apps.users.urls')),
    path('api/admin/',        include('apps.users.admin_urls')),
    path('api/manager/',      include('apps.users.manager_urls')),
    path('api/players/',      include('apps.players.urls')),
    path('api/leagues/',      include('apps.leagues.urls')),
    path('api/rosters/',      include('apps.rosters.urls')),
    path('api/matches/',      include('apps.matches.urls')),
    path('api/scores/',       include('apps.scores.urls')),
    path('api/market/',       include('apps.market.urls')),
    path('api/social/',       include('apps.social.urls')),
    path('api/chatbot/',      include('apps.chatbot.urls')),
    path('',                  api_root),
]