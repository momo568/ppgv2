from rest_framework import serializers
from .models import FantasyScore


class FantasyScoreSerializer(serializers.ModelSerializer):
    username     = serializers.CharField(source='user.username', read_only=True)
    league_name  = serializers.CharField(source='league.name',  read_only=True)
    match_info   = serializers.SerializerMethodField()

    class Meta:
        model  = FantasyScore
        fields = ['id', 'username', 'league', 'league_name', 'match', 'match_info', 'points', 'breakdown', 'created_at']

    def get_match_info(self, obj):
        m = obj.match
        return {
            'id':         m.id,
            'team1':      m.team1.acronym,
            'team2':      m.team2.acronym,
            'date':       m.date.strftime('%d/%m/%Y'),
            'tournament': m.tournament,
        }
