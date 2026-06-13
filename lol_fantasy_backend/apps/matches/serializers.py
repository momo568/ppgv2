from rest_framework import serializers
from .models import ProTeam, Match, MatchPlayerStat


class ProTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProTeam
        fields = '__all__'


class MatchPlayerStatSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.in_game_name', read_only=True)
    kda          = serializers.FloatField(read_only=True)
    fantasy_points = serializers.FloatField(read_only=True)

    class Meta:
        model  = MatchPlayerStat
        fields = [
            'id', 'player', 'player_name', 'kills', 'deaths', 'assists',
            'cs', 'gold', 'damage', 'vision_score', 'duration_minutes',
            'won', 'kda', 'fantasy_points',
        ]


class MatchSerializer(serializers.ModelSerializer):
    team1_name   = serializers.CharField(source='team1.name',   read_only=True)
    team2_name   = serializers.CharField(source='team2.name',   read_only=True)
    team1_acronym = serializers.CharField(source='team1.acronym', read_only=True)
    team2_acronym = serializers.CharField(source='team2.acronym', read_only=True)
    winner_name  = serializers.CharField(source='winner.name',  read_only=True)
    player_stats = MatchPlayerStatSerializer(many=True, read_only=True)

    class Meta:
        model  = Match
        fields = [
            'id', 'team1', 'team1_name', 'team1_acronym',
            'team2', 'team2_name', 'team2_acronym',
            'region', 'tournament', 'date', 'status',
            'winner', 'winner_name', 'team1_score', 'team2_score',
            'player_stats',
        ]
