import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_BASE = "https://esports-api.lolesports.com/persisted/gw"
API_KEY  = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
HEADERS  = {"x-api-key": API_KEY}

LEAGUE_IDS = {
    "LEC":   "98767991302996019",
    "LCK":   "98767991310872058",
    "LCS":   "98767991299243165",
    "LPL":   "98767991314006698",
    "VCS":   "107213827295848783",
    "LJL":   "98767991349978712",
    "PCS":   "104366947889790212",
    "CBLOL": "98767991332355509",
}

ALL_LEAGUE_IDS = ",".join(LEAGUE_IDS.values())

REGION_MAP = {
    "EMEA":          "LEC",
    "EUROPE":        "LEC",
    "KOREA":         "LCK",
    "NORTH AMERICA": "LCS",
    "LCS":           "LCS",
    "CHINA":         "LPL",
}

ROLE_MAP = {
    "top":     "top",
    "jungle":  "jungle",
    "jungler": "jungle",
    "mid":     "mid",
    "middle":  "mid",
    "bottom":  "adc",
    "bot":     "adc",
    "adc":     "adc",
    "support": "support",
    "utility": "support",
}


def _get(endpoint, params=None):
    p = {"hl": "fr-FR"}
    if params:
        p.update(params)
    r = requests.get(
        f"{API_BASE}/{endpoint}", headers=HEADERS,
        params=p, timeout=15, verify=False,
    )
    r.raise_for_status()
    return r.json()


def _parse_event(ev):
    match = ev.get("match", {}) or {}
    teams = match.get("teams", []) or []
    if len(teams) < 2:
        return None
    r1 = teams[0].get("result") or {}
    r2 = teams[1].get("result") or {}
    return {
        "id"        : match.get("id", ""),
        "league"    : (ev.get("league") or {}).get("name", ""),
        "state"     : ev.get("state", "unstarted"),
        "startTime" : ev.get("startTime", ""),
        "blockName" : ev.get("blockName", ""),
        "strategy"  : (match.get("strategy") or {}).get("count", 1),
        "team1": {
            "name"   : teams[0].get("name", ""),
            "code"   : teams[0].get("code", ""),
            "image"  : teams[0].get("image", ""),
            "wins"   : r1.get("gameWins", 0),
            "outcome": r1.get("outcome", None),
        },
        "team2": {
            "name"   : teams[1].get("name", ""),
            "code"   : teams[1].get("code", ""),
            "image"  : teams[1].get("image", ""),
            "wins"   : r2.get("gameWins", 0),
            "outcome": r2.get("outcome", None),
        },
    }


def _parse_streams(streams):
    """Extrait les streams Twitch/YouTube triés par priorité de langue."""
    result = []
    PRIORITY = {"fr-FR": 0, "en-US": 1, "en-GB": 2, "de-DE": 3, "es-ES": 4}
    for s in (streams or []):
        result.append({
            "provider": s.get("provider", ""),
            "locale"  : s.get("locale", ""),
            "param"   : s.get("parameter", ""),
        })
    result.sort(key=lambda s: PRIORITY.get(s["locale"], 99))
    return result


def get_live():
    """Matchs (et shows) en cours RIGHT NOW avec streams."""
    data   = _get("getLive")
    events = data.get("data", {}).get("schedule", {}).get("events", [])
    result = []
    for ev in events:
        streams = _parse_streams(ev.get("streams", []))
        match   = ev.get("match") or {}
        teams   = match.get("teams") or []
        r1 = (teams[0].get("result") or {}) if len(teams) > 0 else {}
        r2 = (teams[1].get("result") or {}) if len(teams) > 1 else {}
        league = ev.get("league") or {}
        result.append({
            "id"       : ev.get("id", ""),
            "type"     : ev.get("type", "match"),  # "match" ou "show"
            "state"    : ev.get("state", "inProgress"),
            "startTime": ev.get("startTime", ""),
            "league"   : league.get("name", ""),
            "leagueImg": league.get("image", ""),
            "streams"  : streams,
            "strategy" : (match.get("strategy") or {}).get("count", 1),
            "team1": {
                "name" : teams[0].get("name", "") if len(teams) > 0 else "",
                "code" : teams[0].get("code", "") if len(teams) > 0 else "",
                "image": teams[0].get("image", "") if len(teams) > 0 else "",
                "wins" : r1.get("gameWins", 0),
            } if teams else None,
            "team2": {
                "name" : teams[1].get("name", "") if len(teams) > 1 else "",
                "code" : teams[1].get("code", "") if len(teams) > 1 else "",
                "image": teams[1].get("image", "") if len(teams) > 1 else "",
                "wins" : r2.get("gameWins", 0),
            } if len(teams) > 1 else None,
        })
    return result


def get_recently_finished(limit=8):
    """Matchs récemment terminés (depuis le calendrier global)."""
    data   = _get("getSchedule", {"leagueId": ALL_LEAGUE_IDS})
    events = data.get("data", {}).get("schedule", {}).get("events", [])
    finished = [
        m for e in events
        if e.get("type") == "match" and e.get("state") == "completed"
        for m in [_parse_event(e)] if m
    ]
    # Les plus récents en premier (derniers dans la liste = plus récents)
    return list(reversed(finished))[:limit]


def get_schedule(league=None):
    """Calendrier complet : à venir + en cours + terminés."""
    lid  = LEAGUE_IDS.get(league) if league else ALL_LEAGUE_IDS
    data = _get("getSchedule", {"leagueId": lid})
    events = data.get("data", {}).get("schedule", {}).get("events", [])
    result = []
    for ev in events:
        if ev.get("type") != "match":
            continue
        m = _parse_event(ev)
        if m:
            result.append(m)
    return result


def get_tournaments(league):
    """Retourne les tournois d'une ligue, du plus récent au plus ancien."""
    lid  = LEAGUE_IDS.get(league)
    if not lid:
        return []
    data   = _get("getTournamentsForLeague", {"leagueId": lid})
    leagues = data.get("data", {}).get("leagues", []) or []
    if not leagues:
        return []
    tours = leagues[0].get("tournaments", []) or []
    return sorted(tours, key=lambda t: t.get("startDate", ""), reverse=True)


def get_standings(tournament_id):
    """Retourne les standings (classement + brackets) d'un tournoi."""
    data      = _get("getStandings", {"tournamentId": tournament_id})
    standings = (data.get("data", {}).get("standings") or [])
    if not standings:
        return []

    result = []
    for st in standings:
        stages = []
        for stage in (st.get("stages") or []):
            sections = []
            for sec in (stage.get("sections") or []):
                rankings = []
                for rk in (sec.get("rankings") or []):
                    teams = []
                    for team in (rk.get("teams") or []):
                        rec = team.get("record") or {}
                        teams.append({
                            "name"  : team.get("name", ""),
                            "code"  : team.get("code", ""),
                            "image" : team.get("image", "") or "",
                            "wins"  : rec.get("wins", 0),
                            "losses": rec.get("losses", 0),
                        })
                    if teams:
                        rankings.append({
                            "ordinal": rk.get("ordinal", 0),
                            "teams"  : teams,
                        })

                # Matches de la section (brackets playoffs)
                matches = []
                for m in (sec.get("matches") or []):
                    mteams = m.get("teams") or []
                    if len(mteams) < 2:
                        continue
                    r1 = mteams[0].get("result") or {}
                    r2 = mteams[1].get("result") or {}
                    matches.append({
                        "state"  : m.get("state", "unstarted"),
                        "team1"  : {"code": mteams[0].get("code",""), "wins": r1.get("gameWins", 0), "outcome": r1.get("outcome")},
                        "team2"  : {"code": mteams[1].get("code",""), "wins": r2.get("gameWins", 0), "outcome": r2.get("outcome")},
                        "strategy": (m.get("strategy") or {}).get("count", 1),
                    })

                sections.append({
                    "name"    : sec.get("name", ""),
                    "rankings": rankings,
                    "matches" : matches,
                })

            stages.append({
                "name"    : stage.get("name", ""),
                "sections": sections,
            })

        result.append({"stages": stages})

    return result


FEED_BASE = "https://feed.lolesports.com/livestats/v1"


def get_game_ids(match_id: str) -> list:
    """Retourne les IDs des games d'un match (pour eventDetails)."""
    try:
        data = _get("getEventDetails", {"id": match_id})
        games = data.get("data", {}).get("event", {}).get("match", {}).get("games", []) or []
        return [
            g["id"] for g in games
            if g.get("state") in ("completed", "finished") and g.get("id")
        ]
    except Exception:
        return []


def get_game_final_stats(game_id: str) -> dict | None:
    """
    Récupère les stats finales d'un game via le feed livestats.
    Retourne dict avec blueTeam/redTeam players + team stats ou None si indisponible.
    """
    import requests as req
    try:
        url = f"{FEED_BASE}/window/{game_id}"
        r = req.get(url, headers=HEADERS, params={"hl": "en-US"}, timeout=15, verify=False)
        if r.status_code != 200:
            return None
        data = r.json()

        frames = data.get("frames", []) or []
        meta   = data.get("gameMetadata", {}) or {}
        if not frames:
            return None

        # Prendre le dernier frame disponible
        last_frame = frames[-1]
        blue = last_frame.get("blueTeam", {}) or {}
        red  = last_frame.get("redTeam",  {}) or {}

        # Metadata joueurs (summonerName + role)
        def build_meta(team_key):
            tm = meta.get(team_key, {}) or {}
            return {
                p["participantId"]: {
                    "name": p.get("summonerName", ""),
                    "role": p.get("role", ""),
                }
                for p in (tm.get("participantMetadata", []) or [])
            }

        blue_meta = build_meta("blueTeamMetadata")
        red_meta  = build_meta("redTeamMetadata")

        def parse_team(team_data, meta_map, won):
            players = []
            for p in (team_data.get("participants", []) or []):
                pid  = p.get("participantId")
                info = meta_map.get(pid, {})
                players.append({
                    "name":    info.get("name", ""),
                    "role":    info.get("role", ""),
                    "kills":   p.get("kills",      0),
                    "deaths":  p.get("deaths",     0),
                    "assists": p.get("assists",     0),
                    "cs":      p.get("creepScore", 0),
                    "vision":  p.get("visionScore", 0) or 0,
                    "won":     won,
                })
            return {
                "players":  players,
                "towers":   team_data.get("towers",  0),
                "dragons":  team_data.get("dragons", 0),
                "barons":   team_data.get("barons",  0),
            }

        # Déterminer le gagnant via les kills totaux (si gameState inconnu)
        blue_kills = blue.get("totalKills", 0) or 0
        red_kills  = red.get("totalKills",  0) or 0
        game_state = last_frame.get("gameState", "")

        # On ne peut pas déterminer le gagnant depuis les kills seuls de façon fiable
        # On utilise les inhibitors/towers comme approximation
        blue_won = blue.get("inhibitors", 0) > red.get("inhibitors", 0) if game_state != "finished" else None

        return {
            "game_id":  game_id,
            "state":    game_state,
            "blue":     parse_team(blue, blue_meta, blue_won),
            "red":      parse_team(red,  red_meta,  not blue_won if blue_won is not None else None),
        }
    except Exception:
        return None


def get_match_result(match_id: str) -> dict | None:
    """
    Retourne le résultat d'un match completed avec les stats par joueur.
    Agrège les stats de tous les games du match (séries BO3/BO5).
    """
    try:
        # Récupérer les équipes et le vainqueur depuis eventDetails
        data = _get("getEventDetails", {"id": match_id})
        event = (data.get("data", {}) or {}).get("event", {}) or {}
        match = event.get("match", {}) or {}
        teams = match.get("teams", []) or []
        games = match.get("games",  []) or []

        if len(teams) < 2:
            return None

        t1_wins = (teams[0].get("result") or {}).get("gameWins", 0)
        t2_wins = (teams[1].get("result") or {}).get("gameWins", 0)
        winner_code  = teams[0].get("code") if t1_wins > t2_wins else teams[1].get("code")
        t1_code = teams[0].get("code", "")
        t2_code = teams[1].get("code", "")

        # Agréger les stats de chaque game
        player_totals = {}
        team_totals   = {t1_code: {"towers":0,"dragons":0,"barons":0,"wins":0},
                         t2_code: {"towers":0,"dragons":0,"barons":0,"wins":0}}

        for g in games:
            if g.get("state") not in ("completed", "finished"):
                continue
            gid   = g.get("id", "")
            gdata = get_game_final_stats(gid)
            if not gdata:
                continue

            # Associer blue/red aux codes d'équipe
            g_teams = g.get("teams", []) or []
            blue_code = ""
            red_code  = ""
            for gt in g_teams:
                side = gt.get("side", "")
                tid  = gt.get("id", "")
                # Chercher dans les teams du match par ID
                for mt in teams:
                    if mt.get("id", "") == tid:
                        if side == "blue":
                            blue_code = mt.get("code", "")
                        else:
                            red_code  = mt.get("code", "")

            for side, code in [("blue", blue_code), ("red", red_code)]:
                team_data = gdata.get(side, {})
                won_game  = (code == winner_code)
                tc = team_totals.setdefault(code, {"towers":0,"dragons":0,"barons":0,"wins":0})
                tc["towers"]  += team_data.get("towers", 0)
                tc["dragons"] += team_data.get("dragons", 0)
                tc["barons"]  += team_data.get("barons", 0)
                if won_game:
                    tc["wins"] += 1
                for p in team_data.get("players", []):
                    key = p["name"]
                    if key not in player_totals:
                        player_totals[key] = {**p, "team_code": code, "games": 0}
                    else:
                        for stat in ("kills","deaths","assists","cs","vision"):
                            player_totals[key][stat] += p[stat]
                    player_totals[key]["games"]  += 1
                    player_totals[key]["won"]     = won_game

        return {
            "match_id":     match_id,
            "team1":        t1_code,
            "team2":        t2_code,
            "winner":       winner_code,
            "players":      player_totals,
            "team_stats":   team_totals,
        }
    except Exception:
        return None


def get_teams():
    """
    Récupère toutes les équipes actives LEC/LCK/LCS/LPL avec leurs joueurs.
    """
    data  = _get("getTeams")
    teams = data.get("data", {}).get("teams", [])
    result = []

    for t in teams:
        if t.get("status") != "active":
            continue

        home   = t.get("homeLeague") or {}
        region = home.get("name", "")

        if region not in ("LEC", "LCK", "LCS", "LPL", "VCS", "LJL", "PCS", "CBLOL"):
            continue

        players = []
        for p in (t.get("players") or []):
            role_raw = (p.get("role") or "").lower().strip()
            role     = ROLE_MAP.get(role_raw, "")
            if not role:
                continue
            ign = (p.get("summonerName") or p.get("name") or "").strip()
            if not ign:
                continue
            players.append({
                "in_game_name": ign,
                "name"        : f"{p.get('firstName','') or ''} {p.get('lastName','') or ''}".strip(),
                "role"        : role,
                "image_url"   : p.get("image", "") or "",
            })

        if players:
            result.append({
                "team"   : t.get("name", ""),
                "code"   : t.get("code", ""),
                "region" : region,
                "image"  : t.get("image", "") or "",
                "players": players,
            })

    return result
