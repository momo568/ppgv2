from rest_framework import serializers
from .models import Transfer


class TransferSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.in_game_name', read_only=True)
    league_name = serializers.CharField(source='league.name',          read_only=True)
    username    = serializers.CharField(source='user.username',        read_only=True)

    class Meta:
        model  = Transfer
        fields = ['id', 'username', 'player', 'player_name', 'league', 'league_name', 'action', 'price', 'date']
