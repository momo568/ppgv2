from django.contrib import admin
from .models import Roster, RosterSlot

@admin.register(Roster)
class RosterAdmin(admin.ModelAdmin):
    list_display  = ['user', 'league', 'budget_used', 'is_locked', 'updated_at']
    list_filter   = ['is_locked']
    search_fields = ['user__username', 'league__name']

@admin.register(RosterSlot)
class RosterSlotAdmin(admin.ModelAdmin):
    list_display  = ['roster', 'position', 'player', 'is_captain']
    list_filter   = ['position', 'is_captain']
    search_fields = ['player__in_game_name']
