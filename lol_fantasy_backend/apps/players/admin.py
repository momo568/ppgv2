from django.contrib import admin
from .models import Player, PlayerStats

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display  = ['in_game_name', 'team', 'role', 'region', 'price', 'is_active']
    list_filter   = ['region', 'role', 'is_active']
    search_fields = ['in_game_name', 'name', 'team']

@admin.register(PlayerStats)
class PlayerStatsAdmin(admin.ModelAdmin):
    list_display  = ['player', 'season', 'games_played', 'kda', 'win_rate']
    list_filter   = ['season']
    search_fields = ['player__in_game_name']
