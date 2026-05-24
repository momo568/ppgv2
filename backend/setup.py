import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lol_fantasy.settings')
django.setup()

from apps.users.models import Utilisateur
from apps.users.utils import generate_otp_secret

print("=== Setup LoL Fantasy ===")

Utilisateur.objects.filter(is_staff=True).delete()
print("Anciens admins supprimés.")

user = Utilisateur(
    email          = 'oumaimakammoun22@gmail.com',
    username       = 'admin_oumaima',
    is_staff       = True,
    is_superuser   = True,
    is_active      = True,
    otp_secret     = generate_otp_secret(),
    otp_method     = 'email',
    is_2fa_enabled = True,
)
user.set_password('Admin1234!')
user.save()

print(f"Admin créé : {user.email} | is_staff: {user.is_staff}")
print("\nEmail    : oumaimakammoun22@gmail.com")
print("Password : Admin1234!")
print("URL      : http://localhost:3000/admin/login")