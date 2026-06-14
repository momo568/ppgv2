import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lol_fantasy.settings')
django.setup()

from django.test import Client
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import Utilisateur
from apps.matches.models import Match
from apps.matches import lolesports

OK, FAIL = 0, 0
def check(name, cond, detail=''):
    global OK, FAIL
    if cond:
        OK += 1
        print(f'  [OK] {name}')
    else:
        FAIL += 1
        print(f'  [!!] {name} -> {detail}')

now = timezone.now()
print('HEURE:', now.strftime('%H:%M UTC'), '|', f'{(now.hour+1)%24:02d}:{now.strftime("%M")} Tunis')
print()

# Tokens
mgr   = Utilisateur.objects.filter(role='manager').first() or Utilisateur.objects.first()
admin = Utilisateur.objects.filter(is_staff=True).first()
tok   = str(RefreshToken.for_user(mgr).access_token)
tok_a = str(RefreshToken.for_user(admin).access_token)
c = Client()

print('=== 1. ENDPOINTS CRITIQUES ===')
from apps.leagues.models import League
lg = League.objects.filter(created_by__role='manager').first()
lid = lg.id if lg else 1
endpoints = [
    ('/api/players/', tok),
    ('/api/matches/', tok),
    ('/api/matches/live/', tok),
    ('/api/matches/schedule/', tok),
    ('/api/leagues/my/', tok),
    ('/api/scores/global/', tok),
    ('/api/scores/my/', tok),
    ('/api/social/ranking/', tok),
    ('/api/market/history/', tok),
    (f'/api/scores/ranking/{lid}/', tok),
    ('/api/admin/stats/', tok_a),
]
for url, t in endpoints:
    r = c.get(url, HTTP_AUTHORIZATION=f'Bearer {t}')
    check(f'GET {url}', r.status_code == 200, f'status {r.status_code}')

print()
print('=== 2. COHERENCE TEMPS (matchs futurs jamais "termines") ===')
schedule = lolesports.get_schedule()
from django.utils.dateparse import parse_datetime
bad = []
for m in schedule:
    st = m.get('startTime', '')
    dt = parse_datetime(st) if st else None
    if dt and dt > now + timedelta(minutes=5) and m.get('state') == 'completed':
        t1 = (m.get('team1') or {}).get('code','?')
        t2 = (m.get('team2') or {}).get('code','?')
        bad.append(f'{t1} vs {t2} ({st})')
check('Aucun match futur marque completed', len(bad) == 0, f'{len(bad)} matchs: {bad[:3]}')

# Matchs passes restent completed
past_done = [m for m in schedule if parse_datetime(m.get('startTime','') or '2030-01-01T00:00:00Z') and parse_datetime(m.get('startTime','')) < now - timedelta(hours=6) and m.get('team1',{}).get('wins',0)+m.get('team2',{}).get('wins',0) > 0]
check('Matchs passes joues = completed', all(m.get('state')=='completed' for m in past_done[:10]) if past_done else True)

print()
print('=== 3. COHERENCE DB ===')
# Aucun match scheduled avec une date passee de +12h ET un score (incoherence)
incoherent = Match.objects.filter(status='finished', team1_score=0, team2_score=0, winner__isnull=True).count()
check('Pas de match "finished" sans resultat', incoherent == 0, f'{incoherent} matchs finished 0-0 sans winner')

# Rosters: chaque roster complet a exactement 1 capitaine
from apps.rosters.models import Roster
bad_cap = 0
for r in Roster.objects.all():
    if r.slots.count() == 5 and r.slots.filter(is_captain=True).count() != 1:
        bad_cap += 1
check('Chaque roster complet a 1 capitaine', bad_cap == 0, f'{bad_cap} rosters sans capitaine unique')

# Scores: total_points coherent avec FantasyScore
from apps.scores.models import FantasyScore
from apps.leagues.models import LeagueMember
from django.db.models import Sum
mismatch = 0
for lm in LeagueMember.objects.all():
    real = FantasyScore.objects.filter(user=lm.user, league=lm.league).aggregate(t=Sum('points'))['t'] or 0
    if abs(round(real,2) - round(lm.total_points,2)) > 0.01:
        mismatch += 1
check('total_points = somme des FantasyScore', mismatch == 0, f'{mismatch} membres incoherents')

print()
print('=== 4. AUTO-SYNC ACTIF ===')
from apps.matches.views import _auto_sync_background, _last_sync
import threading
_last_sync[0] = 0
t = threading.Thread(target=_auto_sync_background, daemon=True)
t.start(); t.join(timeout=30)
check('Auto-sync execute sans erreur', not t.is_alive())

print()
print('='*50)
print(f'  RESULTAT: {OK} OK / {FAIL} ECHECS')
print('='*50)
