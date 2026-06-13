from django.contrib import admin
from .models import Pronostic, Follow

@admin.register(Pronostic)
class PronosticAdmin(admin.ModelAdmin):
    list_display  = ['user', 'match', 'predicted_winner', 'is_correct', 'points_earned']
    list_filter   = ['is_correct']
    search_fields = ['user__username']

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display  = ['follower', 'following', 'created_at']
    search_fields = ['follower__username', 'following__username']
