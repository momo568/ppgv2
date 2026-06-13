import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django
django.setup()

from apps.users.models import Utilisateur
from apps.users.utils import generate_otp_secret
from django.contrib.auth import authenticate

email    = 'oumaimakammoun22@gmail.com'
password = 'Admin1234!'

# Supprimer et recréer proprement
Utilisateur.objects.filter(email=email).delete()

u = Utilisateur(
    email=email,
    username='admin_oumaima',
    is_staff=True,
    is_superuser=True,
    is_active=True,
    otp_secret=generate_otp_secret(),
    otp_method='email',
    is_2fa_enabled=True,
    must_change_password=False,
    first_name='Oumaima',
    last_name='Kammoun',
)
u.set_password(password)
u.save()
print('Compte recree:', email)

# Vérification
test = authenticate(username=email, password=password)
if test:
    print('Auth OK - mot de passe: Admin1234!')
else:
    print('ECHEC AUTH - probleme inconnu')

# Lister tous les admins
print()
print('=== Tous les comptes admin ===')
for a in Utilisateur.objects.filter(is_staff=True):
    print(f'  {a.email} | username={a.username} | active={a.is_active}')
