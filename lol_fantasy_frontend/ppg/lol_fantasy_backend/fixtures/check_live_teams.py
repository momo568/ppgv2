import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django
django.setup()

import requests, urllib3
urllib3.disable_warnings()

API_BASE = "https://esports-api.lolesports.com/persisted/gw"
API_KEY  = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
HEADERS  = {"x-api-key": API_KEY}

def get(endpoint, params=None):
    p = {"hl": "fr-FR"}
    if params: p.update(params)
    r = requests.get(f"{API_BASE}/{endpoint}", headers=HEADERS, params=p, timeout=15, verify=False)
    return r.json()

# ── Live matches ──────────────────────────────
print("=== LIVE MAINTENANT ===")
data = get("getLive")
events = data.get("data", {}).get("schedule", {}).get("events", [])
for e in events:
    teams = (e.get("match") or {}).get("teams") or []
    t1 = teams[0] if len(teams) > 0 else {}
    t2 = teams[1] if len(teams) > 1 else {}
    print(f"  {t1.get('code','?'):6} vs {t2.get('code','?'):6} | {e.get('league',{}).get('name','')} | {e.get('state')}")

# ── Chercher ZEN et SGW dans tous les teams ──
print()
print("=== RECHERCHE ZEN / SGW ===")
LEAGUE_IDS = {
    "LEC": "98767991302996019",
    "LCK": "98767991310872058",
    "LCS": "98767991299243165",
    "LPL": "98767991314006698",
}
ALL = ",".join(LEAGUE_IDS.values())

# Schedule pour trouver ZEN et SGW
data2 = get("getSchedule", {"leagueId": ALL})
events2 = data2.get("data", {}).get("schedule", {}).get("events", [])
found = set()
for e in events2:
    teams = (e.get("match") or {}).get("teams") or []
    for t in teams:
        code = t.get("code", "")
        if code in ("ZEN", "SGW", "zen", "sgw"):
            found.add(code)
            print(f"  Trouve: {code} | {t.get('name','')} | match state: {e.get('state')}")

if not found:
    print("  ZEN et SGW non trouves dans LEC/LCK/LCS/LPL")
    # Cherche dans tous les teams disponibles
    print()
    print("=== TOUS LES TEAMS API (sans filtre region) ===")
    data3 = get("getTeams")
    all_teams = data3.get("data", {}).get("teams", [])
    for t in all_teams:
        code = t.get("code", "")
        if code in ("ZEN", "SGW"):
            print(f"  TROUVE: {t.get('code')} | {t.get('name')} | region: {t.get('homeLeague',{}).get('name','')}")
            for p in (t.get("players") or []):
                print(f"    - {p.get('summonerName','?')} ({p.get('role','')})")
