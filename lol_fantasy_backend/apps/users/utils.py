import pyotp
import qrcode
import io
import base64
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


# ── OTP SECRET & QR CODE ─────────────────────
def generate_otp_secret() -> str:
    return pyotp.random_base32()


def generate_qr_code_bytes(email: str, secret: str) -> bytes:
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email, issuer_name="LoL Fantasy League"
    )
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    img    = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_qr_code_base64(email: str, secret: str) -> str:
    encoded = base64.b64encode(generate_qr_code_bytes(email, secret)).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def verify_otp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code, valid_window=1)


# ── MOT DE PASSE TEMPORAIRE ──────────────────
def generate_temp_password(length=10) -> str:
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(random.choices(chars, k=length))


# ── EMAIL OTP (6 chiffres) ───────────────────
def generate_email_otp() -> str:
    return str(random.randint(100000, 999999))


def set_email_otp(user) -> str:
    from apps.users.models import Utilisateur
    code = generate_email_otp()
    user.email_otp_code    = code
    user.email_otp_expires = timezone.now() + timedelta(minutes=10)
    user.save()
    return code


def verify_email_otp(user, code: str) -> bool:
    if not user.email_otp_code or not user.email_otp_expires:
        return False
    if timezone.now() > user.email_otp_expires:
        return False
    return user.email_otp_code == code


# ── EMAILS ───────────────────────────────────
def send_credentials_email(email: str, username: str, temp_password: str):
    """Envoyé par l'admin quand il approuve une demande d'inscription."""
    subject = "⚔️ LoL Fantasy League — Vos identifiants de connexion"
    message = f"""
Bonjour {username},

Votre demande d'inscription à LoL Fantasy League a été approuvée !

Voici vos identifiants :
  Email    : {email}
  Mot de passe : {temp_password}

Connectez-vous sur : http://localhost:3000/login

⚠️ Vous devrez changer votre mot de passe lors de votre première connexion.

Bonne chance sur la Faille !
— L'équipe LoL Fantasy League
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])


def send_otp_email(email: str, username: str, code: str):
    """Envoyé lors du login si l'user a choisi la méthode email."""
    subject = "⚔️ LoL Fantasy League — Code de vérification"
    message = f"""
Bonjour {username},

Votre code de vérification est :

        {code}

Ce code expire dans 10 minutes.
Si vous n'avez pas demandé ce code, ignorez cet email.

— L'équipe LoL Fantasy League
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])


def send_reset_password_email(email: str, username: str, temp_password: str):
    """Envoyé lors d'une demande de mot de passe oublié."""
    subject = "⚔️ LoL Fantasy League — Réinitialisation du mot de passe"
    message = f"""
Bonjour {username},

Vous avez demandé une réinitialisation de mot de passe.

Votre mot de passe temporaire :
        {temp_password}

Connectez-vous et changez-le immédiatement.
— L'équipe LoL Fantasy League
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])