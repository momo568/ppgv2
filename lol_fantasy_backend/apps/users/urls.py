from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    DemandeInscriptionView,
    LoginView, ChooseOTPMethodView, OTPVerifyView,
    LogoutView, ForgotPasswordView, ChangePasswordView,
    QRCodeImageView, ProfileView,
)

urlpatterns = [
    # Formulaire d'inscription → admin
    path('demande/',              DemandeInscriptionView.as_view(), name='demande'),

    # Login flow
    path('login/',                LoginView.as_view(),              name='login'),
    path('login/choose-otp/',     ChooseOTPMethodView.as_view(),    name='choose-otp'),
    path('login/verify/',         OTPVerifyView.as_view(),          name='otp-verify'),

    # Logout
    path('logout/',               LogoutView.as_view(),             name='logout'),

    # Mot de passe
    path('forgot-password/',      ForgotPasswordView.as_view(),     name='forgot-password'),
    path('change-password/',      ChangePasswordView.as_view(),     name='change-password'),

    # QR Code
    path('qrcode/<int:user_id>/', QRCodeImageView.as_view(),        name='qrcode'),

    # Profil
    path('profile/',              ProfileView.as_view(),            name='profile'),

    # JWT refresh
    path('token/refresh/',        TokenRefreshView.as_view(),       name='token-refresh'),
]