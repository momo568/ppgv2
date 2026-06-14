import os
import sys
import threading
import time

from django.apps import AppConfig


_SCHEDULER_STARTED = False


class MatchesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.matches'
    verbose_name = 'Matchs'

    def ready(self):
        global _SCHEDULER_STARTED
        if _SCHEDULER_STARTED:
            return  # un seul scheduler par process
        # Scheduler automatique : synchronise les matchs toutes les 3 minutes
        # tant que le serveur tourne. Garantit que les scores se calculent
        # SANS aucune action manuelle, meme si personne n'ouvre l'app.
        if 'runserver' not in sys.argv:
            return  # pas pendant migrate / shell / tests / commandes

        # Eviter le double-demarrage avec l'autoreloader (process parent + enfant)
        with_reload = '--noreload' not in sys.argv
        if with_reload and os.environ.get('RUN_MAIN') != 'true':
            return

        _SCHEDULER_STARTED = True
        self._start_scheduler()

    def _start_scheduler(self):
        from django.conf import settings

        def heartbeat(msg):
            try:
                from datetime import datetime
                log_dir = os.path.join(settings.BASE_DIR, 'logs')
                os.makedirs(log_dir, exist_ok=True)
                with open(os.path.join(log_dir, 'scheduler.log'), 'a', encoding='utf-8') as f:
                    f.write(f"{datetime.now():%Y-%m-%d %H:%M:%S} | {msg}\n")
            except Exception:
                pass

        def loop():
            time.sleep(20)  # laisser le serveur finir de demarrer
            heartbeat("Scheduler demarre - sync automatique toutes les 3 min")
            while True:
                try:
                    from apps.matches.views import _auto_sync_background, _last_sync
                    _last_sync[0] = 0           # forcer (bypass cooldown 5 min)
                    _auto_sync_background()
                    heartbeat("sync OK")
                except Exception as e:
                    heartbeat(f"sync erreur: {e}")
                finally:
                    # Fermer la connexion DB du thread (bonne pratique thread long)
                    try:
                        from django.db import connection
                        connection.close()
                    except Exception:
                        pass
                time.sleep(180)  # toutes les 3 minutes

        t = threading.Thread(target=loop, daemon=True, name='match-sync-scheduler')
        t.start()
