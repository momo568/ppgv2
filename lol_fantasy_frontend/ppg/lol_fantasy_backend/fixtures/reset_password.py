import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django
django.setup()

from apps.users.models import Utilisateur
from apps.users.utils import generate_otp_secret
from django.contrib.auth import authenticate

# Supprimer et recreer proprement
Utilisateur.objects.filter(email='oumaimakammoun22@gmail.com').delete()

u = Utilisateur(
    email='oumaimakammoun22@gmail.com',
    username='oumaima',
    first_name='Oumaima',
    last_name='Kammoun',
    is_staff=True,
    is_superuser=True,
    is_active=True,
    otp_secret=generate_otp_secret(),
    otp_method='email',
    is_2fa_enabled=True,
    must_change_password=False,
)
u.set_password('Oumaima2024')
u.save()

test = authenticate(username='oumaimakammoun22@gmail.com', password='Oumaima2024')
print('Test:', 'OK' if test else 'ECHEC')
print()
print('Email    :', u.email)
print('Password : Oumaima2024')
print('URL      : http://localhost:3000/admin/login')
