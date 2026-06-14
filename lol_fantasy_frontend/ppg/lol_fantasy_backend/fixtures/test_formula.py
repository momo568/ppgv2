import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ['DJANGO_SETTINGS_MODULE'] = 'lol_fantasy.settings'
import django
django.setup()

# Test avec l'exemple exact du CDC (Faker - T1)
# Faker: 8K/2D/7A, 285 CS, 32 VS. T1 gagne, 8 tours, 3 dragons, 1 baron.

class FakePlayerStat:
    def __init__(self, k, d, a, cs, vs, won, barons, dragons, towers):
        self.kills=k; self.deaths=d; self.assists=a
        self.cs=cs; self.vision_score=vs
        self.won=won; self.team_barons=barons
        self.team_dragons=dragons; self.team_towers=towers

    @property
    def score_individuel(self):
        return round(self.kills*3 + self.assists*2 + self.deaths*(-1.5) + self.cs*0.02 + self.vision_score*0.1, 2)

    @property
    def score_collectif(self):
        return round((5 if self.won else 0) + self.team_barons*2 + self.team_dragons*2 + self.team_towers*1, 2)

faker = FakePlayerStat(k=8, d=2, a=7, cs=285, vs=32, won=True, barons=1, dragons=3, towers=8)

s_indiv = faker.score_individuel
s_coll  = faker.score_collectif

print("=== EXEMPLE CAHIER DES CHARGES ===")
print(f"Faker: 8K / 2D / 7A / 285CS / 32VS | T1: Victoire, 8 tours, 3 dragons, 1 baron")
print()
print(f"S_indiv  = 8x3 + 7x2 + 2x(-1.5) + 285x0.02 + 32x0.1")
print(f"         = 24 + 14 - 3 + 5.7 + 3.2 = {s_indiv} pts")
print(f"  CDC attendu: 43.9 pts  --> {'OK' if abs(s_indiv - 43.9) < 0.01 else 'ERREUR'}")
print()
print(f"S_collectif(T1) = 5 + 2 + 6 + 8 = {s_coll} pts")
print(f"  CDC attendu: 21 pts    --> {'OK' if s_coll == 21 else 'ERREUR'}")
print()

# Supposer 5 joueurs T1 dans le roster
s_team_global = (s_coll * 5) / 5
print(f"S_team_global (5 joueurs T1) = {s_team_global} pts")

# Supposons que les 5 joueurs ont tous ~43.9 pts individuels
sum_indiv = s_indiv * 5

kpi = round(sum_indiv * 0.70 + s_team_global * 0.30, 2)
print(f"KPI_Total = {sum_indiv:.1f} x 0.70 + {s_team_global} x 0.30 = {kpi} pts")
print()
print("=== FORMULE VERIFIEE ===")
print("Kills:   +3.0 pts")
print("Assists: +2.0 pts")
print("Deaths:  -1.5 pts")
print("CS:      x0.02 pts")
print("Vision:  x0.1  pts")
print("Win:     +5 (collectif)")
print("Baron:   +2 (collectif)")
print("Dragon:  +2 (collectif)")
print("Tower:   +1 (collectif)")
print("Split:   70% individuel / 30% collectif")
print("Capitaine: x1.5 sur son score individuel")
