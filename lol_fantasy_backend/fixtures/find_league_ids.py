import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django
django.setup()

import requests, urllib3
urllib3.disable_warnings()

API_BASE = "https://esports-api.lolesports.com/persisted/gw"
HEADERS  = {"x-api-key": "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"}

r = requests.get(f"{API_BASE}/getLeagues", headers=HEADERS, params={"hl": "fr-FR"}, timeout=15, verify=False)
leagues = r.json().get("data", {}).get("leagues", [])

TARGET = {"VCS", "LJL", "PCS", "CBLOL", "LLA", "TCL"}
for lg in leagues:
    name = lg.get("name", "")
    slug = lg.get("slug", "")
    lid  = lg.get("id", "")
    if name in TARGET or slug.upper() in TARGET:
        print(f"  {name:10} | id: {lid} | slug: {slug}")
