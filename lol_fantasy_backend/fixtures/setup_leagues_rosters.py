import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django; django.setup()

from apps.players.models import Player
from apps.leagues.models import League, LeagueMember
from apps.rosters.models import Roster, RosterSlot
from apps.users.models import Utilisateur

admin = Utilisateur.objects.get(email='oumaimakammoun22@gmail.com')

def get_players(team_code):
    return list(Player.objects.filter(team_code=team_code, is_active=True))

def show_team(code):
    players = get_players(code)
    print(f"  {code}: {len(players)} joueurs")
    for p in players:
        print(f"    {p.role:8} {p.in_game_name} ({p.price}cr)")

def make_roster(user, league, team_code, captain_role='mid'):
    """Crée un roster complet avec les joueurs d'une équipe."""
    roster, _ = Roster.objects.get_or_create(user=user, league=league)
    RosterSlot.objects.filter(roster=roster).delete()

    players = get_players(team_code)
    role_map = {}
    for p in players:
        if p.role not in role_map:
            role_map[p.role] = p

    POSITIONS = ['top', 'jungle', 'mid', 'adc', 'support']
    total = 0
    added = 0
    for pos in POSITIONS:
        p = role_map.get(pos)
        if not p:
            continue
        is_cap = (pos == captain_role)
        RosterSlot.objects.create(roster=roster, player=p, position=pos, is_captain=is_cap)
        total += float(p.price)
        added += 1
        print(f"    {'[CAP]' if is_cap else '     '} {pos:8} {p.in_game_name:15} {p.price}cr")

    roster.budget_used = total
    roster.save()
    print(f"    --> {added}/5 slots | Budget: {total}cr | Complet: {roster.is_complete}")
    return roster

# ════════════════════════════════════════════════════════════════
print("=== JOUEURS DISPONIBLES PAR EQUIPE ===")
for code in ['C9', 'TLAW', 'T1', 'GEN', 'G2', 'FNC', 'BLG', 'LYON']:
    show_team(code)
print()

# ════════════════════════════════════════════════════════════════
print("=== CREATION DES LIGUES + ROSTERS ===")
print()

LEAGUES_CONFIG = [
    # ── PUBLIQUES ──────────────────────────────────────────────
    {
        'name'       : 'LCS Ce Soir - TLAW vs C9',
        'description': 'Match ce soir 20h00 ! TLAW vs Cloud9 - rejoins et compose ton roster LCS !',
        'is_private' : False,
        'budget'     : 150,
        'max'        : 20,
        'rosters'    : [
            ('C9',   'jungle', 'C9 Fan Roster'),
            ('TLAW', 'support', 'TLAW Fan Roster'),
        ],
    },
    {
        'name'       : 'LCK Weekend - GEN vs T1',
        'description': 'Le clasico coreen - Gen.G vs T1 demain ! Faker, Chovy, Canyon...',
        'is_private' : False,
        'budget'     : 150,
        'max'        : 25,
        'rosters'    : [
            ('T1',  'mid', 'T1 Roster (Faker cap)'),
            ('GEN', 'mid', 'Gen.G Roster (Chovy cap)'),
        ],
    },
    {
        'name'       : 'LCS Summer 2025',
        'description': 'Ligue generale LCS ouverte a tous. Compose ton meilleur roster NA !',
        'is_private' : False,
        'budget'     : 150,
        'max'        : 30,
        'rosters'    : [
            ('C9',   'mid',     'Best of C9'),
            ('LYON', 'jungle',  'Lyon Roster'),
        ],
    },
    {
        'name'       : 'LPL Giants',
        'description': 'La scene chinoise avec les meilleurs joueurs LPL - BLG, JDG, WBG !',
        'is_private' : False,
        'budget'     : 160,
        'max'        : 20,
        'rosters'    : [
            ('BLG', 'mid', 'BLG Roster (Knight cap)'),
        ],
    },
    # ── PRIVEES ────────────────────────────────────────────────
    {
        'name'       : 'SESAME Fantasy Pro',
        'description': 'Ligue privee SESAME - partage le code avec tes amis !',
        'is_private' : True,
        'budget'     : 150,
        'max'        : 10,
        'rosters'    : [
            ('T1',  'mid', 'T1 Best'),
            ('GEN', 'adc', 'GEN Best'),
        ],
    },
    {
        'name'       : 'C9 Fantasy Club',
        'description': 'Ligue privee pour les fans de Cloud9. Code requis.',
        'is_private' : True,
        'budget'     : 130,
        'max'        : 8,
        'rosters'    : [
            ('C9', 'jungle', 'C9 Full Squad'),
        ],
    },
    {
        'name'       : 'LEC Masters Private',
        'description': 'Ligue privee LEC - G2, Fnatic, Vitality.',
        'is_private' : True,
        'budget'     : 150,
        'max'        : 12,
        'rosters'    : [
            ('G2',  'mid', 'G2 Roster (Caps cap)'),
            ('FNC', 'adc', 'Fnatic Roster (Upset cap)'),
        ],
    },
    {
        'name'       : 'Worlds 2025 All-Stars',
        'description': 'Compose l equipe ultime Worlds avec les meilleurs de toutes les regions !',
        'is_private' : True,
        'budget'     : 200,
        'max'        : 16,
        'rosters'    : [],
    },
]

for cfg in LEAGUES_CONFIG:
    league, created = League.objects.get_or_create(
        name=cfg['name'],
        defaults={
            'description'    : cfg['description'],
            'is_private'     : cfg['is_private'],
            'budget_per_team': cfg['budget'],
            'max_members'    : cfg['max'],
            'created_by'     : admin,
            'status'         : 'active',
        }
    )
    if not created:
        print(f"[EXISTE] {league.name}")
        continue

    LeagueMember.objects.get_or_create(
        league=league, user=admin, defaults={'role': 'manager'}
    )

    vis = 'PUBLIQUE' if not cfg['is_private'] else 'PRIVEE  '
    print(f"[{vis}] {league.name} | code: {league.invite_code} | budget: {cfg['budget']}cr")

    # Ajouter les rosters
    for i, (team_code, captain_role, roster_label) in enumerate(cfg['rosters']):
        players = get_players(team_code)
        if not players:
            print(f"  [SKIP] {team_code} - pas de joueurs")
            continue
        print(f"  Roster '{roster_label}' ({team_code}, cap={captain_role}):")
        make_roster(admin, league, team_code, captain_role)
        # Un seul roster par user/league - les autres sont juste affichés
        if i > 0:
            print(f"  [INFO] Seul 1 roster par user - roster {team_code} sera ajouté via frontend")

    print()

# ════════════════════════════════════════════════════════════════
print("=== RECAP FINAL ===")
print(f"Ligues publiques : {League.objects.filter(is_private=False).count()}")
print(f"Ligues privees   : {League.objects.filter(is_private=True).count()}")
print()
print("MATCH CE SOIR 20h00: TLAW vs C9 [LCS]")
print("Apres le match -> Scores -> Bouton 'Sync resultats'")
print("Les points de ton roster C9 seront calcules automatiquement !")
