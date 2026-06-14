from django.contrib import admin
from .models import Transfer

@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display  = ['user', 'action', 'player', 'league', 'price', 'date']
    list_filter   = ['action']
    search_fields = ['user__username', 'player__in_game_name']
