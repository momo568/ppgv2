import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'

import django
django.setup()

from apps.matches.lolesports import _get, ALL_LEAGUE_IDS, get_schedule, get_live

print("=== TEST SCHEDULE ===")
try:
    r = _get('getSchedule', {'leagueId': ALL_LEAGUE_IDS})
    events = r.get('data', {}).get('schedule', {}).get('events', [])
    print(f"Total events: {len(events)}")
    states = {}
    for e in events:
        s = e.get('state', 'unknown')
        states[s] = states.get(s, 0) + 1
    print(f"Par statut: {states}")
    for e in events[:3]:
        teams = e.get('match', {}).get('teams', [])
        c1 = teams[0].get('code','?') if len(teams) > 0 else '?'
        c2 = teams[1].get('code','?') if len(teams) > 1 else '?'
        print(f"  {e.get('state'):12} | {c1} vs {c2} | {e.get('startTime','')[:16]}")
except Exception as ex:
    print(f"ERREUR: {ex}")

print()
print("=== TEST LIVE ===")
try:
    r2 = _get('getLive')
    ev2 = r2.get('data', {}).get('schedule', {}).get('events', [])
    print(f"Live events: {len(ev2)}")
    for e in ev2[:2]:
        print(f"  {e.get('type')} | {e.get('state')}")
except Exception as ex:
    print(f"ERREUR: {ex}")

print()
print("=== TEST get_schedule() ===")
try:
    data = get_schedule()
    print(f"Parsed: {len(data)} matchs")
    if data:
        m = data[0]
        t1 = m.get('team1', {})
        t2 = m.get('team2', {})
        print(f"  Premier: {t1.get('code')} vs {t2.get('code')} | state={m.get('state')}")
except Exception as ex:
    print(f"ERREUR: {ex}")
