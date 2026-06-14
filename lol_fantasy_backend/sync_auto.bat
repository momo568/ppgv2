@echo off
cd /d C:\Users\OUMAIMA\lol_fantasy_backend
.\venv\Scripts\python.exe manage.py sync_matches >> logs\sync_matches.log 2>&1
