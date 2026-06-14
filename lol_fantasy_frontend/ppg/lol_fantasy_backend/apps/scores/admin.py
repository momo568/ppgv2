from django.contrib import admin
from .models import FantasyScore

@admin.register(FantasyScore)
class FantasyScoreAdmin(admin.ModelAdmin):
    list_display  = ['user', 'league', 'match', 'points', 'created_at']
    list_filter   = ['league']
    search_fields = ['user__username', 'league__name']
