from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Utilisateur, DemandeInscription
from .utils import generate_otp_secret


class DemandeInscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DemandeInscription
        fields = ['id', 'nom', 'prenom', 'email', 'username', 'message']

    def validate_email(self, value):
        if Utilisateur.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        if DemandeInscription.objects.filter(email=value, statut='en_attente').exists():
            raise serializers.ValidationError("Une demande est déjà en cours pour cet email.")
        return value

    def validate_username(self, value):
        if Utilisateur.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce username est déjà pris.")
        return value


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            request  = self.context.get('request'),
            username = data['email'],
            password = data['password'],
        )
        if not user:
            raise serializers.ValidationError("Email ou mot de passe incorrect.")
        if not user.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")
        data['user'] = user
        return data


class OTPVerifySerializer(serializers.Serializer):
    user_id  = serializers.IntegerField()
    otp_code = serializers.CharField(max_length=6, min_length=6)

    def validate_otp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Le code OTP doit être numérique.")
        return value


class ChooseOTPMethodSerializer(serializers.Serializer):
    user_id    = serializers.IntegerField()
    otp_method = serializers.ChoiceField(choices=['qrcode', 'email'])


class SetOTPMethodSerializer(serializers.Serializer):
    otp_method = serializers.ChoiceField(choices=['qrcode', 'email'])


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model        = Utilisateur
        fields       = [
            'id', 'email', 'username', 'first_name', 'last_name', 'bio',
            'role', 'points', 'niveau', 'is_2fa_enabled',
            'otp_method', 'must_change_password',
            'is_staff', 'is_superuser'
        ]
        read_only_fields = ['id', 'email', 'role', 'points', 'niveau', 'is_staff', 'is_superuser']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()