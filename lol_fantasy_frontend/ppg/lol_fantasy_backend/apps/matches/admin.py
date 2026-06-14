from django.contrib import admin
from .models import ProTeam, Match, MatchPlayerStat

@admin.register(ProTeam)
class ProTeamAdmin(admin.ModelAdmin):
    list_display  = ['name', 'acronym', 'region']
    list_filter   = ['region']
    search_fields = ['name', 'acronym']

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display  = ['__str__', 'region', 'tournament', 'date', 'status']
    list_filter   = ['region', 'status', 'tournament']
    search_fields = ['team1__name', 'team2__name', 'tournament']

@admin.register(MatchPlayerStat)
class MatchPlayerStatAdmin(admin.ModelAdmin):
    list_display  = ['player', 'match', 'kills', 'deaths', 'assists', 'won']
    list_filter   = ['won']
    search_fields = ['player__in_game_name']
