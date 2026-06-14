from rest_framework import serializers
from .models import Player, PlayerStats


class PlayerStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PlayerStats
        fields = '__all__'
        read_only_fields = ['player']


class PlayerSerializer(serializers.ModelSerializer):
    stats = PlayerStatsSerializer(many=True, read_only=True)

    class Meta:
        model  = Player
        fields = [
            'id', 'name', 'in_game_name', 'team', 'team_code', 'role',
            'region', 'price', 'image_url', 'is_active', 'bio', 'stats',
        ]
