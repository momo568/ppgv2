import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django; django.setup()
import requests, urllib3
urllib3.disable_warnings()

BASE    = "https://esports-api.lolesports.com/persisted/gw"
FEED    = "https://feed.lolesports.com/livestats/v1"
KEY     = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
HEADERS = {"x-api-key": KEY}

def get(url, params=None):
    p = {"hl": "en-US"}
    if params: p.update(params)
    return requests.get(url, headers=HEADERS, params=p, timeout=15, verify=False).json()

# Game ID du match GEN vs KT game 1
gid = "115548128963037582"
r = get(f"{FEED}/window/{gid}")
frames = r.get("frames", [])
meta  = r.get("gameMetadata", {})
print(f"Match: {meta.get('blueTeamMetadata',{}).get('esportsTeamId')} (blue) vs {meta.get('redTeamMetadata',{}).get('esportsTeamId')} (red)")
print(f"Frames: {len(frames)}")

# Dernier frame = fin du match
last = frames[-1]
print(f"State: {last.get('gameState')}")

blue = last.get("blueTeam", {})
red  = last.get("redTeam", {})
print(f"\nBlue team keys: {list(blue.keys())}")

# Participants blue
blue_players = blue.get("participants", [])
print(f"Blue players: {len(blue_players)}")
if blue_players:
    p = blue_players[0]
    print(f"Player keys: {list(p.keys())}")
    print(f"kills={p.get('kills')} deaths={p.get('deaths')} assists={p.get('assists')} cs={p.get('creepScore')} vs={p.get('visionScore')} gold={p.get('totalGold')}")
    print(f"participantId={p.get('participantId')}")

# Metadata des joueurs
bmeta = meta.get("blueTeamMetadata", {})
bparts = bmeta.get("participantMetadata", [])
print(f"\nBlue metadata players: {len(bparts)}")
if bparts:
    pm = bparts[0]
    print(f"Metadata keys: {list(pm.keys())}")
    print(f"summonerName={pm.get('summonerName')} role={pm.get('role')} participantId={pm.get('participantId')}")
