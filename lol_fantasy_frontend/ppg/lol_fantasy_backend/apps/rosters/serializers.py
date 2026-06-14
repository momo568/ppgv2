from rest_framework import serializers
from .models import Roster, RosterSlot


class RosterSlotSerializer(serializers.ModelSerializer):
    player_name   = serializers.CharField(source='player.in_game_name', read_only=True)
    player_team   = serializers.CharField(source='player.team',          read_only=True)
    player_role   = serializers.CharField(source='player.role',          read_only=True)
    player_price  = serializers.DecimalField(
        source='player.price', max_digits=8, decimal_places=1, read_only=True
    )
    player_image  = serializers.CharField(source='player.image_url',     read_only=True)

    class Meta:
        model  = RosterSlot
        fields = [
            'id', 'player', 'player_name', 'player_team',
            'player_role', 'player_price', 'player_image',
            'position', 'is_captain',
        ]


class RosterSerializer(serializers.ModelSerializer):
    slots            = RosterSlotSerializer(many=True, read_only=True)
    budget_remaining = serializers.DecimalField(max_digits=8, decimal_places=1, read_only=True)
    is_complete      = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Roster
        fields = [
            'id', 'league', 'budget_used', 'budget_remaining',
            'is_complete', 'is_locked', 'updated_at', 'slots',
        ]
