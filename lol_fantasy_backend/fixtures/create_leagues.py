import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django
django.setup()

from apps.users.models import Utilisateur
from apps.leagues.models import League, LeagueMember

admin = Utilisateur.objects.get(email='oumaimakammoun22@gmail.com')

LEAGUES = [
    # Publiques
    {
        'name'           : 'LCK Legends',
        'description'    : 'La ligue des fans LCK - T1, Gen.G, KT Rolster. Compose ton roster coreen !',
        'is_private'     : False,
        'max_members'    : 20,
        'budget_per_team': 150,
        'status'         : 'active',
    },
    {
        'name'           : 'LEC Masters',
        'description'    : 'Ligue europeenne ouverte a tous. G2, Fnatic, Vitality t attendent.',
        'is_private'     : False,
        'max_members'    : 15,
        'budget_per_team': 130,
        'status'         : 'active',
    },
    {
        'name'           : 'LPL Dragons',
        'description'    : 'La ligue chinoise avec les meilleurs joueurs du monde. BLG, JDG, WBG.',
        'is_private'     : False,
        'max_members'    : 20,
        'budget_per_team': 150,
        'status'         : 'active',
    },
    {
        'name'           : 'All Regions Open',
        'description'    : 'Ligue ouverte toutes regions - mixe tes joueurs LEC, LCK, LCS et LPL !',
        'is_private'     : False,
        'max_members'    : 30,
        'budget_per_team': 160,
        'status'         : 'active',
    },
    # Privees
    {
        'name'           : 'SESAME Fantasy Elite',
        'description'    : 'Ligue privee reservee aux etudiants SESAME. Rejoins avec le code !',
        'is_private'     : True,
        'max_members'    : 10,
        'budget_per_team': 150,
        'status'         : 'active',
    },
    {
        'name'           : 'Faker Fan Club',
        'description'    : 'Ligue privee pour les vrais fans de Faker. Seuls les meilleurs entrent.',
        'is_private'     : True,
        'max_members'    : 8,
        'budget_per_team': 150,
        'status'         : 'active',
    },
    {
        'name'           : 'LCS & LEC Only',
        'description'    : 'Ligue privee occidentale. Joueurs LCS et LEC uniquement.',
        'is_private'     : True,
        'max_members'    : 12,
        'budget_per_team': 120,
        'status'         : 'active',
    },
    {
        'name'           : 'Worlds 2025 Special',
        'description'    : 'Ligue speciale Worlds - compose l equipe ultime avec des joueurs de toutes les regions !',
        'is_private'     : True,
        'max_members'    : 16,
        'budget_per_team': 180,
        'status'         : 'active',
    },
]

created = 0
for data in LEAGUES:
    league, new = League.objects.get_or_create(
        name=data['name'],
        defaults={**data, 'created_by': admin}
    )
    if new:
        LeagueMember.objects.get_or_create(
            league=league, user=admin,
            defaults={'role': 'manager'}
        )
        created += 1
        visibility = 'PUBLIQUE' if not data['is_private'] else 'PRIVEE '
        print(f'[{visibility}] {league.name:30} | code: {league.invite_code} | budget: {league.budget_per_team}cr')
    else:
        print(f'[EXISTE ] {league.name}')

print()
print(f'Total cree: {created} ligues')
print(f'Publiques : {League.objects.filter(is_private=False).count()}')
print(f'Privees   : {League.objects.filter(is_private=True).count()}')
