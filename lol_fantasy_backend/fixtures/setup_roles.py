import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django
django.setup()

from apps.users.models import Utilisateur
from apps.users.utils import generate_otp_secret

# Admins staff -> role=admin
updated = Utilisateur.objects.filter(is_staff=True).update(role='admin')
print(f"Admins mis a jour: {updated} compte(s) -> role=admin")

# Manager demo
if not Utilisateur.objects.filter(email='manager@lolfantasy.com').exists():
    m = Utilisateur(
        email='manager@lolfantasy.com',
        username='manager_demo',
        first_name='Manager',
        last_name='Demo',
        role='manager',
        is_staff=False,
        is_active=True,
        otp_secret=generate_otp_secret(),
        otp_method='email',
        is_2fa_enabled=True,
        must_change_password=False,
    )
    m.set_password('Manager2024!')
    m.save()
    print("Manager demo cree: manager@lolfantasy.com / Manager2024!")
else:
    print("Manager demo existe deja")

# Afficher tous les users
print("\n=== COMPTES EXISTANTS ===")
for u in Utilisateur.objects.all().order_by('role'):
    print(f"  [{u.role:8}] {u.email:40} | {u.username}")
