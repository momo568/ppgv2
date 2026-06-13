from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Utilisateur, DemandeInscription
from .serializers import (
    DemandeInscriptionSerializer, LoginSerializer,
    OTPVerifySerializer, UserProfileSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer,
    ChooseOTPMethodSerializer, SetOTPMethodSerializer,
)
from .utils import (
    generate_otp_secret, generate_qr_code_bytes,
    generate_qr_code_base64, verify_otp,
    set_email_otp, verify_email_otp,
    send_otp_email, send_reset_password_email,
    generate_temp_password,
)


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


# ── DEMANDE D'INSCRIPTION ─────────────────────────
class DemandeInscriptionView(APIView):
    """
    POST /api/auth/demande/
    L'user soumet son formulaire → admin reçoit et approuve
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DemandeInscriptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Votre demande a été envoyée. L\'administrateur vous contactera par email.'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── LOGIN ÉTAPE 1 ─────────────────────────────────
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            return Response({
                'message'            : 'Identifiants valides.',
                'user_id'            : user.id,
                'otp_method'         : user.otp_method,
                'must_change_password': user.must_change_password,
                'requires_otp'       : user.is_2fa_enabled,
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


# ── CHOIX MÉTHODE 2FA ─────────────────────────────
class ChooseOTPMethodView(APIView):
    """
    POST /api/auth/choose-otp/
    Appelé après login step 1 pour choisir email ou QR
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ChooseOTPMethodSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Utilisateur.objects.get(pk=serializer.validated_data['user_id'])
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        method = serializer.validated_data['otp_method']
        user.otp_method = method
        user.save()

        if method == 'email':
            code = set_email_otp(user)
            send_otp_email(user.email, user.username, code)
            return Response({
                'message': f'Code OTP envoyé à {user.email}',
                'method' : 'email',
                'user_id': user.id,
            })
        else:
            # QR code
            if not user.otp_secret:
                user.otp_secret = generate_otp_secret()
                user.save()
            return Response({
                'message'        : 'Scannez le QR code avec Google Authenticator.',
                'method'         : 'qrcode',
                'user_id'        : user.id,
                'qr_code_base64' : generate_qr_code_base64(user.email, user.otp_secret),
            })


# ── VÉRIFICATION OTP ──────────────────────────────
class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Utilisateur.objects.get(pk=serializer.validated_data['user_id'])
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        code = serializer.validated_data['otp_code']
        valid = False

        if user.otp_method == 'email':
            valid = verify_email_otp(user, code)
            if valid:
                user.email_otp_code    = ''
                user.email_otp_expires = None
                user.save()
        else:
            valid = verify_otp(user.otp_secret, code)

        if valid:
            return Response({
                'message': 'Authentification réussie.',
                'tokens' : get_tokens(user),
                'user'   : UserProfileSerializer(user).data,
            }, status=status.HTTP_200_OK)

        return Response({'error': 'Code OTP invalide ou expiré.'}, status=status.HTTP_401_UNAUTHORIZED)


# ── QR CODE IMAGE ─────────────────────────────────
class QRCodeImageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        try:
            user = Utilisateur.objects.get(pk=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Introuvable.'}, status=404)
        return HttpResponse(generate_qr_code_bytes(user.email, user.otp_secret), content_type='image/png')


# ── MOT DE PASSE OUBLIÉ ───────────────────────────
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = Utilisateur.objects.get(email=serializer.validated_data['email'])
                temp = generate_temp_password()
                user.set_password(temp)
                user.must_change_password = True
                user.save()
                send_reset_password_email(user.email, user.username, temp)
                return Response({'message': 'Un mot de passe temporaire a été envoyé à votre email.'})
            except Utilisateur.DoesNotExist:
                return Response({'error': 'Aucun compte trouvé avec cet email.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── CHANGER MOT DE PASSE ──────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'error': 'Ancien mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data['new_password'])
            user.must_change_password = False
            user.save()
            return Response({'message': 'Mot de passe modifié avec succès.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── PROFIL ────────────────────────────────────────
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── LOGOUT ────────────────────────────────────────
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data.get('refresh')).blacklist()
            return Response({'message': 'Déconnexion réussie.'})
        except Exception:
            return Response({'error': 'Token invalide.'}, status=status.HTTP_400_BAD_REQUEST)