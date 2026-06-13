from rest_framework import serializers
from .models import League, LeagueMember


class LeagueMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.CharField(source='user.email',    read_only=True)

    class Meta:
        model  = LeagueMember
        fields = ['id', 'username', 'email', 'role', 'joined_at', 'total_points']


class LeagueSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    member_count        = serializers.SerializerMethodField()

    class Meta:
        model  = League
        fields = [
            'id', 'name', 'description', 'is_private', 'invite_code',
            'max_members', 'budget_per_team', 'status', 'start_date',
            'end_date', 'created_by_username', 'member_count', 'created_at',
        ]
        read_only_fields = ['invite_code', 'created_by_username']

    def get_member_count(self, obj):
        return obj.members.count()
