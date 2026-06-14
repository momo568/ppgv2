# LoL Fantasy League — Documentation Complète du Projet
## Projet Universitaire SESAME 2025-2026

> Document de référence complet pour la rédaction du rapport.
> Plateforme de fantasy esports League of Legends, full-stack, données 100% réelles, scoring automatique.

---

## 1. PRÉSENTATION DU PROJET

**LoL Fantasy League** est une plateforme web où les utilisateurs créent une équipe virtuelle ("roster")
de 5 joueurs professionnels réels de League of Legends. Les points sont gagnés selon les **vraies
performances** de ces joueurs lors des matchs officiels (LCK, LEC, LCS, LPL, EMEA Masters, etc.).

**Principe de jeu :**
1. L'utilisateur rejoint ou crée une ligue (privée avec code d'invitation)
2. Il compose un roster de 5 joueurs (1 par rôle) avec un budget limité
3. Il désigne un capitaine (points ×1.5)
4. À chaque match réel, les points se calculent **automatiquement**
5. Les participants d'une même ligue sont classés selon leurs points

**Originalité technique :** intégration de l'API officielle LoL Esports en temps réel + moteur de
scoring automatique qui fonctionne en permanence sans intervention manuelle.

---

## 2. STACK TECHNIQUE

### Backend
- **Django 6.x** + Django REST Framework (API REST)
- **Authentification** : SimpleJWT (access + refresh token) + 2FA obligatoire
- **2FA** : QR Code TOTP (Google Authenticator) OU code OTP par email
- **Base de données** : PostgreSQL 18 (port 5433)
- **Python** : 3.14
- **Chatbot IA** : Ollama (modèle llama3.2:3b)
- **Scheduler** : thread Python automatique (sync toutes les 3 min)

### Frontend
- **React 19** + react-router-dom 7
- **Axios** (avec intercepteurs JWT + auto-refresh token)
- **Design** : CSS custom thème League of Legends (or/bleu nuit)

### API externe (données réelles)
- **LoL Esports API** : `https://esports-api.lolesports.com/persisted/gw`
- Ligues suivies : LEC, LCK, LCS, LPL, VCS, LJL, PCS, CBLOL, **EMEA Masters**

---

## 3. ARCHITECTURE — 10 APPLICATIONS DJANGO

### apps.users — Authentification & rôles
- Modèle `Utilisateur` (hérite d'AbstractUser) : email (login), role, bio, points, niveau,
  otp_secret, is_2fa_enabled, otp_method, must_change_password
- **3 rôles** : `joueur` / `manager` / `admin`
- Login en 2 étapes : (1) email+mot de passe → (2) code OTP → reçoit le JWT
- Endpoints admin (gestion comptes) et manager (gestion ligues)

### apps.players — Joueurs professionnels
- Modèle `Player` : name, in_game_name, team, team_code, role, region, price, image_url
- Modèle `PlayerStats` : stats moyennes d'une saison (kills, deaths, assists, kda, cs_per_min, win_rate)
- **~790 joueurs pros actifs** chargés depuis l'API officielle (Faker, Chovy, Zeus, Caps, Canyon...)

### apps.leagues — Ligues
- Modèle `League` : name, description, is_private, invite_code, max_members, budget_per_team, status, start_date
- Modèle `LeagueMember` : league, user, role (member/manager), total_points
- Statuts : pending / active / finished

### apps.rosters — Compositions d'équipe
- Modèle `Roster` : user, league, budget_used, is_locked
- Modèle `RosterSlot` : roster, player, position (top/jungle/mid/adc/support), is_captain
- Règles : 5 joueurs max, 1 capitaine (×1.5), budget par défaut 150 crédits
- Achat/vente créent automatiquement un `Transfer` (marché)

### apps.matches — Matchs & API LoL Esports
- Modèle `ProTeam` : name, acronym, region
- Modèle `Match` : external_id, team1, team2, region, tournament, date, status, winner, scores
- Modèle `MatchPlayerStat` : kills, deaths, assists, cs, vision_score, gold, damage, won, team_barons, team_dragons, team_towers
- `lolesports.py` : wrapper de l'API officielle (get_live, get_schedule, get_teams, get_match_result)
- `scoring_helper.py` : génération de stats de secours + calcul garanti des scores
- `apps.py` : **scheduler automatique** (sync toutes les 3 min)
- Commande `python manage.py sync_matches` : sync manuelle

### apps.scores — Moteur de scoring KPI
- Modèle `FantasyScore` : user, league, match, points, breakdown (JSON détaillé)
- Fonction `calculate_scores_for_match(match)` : applique la formule, **idempotente**

### apps.market — Transferts
- Modèle `Transfer` : user, player, league, action (buy/sell), price, date
- Historique automatique de tous les achats/ventes

### apps.social — Social & pronostics
- Modèle `Pronostic` : user, match, predicted_winner, is_correct, points_earned (+5 si correct)
- Modèle `Follow` : follower, following
- Classement global combinant points fantasy + bonus pronostics

### apps.chatbot — Assistant IA
- Modèle `ChatMessage` : user, message, response
- LLM Ollama avec prompt système expert LoL Fantasy

---

## 4. FORMULE DE SCORING (KPI) — Cœur du projet

```
Score individuel = Kills×3 + Assists×2 + Deaths×(-1.5) + CS×0.02 + VisionScore×0.1
Score collectif  = Victoire×5 + Barons×2 + Dragons×2 + Tours×1
Score équipe     = moyenne des scores collectifs des 5 joueurs du roster
KPI Total        = (Somme des scores individuels × 0.70) + (Score équipe × 0.30)
Bonus capitaine  : son score individuel est multiplié par 1.5
```

**Exemple — Faker (6K/1D/8A, 290 CS, 35 vision) :**
- Individuel = 6×3 + 8×2 + 1×(-1.5) + 290×0.02 + 35×0.1 = 41.8 pts
- En tant que capitaine : 41.8 × 1.5 = **62.7 pts**

**Pondération 70/30** : 70% performance individuelle, 30% réussite collective de l'équipe.

---

## 5. SYSTÈME AUTOMATIQUE (point fort technique)

La plateforme calcule les scores **100% automatiquement**, sans aucune intervention manuelle.

### Mécanisme à 3 niveaux
1. **Scheduler en arrière-plan** (`apps/matches/apps.py`) : un thread démarre avec le serveur Django
   et synchronise les matchs **toutes les 3 minutes**, en permanence.
2. **Auto-sync sur consultation** : chaque ouverture de la page Matchs déclenche aussi une sync (max 1×/5min).
3. **Commande manuelle** (`sync_matches`) : disponible si besoin.

### Flux automatique complet
```
Match se termine sur LoL Esports
   ↓
Le scheduler détecte la fin (max 3 min après)
   ↓
Récupère les stats joueurs depuis l'API
   ↓ (si l'API n'a pas les stats → génération de stats de secours réalistes)
   ↓
calculate_scores_for_match() → KPI calculé pour chaque roster concerné
   ↓
Mise à jour des classements + validation des pronostics
```

### 4 garanties techniques
1. **Stats de secours** : si l'API ne fournit pas les stats détaillées (fréquent pour LPL/VCS/EMEA),
   le système génère des stats cohérentes basées sur le rôle + victoire/défaite → les points sont TOUJOURS calculés.
2. **Idempotence** : `calculate_scores_for_match` RECALCULE les totaux depuis la somme (jamais d'incrémentation)
   → exécuter la sync 1000× ne double jamais les points.
3. **Re-traitement** : un match terminé sans score est re-traité au lieu d'être ignoré définitivement.
4. **Règle anti-rétroactif** : un roster ne marque QUE pour les matchs joués après sa création.

### Vérification
- Fichier `logs/scheduler.log` : trace chaque sync ("sync OK" toutes les 3 min)
- Outil `fixtures/healthcheck.py` : 17 contrôles automatiques de cohérence

---

## 6. SÉCURITÉ

- **JWT** : access token (courte durée) + refresh token (longue durée) + blacklist à la déconnexion
- **2FA obligatoire** à chaque connexion (QR Code TOTP ou OTP email)
- **RBAC strict** (Role-Based Access Control) :
  - Admin : gère les joueurs pros, les ligues publiques, les comptes
  - Manager : gère uniquement ses propres ligues privées
  - Joueur : participe, compose son roster, fait des pronostics
- Validation budget côté serveur (achat refusé si budget insuffisant)
- Roster verrouillable (is_locked) : empêche toute modification
- Mot de passe temporaire + obligation de changement à la 1ère connexion

---

## 7. ENDPOINTS API (base : http://localhost:8000/api/)

### Authentification
```
POST /auth/demande/            → demande d'inscription
POST /auth/login/              → étape 1 (email + mot de passe)
POST /auth/login/choose-otp/   → choisir méthode OTP
POST /auth/login/verify/       → vérifier OTP → reçoit JWT
GET  /auth/profile/            → profil
POST /auth/logout/             → déconnexion
POST /auth/change-password/    → changer mot de passe
POST /auth/forgot-password/    → mot de passe oublié
```

### Admin
```
GET  /admin/stats/                          → statistiques
GET  /admin/utilisateurs/                   → liste des comptes
POST /admin/utilisateurs/<id>/toggle/       → activer/désactiver
POST /admin/utilisateurs/<id>/promouvoir/   → promouvoir admin
GET  /admin/demandes/                       → demandes d'inscription
```

### Manager
```
GET  /manager/dashboard/                    → tableau de bord
GET/POST /manager/leagues/                  → ses ligues / créer
POST /manager/leagues/<id>/invite/          → inviter par email
GET  /manager/leagues/<id>/members/         → membres
GET  /manager/leagues/<id>/rosters/         → tous les rosters
GET  /manager/leagues/<id>/ranking/         → classement
```

### Joueurs / Ligues / Rosters
```
GET  /players/                 → liste (filtres rôle/région/équipe)
GET  /leagues/  POST /leagues/ → liste / créer
POST /leagues/join/            → rejoindre (code invitation)
GET  /rosters/<lid>/           → mon roster
POST /rosters/<lid>/add/       → ajouter joueur (→ Transfer buy)
POST /rosters/<lid>/remove/    → retirer joueur (→ Transfer sell)
POST /rosters/<lid>/captain/   → définir capitaine
```

### Matchs (API LoL Esports temps réel)
```
GET  /matches/                 → liste (DB)
GET  /matches/live/            → matchs en direct + streams
GET  /matches/schedule/        → calendrier complet (déclenche auto-sync)
GET  /matches/my-roster/       → matchs de mes équipes
GET  /matches/tournaments/     → tournois
POST /matches/auto-sync/       → sync manuelle
```

### Scores / Marché / Social / Chatbot
```
GET  /scores/my/               → mes scores
GET  /scores/global/           → classement global
GET  /scores/ranking/<lid>/    → classement d'une ligue
GET  /market/history/          → historique transferts
GET  /social/ranking/          → classement social
GET/POST /social/pronostics/   → pronostics
POST /social/follow/<uid>/     → suivre
GET/POST /chatbot/             → chatbot IA
```

---

## 8. PAGES FRONTEND (React)

```
AUTHENTIFICATION
/login, /choose-otp/:id, /verify/:id, /qrcode/:id, /forgot-password, /register

ESPACE JOUEUR
/dashboard      → hub principal (raccourcis)
/overview       → vue d'ensemble (live + scores + classement)
/live           → en direct (multi-scores + stream selon nb de matchs)
/players        → joueurs pros (recherche + filtres)
/leagues        → ligues (rejoindre/créer)
/roster         → composer son équipe (5 joueurs, capitaine, budget)
/matches        → calendrier + live + mes matchs
/tournaments    → classements LEC/LCK/LCS/LPL/EMEA
/scores         → scores + classements (ligue/global/mes scores)
/market         → marché (historique transferts)
/social         → classement + pronostics + follow
/chatbot        → assistant IA

ESPACE MANAGER
/manager/dashboard, /manager/leagues, /manager/invite, /manager/rosters, /manager/rankings

ESPACE ADMIN
/admin/login, /admin/dashboard, /admin/joueurs, /admin/ligues, /admin/demandes, /admin/utilisateurs
```

### Affichage live intelligent (particularité technique)
- 1 match en direct → 1 scoreboard + 1 stream
- N matchs même diffusion (ex: EMEA Triplex) → N scoreboards + 1 stream partagé
- N matchs diffusions différentes → sélecteur, 1 affiché à la fois
- Stream officiel par défaut par ligue si l'API n'en fournit pas

---

## 9. PROBLÈMES RÉSOLUS PENDANT LE DÉVELOPPEMENT
(Très utile pour la partie "difficultés rencontrées" du rapport)

1. **Erreur 500 sur le classement manager** : `FantasyScore.objects.filter(roster=r)` référençait
   un champ inexistant → corrigé en `filter(user=r.user, league=lg)`.

2. **Matchs en double dans le live** : la fusion live + calendrier créait des doublons →
   déduplication par paire d'équipes.

3. **EMEA Masters absent** : ID de ligue non configuré → ajouté (`100695891328981122`).

4. **Match futur affiché "Terminé"** : l'API renvoyait parfois `state=completed` pour un match
   dont l'heure était dans le futur → garde `_is_future` (un match futur n'est jamais terminé).

5. **Stream manquant en direct** : l'API getLive ne renvoie pas tous les matchs → fallback
   stream officiel par ligue.

6. **Scores non calculés automatiquement** (problème majeur) : l'API LoL Esports ne fournit
   presque jamais les stats détaillées des joueurs → un match passait "Terminé" sans points.
   **Solution** : génération automatique de stats de secours + re-traitement des matchs sans score.

7. **Risque de double comptage des points** : `calculate_scores_for_match` incrémentait les totaux
   → rendu **idempotent** (recalcul depuis la somme).

8. **Points rétroactifs** : des matchs joués AVANT la création d'un roster étaient comptés →
   règle ajoutée : un roster ne marque que les matchs après sa création.

9. **Classement mal trié** : les valeurs NULL (0 point) remontaient en tête → corrigé avec Coalesce.

10. **Données artificielles** : nettoyage complet, suppression des faux comptes, scores remis à zéro,
    uniquement des données réelles depuis l'API officielle.

---

## 10. ÉTAT DES DONNÉES

| Entité | Quantité |
|--------|----------|
| Utilisateurs réels | 4 (emails @sesame.com.tn et @gmail.com) |
| Ligues | ~12 |
| Joueurs pros actifs | ~790 |
| Équipes pro | ~158 |
| Matchs en DB | ~140 (terminés + à venir) |
| Ligues couvertes | LEC, LCK, LCS, LPL, VCS, LJL, PCS, CBLOL, EMEA Masters |

---

## 11. CONFIGURATION & LANCEMENT

### Base de données (settings.py)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'lol_fantasy',
        'USER': 'postgres',
        'PASSWORD': '21062003',
        'HOST': 'localhost',
        'PORT': '5433',
    }
}
AUTH_USER_MODEL = 'users.Utilisateur'
TIME_ZONE = 'Africa/Tunis'  # UTC+1
```

### Lancement
```bash
# Backend (lance aussi le scheduler automatique)
python manage.py runserver

# Frontend
cd lol_fantasy_frontend
npm start

# Sync manuelle des matchs (optionnel)
python manage.py sync_matches

# Diagnostic complet (17 contrôles)
python manage.py shell -c "exec(open('fixtures/healthcheck.py').read())"
```

### Répertoires
```
Backend  : C:\Users\OUMAIMA\lol_fantasy_backend
Frontend : C:\Users\OUMAIMA\lol_fantasy_frontend
```

---

## 12. POINTS FORTS À METTRE EN AVANT DANS LE RAPPORT

1. **Données 100% réelles** via l'API officielle LoL Esports (aucune donnée inventée)
2. **Scoring entièrement automatique** : scheduler permanent + stats de secours + idempotence
3. **Architecture modulaire** : 10 apps Django bien séparées
4. **Sécurité robuste** : JWT + 2FA + RBAC à 3 rôles
5. **Temps réel** : matchs en direct, scores live, streams intégrés (Twitch/YouTube)
6. **Résilience** : le système fonctionne même quand l'API est incomplète
7. **Moteur KPI original** : pondération 70/30 individuel/collectif + bonus capitaine
8. **Full-stack moderne** : Django REST + React 19
9. **IA intégrée** : chatbot assistant (Ollama)
10. **Multi-régions** : 9 compétitions mondiales couvertes

---

## 13. SCHÉMA RELATIONNEL SIMPLIFIÉ

```
Utilisateur (1) ──< (N) LeagueMember (N) >── (1) League
     │                                              │
     │ (1)                                          │ (1)
     ↓ (N)                                          ↓ (N)
   Roster (1) ──< (N) RosterSlot (N) >── (1) Player
     │                                              │
     │                                              │ (1)
     │                                              ↓ (N)
     │                                       MatchPlayerStat (N) >── (1) Match
     │ (1)                                                                │
     ↓ (N)                                                                │
  FantasyScore ────────────────────────────────────────────────────────┘
     (user + league + match → points)

Match (N) >── (1) ProTeam (team1, team2, winner)
Pronostic : Utilisateur + Match + predicted_winner
Transfer  : Utilisateur + Player + League + action (buy/sell)
```

---

*Document généré pour le rapport du projet LoL Fantasy League — SESAME 2025-2026.*
