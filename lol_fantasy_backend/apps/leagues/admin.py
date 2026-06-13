from django.contrib import admin
from .models import League, LeagueMember

@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display  = ['name', 'created_by', 'is_private', 'status', 'invite_code', 'created_at']
    list_filter   = ['status', 'is_private']
    search_fields = ['name', 'created_by__username']

@admin.register(LeagueMember)
class LeagueMemberAdmin(admin.ModelAdmin):
    list_display  = ['user', 'league', 'role', 'total_points', 'joined_at']
    list_filter   = ['role']
    search_fields = ['user__username', 'league__name']
