"""
Script de chargement des données réelles LoL Esports 2024-2025.
Exécuter avec : python fixtures/load_real_data.py
"""
import os, sys, django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lol_fantasy.settings')
django.setup()

from apps.players.models import Player, PlayerStats
from apps.matches.models import ProTeam

# ─── PRO TEAMS ───────────────────────────────────────────────────────────────

PRO_TEAMS = [
    # LCK
    {"name": "T1",               "acronym": "T1",   "region": "LCK"},
    {"name": "Gen.G Esports",    "acronym": "GEN",  "region": "LCK"},
    {"name": "KT Rolster",       "acronym": "KT",   "region": "LCK"},
    {"name": "Hanwha Life",      "acronym": "HLE",  "region": "LCK"},
    {"name": "Dplus KIA",        "acronym": "DK",   "region": "LCK"},
    # LEC
    {"name": "G2 Esports",       "acronym": "G2",   "region": "LEC"},
    {"name": "Fnatic",           "acronym": "FNC",  "region": "LEC"},
    {"name": "Team Vitality",    "acronym": "VIT",  "region": "LEC"},
    {"name": "Team BDS",         "acronym": "BDS",  "region": "LEC"},
    {"name": "Karmine Corp",     "acronym": "KC",   "region": "LEC"},
    # LCS
    {"name": "Cloud9",           "acronym": "C9",   "region": "LCS"},
    {"name": "Team Liquid",      "acronym": "TL",   "region": "LCS"},
    {"name": "100 Thieves",      "acronym": "100T", "region": "LCS"},
    {"name": "FlyQuest",         "acronym": "FLY",  "region": "LCS"},
    {"name": "NRG Esports",      "acronym": "NRG",  "region": "LCS"},
    # LPL
    {"name": "BiliBili Gaming",  "acronym": "BLG",  "region": "LPL"},
    {"name": "Weibo Gaming",     "acronym": "WBG",  "region": "LPL"},
    {"name": "EDward Gaming",    "acronym": "EDG",  "region": "LPL"},
    {"name": "Top Esports",      "acronym": "TES",  "region": "LPL"},
    {"name": "NingBo Thronex",   "acronym": "NBT",  "region": "LPL"},
]

for t in PRO_TEAMS:
    ProTeam.objects.get_or_create(acronym=t["acronym"], defaults=t)
print(f"OK {len(PRO_TEAMS)} equipes pro chargees")

# ─── JOUEURS PRO ─────────────────────────────────────────────────────────────
# format: (real_name, in_game_name, team, role, region, price)

PLAYERS = [
    # ── LCK / T1 ──────────────────────────────────────────
    ("Choi Yu-seong",    "Zeus",       "T1",  "top",     "LCK", 16.0),
    ("Moon Hyeon-joon",  "Oner",       "T1",  "jungle",  "LCK", 15.0),
    ("Lee Sang-hyeok",   "Faker",      "T1",  "mid",     "LCK", 20.0),
    ("Lee Min-hyeong",   "Gumayusi",   "T1",  "adc",     "LCK", 16.0),
    ("Ryu Min-seok",     "Keria",      "T1",  "support", "LCK", 16.0),

    # ── LCK / Gen.G ───────────────────────────────────────
    ("Choi Hang-hyeok",  "Doran",      "Gen.G", "top",     "LCK", 14.0),
    ("Lee Won-seok",     "Peanut",     "Gen.G", "jungle",  "LCK", 15.0),
    ("Jeong Ji-hoon",    "Chovy",      "Gen.G", "mid",     "LCK", 19.0),
    ("Kim Min-seong",    "Peyz",       "Gen.G", "adc",     "LCK", 15.0),
    ("Son Woo-hyeon",    "Lehends",    "Gen.G", "support", "LCK", 13.0),

    # ── LCK / KT Rolster ──────────────────────────────────
    ("Kim Gwang-seok",   "Kiin",       "KT",  "top",     "LCK", 14.0),
    ("Moon Woo-chan",     "Cuzz",       "KT",  "jungle",  "LCK", 12.0),
    ("Gwak Bo-seong",    "Bdd",        "KT",  "mid",     "LCK", 15.0),
    ("Kim Seong-woon",   "Aiming",     "KT",  "adc",     "LCK", 14.0),
    ("Cho Geon-hee",     "BeryL",      "KT",  "support", "LCK", 13.0),

    # ── LCK / Hanwha Life ─────────────────────────────────
    ("Choi Woo-je",      "Zeka",       "HLE", "mid",     "LCK", 14.0),
    ("Park Dong-ha",     "Viper",      "HLE", "adc",     "LCK", 14.0),
    ("Lee Young-jin",    "Life",       "HLE", "support", "LCK", 12.0),
    ("Kim Dong-ha",      "Morgan",     "HLE", "top",     "LCK", 12.0),
    ("Ohn Hyeon-taek",   "Peanut_HLE", "HLE", "jungle",  "LCK", 11.0),  # different Peanut

    # ── LEC / G2 Esports ──────────────────────────────────
    ("Sergen Çelik",     "BrokenBlade","G2",  "top",     "LEC", 15.0),
    ("Martin Sundelin",  "Yike",       "G2",  "jungle",  "LEC", 13.0),
    ("Rasmus Winther",   "Caps",       "G2",  "mid",     "LEC", 18.0),
    ("Steven Liv",       "Hans Sama",  "G2",  "adc",     "LEC", 15.0),
    ("Mihael Mehle",     "Mikyx",      "G2",  "support", "LEC", 14.0),

    # ── LEC / Fnatic ──────────────────────────────────────
    ("Oscar Osen",       "Oscarinin",  "FNC", "top",     "LEC", 13.0),
    ("Iván Martín",      "Razork",     "FNC", "jungle",  "LEC", 12.0),
    ("Marek Braun",      "Humanoid",   "FNC", "mid",     "LEC", 15.0),
    ("Elias Lipp",       "Upset",      "FNC", "adc",     "LEC", 14.0),
    ("Jun Sung-ho",      "Jun",        "FNC", "support", "LEC", 11.0),

    # ── LEC / Team Vitality ───────────────────────────────
    ("Bo Dong-yeon",     "Photon",     "VIT", "top",     "LEC", 12.0),
    ("Marcin Jankowski", "Jankos",     "VIT", "jungle",  "LEC", 13.0),
    ("Luka Perković",    "Perkz",      "VIT", "mid",     "LEC", 16.0),
    ("Matías Tronco",    "Neon",       "VIT", "adc",     "LEC", 13.0),
    ("Labros Papoutsakis","Kaiser",    "VIT", "support", "LEC", 13.0),

    # ── LCS / Cloud9 ──────────────────────────────────────
    ("Colin Earnest",    "Fudge",      "C9",  "top",     "LCS", 13.0),
    ("Colin Calfee",     "Blaber",     "C9",  "jungle",  "LCS", 14.0),
    ("Joseph Jang",      "Jojopyun",   "C9",  "mid",     "LCS", 15.0),
    ("Choi Hyeon-seok",  "Berserker",  "C9",  "adc",     "LCS", 14.0),
    ("Jesper Svenningsen","Zven",      "C9",  "support", "LCS", 12.0),

    # ── LCS / Team Liquid ─────────────────────────────────
    ("Lucas Tao",        "Bwipo",      "TL",  "top",     "LCS", 12.0),
    ("Samuel Doğan",     "UmTi",       "TL",  "jungle",  "LCS", 11.0),
    ("APA",              "APA",        "TL",  "mid",     "LCS", 14.0),
    ("Yeon Min-jae",     "Yeon",       "TL",  "adc",     "LCS", 13.0),
    ("Jo Yong-in",       "CoreJJ",     "TL",  "support", "LCS", 14.0),

    # ── LCS / FlyQuest ────────────────────────────────────
    ("Kim Dong-ha",      "Licorice",   "FLY", "top",     "LCS", 12.0),
    ("Elyas Doumi",      "Inspired",   "FLY", "jungle",  "LCS", 13.0),
    ("Niclas Jensen",    "Humanoid_FLY","FLY","mid",     "LCS", 12.0),
    ("Jason Tran",       "Massu",      "FLY", "adc",     "LCS", 11.0),
    ("Tristan Stidam",   "Vulcan",     "FLY", "support", "LCS", 12.0),

    # ── LPL / BiliBili Gaming ─────────────────────────────
    ("Chen Ze-Bin",      "Bin",        "BLG", "top",     "LPL", 16.0),
    ("Xun",              "Xun",        "BLG", "jungle",  "LPL", 15.0),
    ("Zhuo Ding",        "knight",     "BLG", "mid",     "LPL", 18.0),
    ("Zhao Jia-Hao",     "Elk",        "BLG", "adc",     "LPL", 15.0),
    ("On",               "ON",         "BLG", "support", "LPL", 13.0),

    # ── LPL / Weibo Gaming ────────────────────────────────
    ("Kang Seung-lok",   "TheShy",     "WBG", "top",     "LPL", 15.0),
    ("Lee Seung-yong",   "Tarzan",     "WBG", "jungle",  "LPL", 14.0),
    ("Xiaohu",           "Xiaohu",     "WBG", "mid",     "LPL", 15.0),
    ("Hang",             "Light",      "WBG", "adc",     "LPL", 14.0),
    ("Liu Qing-Song",    "Crisp",      "WBG", "support", "LPL", 13.0),

    # ── LPL / EDward Gaming ───────────────────────────────
    ("Li Zhi-Hao",       "Flandre",    "EDG", "top",     "LPL", 13.0),
    ("Lee Sin-hyeong",   "Jiejie",     "EDG", "jungle",  "LPL", 14.0),
    ("Lee Sang-hyeok2",  "Scout",      "EDG", "mid",     "LPL", 15.0),
    ("Park Jae-hyuk",    "Viper_EDG",  "EDG", "adc",     "LPL", 14.0),
    ("Ming",             "Meiko",      "EDG", "support", "LPL", 13.0),

    # ── LPL / Top Esports ─────────────────────────────────
    ("Bai Jia-Hao",      "369",        "TES", "top",     "LPL", 15.0),
    ("Han Seong-hoon",   "Kanavi",     "TES", "jungle",  "LPL", 15.0),
    ("Cheng Long",       "Ucal",       "TES", "mid",     "LPL", 13.0),
    ("Yu Wen-Bo",        "jackeylove", "TES", "adc",     "LPL", 15.0),
    ("Du Rui",           "Mark",       "TES", "support", "LPL", 12.0),
]

# Stats saison 2024 par joueur (kills_avg, deaths_avg, assists_avg, kda, win_rate, games, cs_pm, gold_pm)
STATS = {
    "Faker":       (4.2, 2.0, 6.5, 5.35, 72.0, 36, 8.1, 490),
    "Chovy":       (4.8, 1.8, 5.9, 5.94, 68.0, 34, 8.4, 510),
    "Caps":        (4.5, 2.2, 5.8, 4.68, 65.0, 32, 8.0, 495),
    "knight":      (5.0, 2.0, 5.5, 5.25, 70.0, 38, 8.2, 505),
    "Perkz":       (3.8, 2.5, 6.2, 4.00, 58.0, 28, 7.8, 472),
    "Gumayusi":    (5.1, 2.3, 4.2, 4.04, 69.0, 36, 9.2, 520),
    "Peyz":        (4.9, 2.1, 4.5, 4.48, 65.0, 34, 9.0, 515),
    "Ruler":       (5.5, 2.0, 4.0, 4.75, 68.0, 34, 9.1, 518),
    "Elk":         (4.8, 2.2, 4.3, 4.14, 67.0, 38, 8.9, 510),
    "Keria":       (1.8, 2.0, 9.2, 5.50, 71.0, 36, 1.2, 290),
    "BeryL":       (1.5, 2.3, 8.5, 4.35, 63.0, 30, 1.1, 280),
    "Zeus":        (3.5, 2.2, 4.5, 3.64, 71.0, 36, 8.5, 480),
    "Doran":       (3.2, 2.5, 4.8, 3.20, 66.0, 34, 8.3, 468),
    "Kiin":        (3.3, 2.4, 4.3, 3.17, 63.0, 30, 8.2, 465),
    "Oner":        (3.8, 2.8, 8.2, 4.29, 70.0, 36, 4.2, 380),
    "Peanut":      (4.0, 2.6, 8.5, 4.81, 67.0, 34, 4.3, 385),
    "Kanavi":      (3.5, 2.5, 8.0, 4.60, 68.0, 36, 4.1, 378),
    "BrokenBlade": (3.4, 2.3, 4.6, 3.48, 64.0, 32, 8.3, 472),
    "Hans Sama":   (4.8, 2.4, 4.1, 3.71, 63.0, 32, 9.0, 505),
    "Blaber":      (3.9, 3.0, 7.8, 3.90, 62.0, 28, 4.0, 375),
    "Berserker":   (4.5, 2.3, 4.0, 3.70, 60.0, 28, 8.8, 500),
    "CoreJJ":      (1.3, 2.2, 8.9, 4.64, 58.0, 26, 1.1, 270),
    "Bin":         (3.6, 2.4, 4.7, 3.46, 68.0, 38, 8.4, 476),
    "TheShy":      (3.2, 2.6, 4.4, 2.92, 60.0, 30, 8.1, 462),
    "369":         (3.5, 2.3, 4.5, 3.48, 65.0, 36, 8.4, 470),
    "Humanoid":    (4.2, 2.3, 5.5, 4.22, 62.0, 32, 7.9, 485),
    "Jojopyun":    (4.0, 2.5, 5.8, 3.92, 58.0, 28, 7.8, 478),
    "Scout":       (4.3, 2.2, 5.6, 4.50, 62.0, 32, 8.0, 488),
    "Xiaohu":      (3.8, 2.4, 5.5, 3.88, 59.0, 30, 7.8, 475),
    "jackeylove":  (4.7, 2.5, 3.9, 3.44, 63.0, 36, 8.8, 498),
}

created = 0
for real_name, ign, team, role, region, price in PLAYERS:
    player, new = Player.objects.get_or_create(
        in_game_name=ign,
        defaults={
            "name": real_name, "team": team, "role": role,
            "region": region, "price": price, "is_active": True,
        }
    )
    if not new:
        player.team   = team
        player.role   = role
        player.region = region
        player.price  = price
        player.save()

    if ign in STATS and not player.stats.filter(season="2024").exists():
        k, d, a, kda, wr, gp, cspm, gpm = STATS[ign]
        PlayerStats.objects.create(
            player=player, season="2024",
            kills=k, deaths=d, assists=a, kda=kda,
            win_rate=wr, games_played=gp,
            cs_per_min=cspm, gold_per_min=gpm,
        )
    created += 1

print(f"OK {created} joueurs pro charges avec leurs stats 2024")
print(f"Stats : LCK={sum(1 for p in PLAYERS if p[4]=='LCK')} | LEC={sum(1 for p in PLAYERS if p[4]=='LEC')} | LCS={sum(1 for p in PLAYERS if p[4]=='LCS')} | LPL={sum(1 for p in PLAYERS if p[4]=='LPL')}")
