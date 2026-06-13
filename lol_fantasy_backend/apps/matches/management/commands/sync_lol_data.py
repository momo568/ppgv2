import sys
from django.core.management.base import BaseCommand
from apps.matches.models import ProTeam
from apps.matches.lolesports import get_teams
from apps.players.models import Player

PRIX_PAR_DEFAUT = 12.0

STARS = {
    "Faker": 30.0, "Chovy": 28.0, "Ruler": 26.0,
    "Keria": 24.0, "Canyon": 26.0, "Zeus": 24.0,
    "Gumayusi": 24.0, "Oner": 22.0, "Deft": 20.0,
    "Caps": 26.0, "BrokenBlade": 20.0, "Larssen": 18.0,
    "Jankos": 18.0, "Hans sama": 20.0, "Rekkles": 18.0,
    "Humanoid": 18.0, "Nemesis": 16.0, "Upset": 20.0,
    "Inspired": 18.0, "Flakked": 16.0, "Targamas": 16.0,
    "Bin": 24.0, "Elk": 22.0, "Xiaohu": 20.0,
    "GALA": 22.0, "Wei": 20.0, "Crisp": 18.0,
    "JackeyLove": 22.0, "369": 22.0, "knight": 24.0,
    "Scout": 20.0, "Lwx": 20.0, "Rookie": 22.0,
    "ShowMaker": 26.0, "Teddy": 18.0, "BeryL": 20.0,
    "Peanut": 20.0, "Bdd": 18.0, "Viper": 22.0,
    "Lehends": 18.0, "Deokdam": 16.0, "Pyosik": 16.0,
}


class Command(BaseCommand):
    help = "Importe les equipes et joueurs pros depuis l'API LoL Esports"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset", action="store_true",
            help="Supprime tout avant reimport",
        )

    def log(self, msg):
        sys.stdout.write(msg + "\n")
        sys.stdout.flush()

    def handle(self, *args, **options):
        if options["reset"]:
            Player.objects.all().delete()
            ProTeam.objects.all().delete()
            self.log("[RESET] Base videe.")

        self.log("[INFO] Connexion a l'API LoL Esports...")
        try:
            teams_data = get_teams()
        except Exception as e:
            self.log(f"[ERREUR] API : {e}")
            return

        if not teams_data:
            self.log("[ERREUR] Aucune equipe retournee par l'API.")
            return

        self.log(f"[OK] {len(teams_data)} equipes trouvees.")

        total_teams = 0
        total_players = 0
        skipped = 0

        for t in teams_data:
            team_obj, created = ProTeam.objects.update_or_create(
                acronym=t["code"],
                defaults={
                    "name":      t["team"],
                    "region":    t["region"],
                    "image_url": t.get("image", ""),
                },
            )
            total_teams += 1
            label = "CREE" if created else "MAJ"
            self.log(f"  [{label}] {t['code']} ({t['region']})")

            for p in t["players"]:
                ign = p["in_game_name"].strip()
                if not ign:
                    skipped += 1
                    continue

                price = STARS.get(ign, PRIX_PAR_DEFAUT)

                Player.objects.update_or_create(
                    in_game_name=ign,
                    defaults={
                        "name":      p.get("name", ign),
                        "team":      t["team"],
                        "team_code": t["code"],
                        "role":      p["role"],
                        "region":    t["region"],
                        "price":     price,
                        "image_url": p.get("image_url", ""),
                        "is_active": True,
                    },
                )
                total_players += 1
                self.log(f"      {ign} ({p['role']}) {t['code']} {price}cr")

        self.log("-" * 50)
        self.log(f"[DONE] {total_teams} equipes | {total_players} joueurs | {skipped} ignores")
