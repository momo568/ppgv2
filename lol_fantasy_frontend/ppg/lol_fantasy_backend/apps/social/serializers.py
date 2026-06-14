from rest_framework import serializers
from .models import Pronostic, Follow


class PronosticSerializer(serializers.ModelSerializer):
    username         = serializers.CharField(source='user.username',             read_only=True)
    match_info       = serializers.SerializerMethodField()
    predicted_team   = serializers.CharField(source='predicted_winner.acronym',  read_only=True)

    class Meta:
        model  = Pronostic
        fields = [
            'id', 'username', 'match', 'match_info', 'predicted_winner',
            'predicted_team', 'is_correct', 'points_earned', 'created_at',
        ]

    def get_match_info(self, obj):
        m = obj.match
        return {
            'id':    m.id,
            'team1': m.team1.acronym,
            'team2': m.team2.acronym,
            'date':  m.date.strftime('%d/%m/%Y'),
        }


class FollowSerializer(serializers.ModelSerializer):
    follower_name  = serializers.CharField(source='follower.username',  read_only=True)
    following_name = serializers.CharField(source='following.username', read_only=True)

    class Meta:
        model  = Follow
        fields = ['id', 'follower_name', 'following_name', 'created_at']
