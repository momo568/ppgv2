"""
Endpoints Manager — RBAC : seul un utilisateur avec role='manager' ou is_staff peut accéder.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum, Count

from .models import Utilisateur
from apps.leagues.models import League, LeagueMember
from apps.rosters.models import Roster, RosterSlot
from apps.scores.models import FantasyScore


# ── Permission RBAC Manager ──────────────────────────────────────────────────
class IsManager(IsAuthenticated):
    """Manager uniquement — Admin a ses propres endpoints séparés."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'manager'


# ── DASHBOARD MANAGER ────────────────────────────────────────────────────────
class ManagerDashboardView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        user = request.user
        my_leagues = League.objects.filter(created_by=user)
        total_members = LeagueMember.objects.filter(league__in=my_leagues).count()
        total_rosters = Roster.objects.filter(league__in=my_leagues).count()
        total_scores  = FantasyScore.objects.filter(league__in=my_leagues).count()

        leagues_data = []
        for lg in my_leagues:
            members = LeagueMember.objects.filter(league=lg).count()
            top = LeagueMember.objects.filter(league=lg).order_by('-total_points').first()
            leagues_data.append({
                'id'          : lg.id,
                'name'        : lg.name,
                'is_private'  : lg.is_private,
                'invite_code' : lg.invite_code,
                'budget'      : lg.budget_per_team,
                'status'      : lg.status,
                'members'     : members,
                'max_members' : lg.max_members,
                'leader'      : top.user.username if top else None,
                'leader_pts'  : top.total_points  if top else 0,
            })

        return Response({
            'manager'       : user.username,
            'email'         : user.email,
            'total_leagues' : my_leagues.count(),
            'total_members' : total_members,
            'total_rosters' : total_rosters,
            'total_scores'  : total_scores,
            'leagues'       : leagues_data,
        })


# ── LIGUES DU MANAGER ────────────────────────────────────────────────────────
class ManagerLeaguesView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        leagues = League.objects.filter(created_by=request.user).order_by('-created_at')
        data = []
        for lg in leagues:
            members = LeagueMember.objects.filter(league=lg).select_related('user')
            data.append({
                'id'          : lg.id,
                'name'        : lg.name,
                'description' : lg.description,
                'is_private'  : lg.is_private,
                'invite_code' : lg.invite_code,
                'budget'      : float(lg.budget_per_team),
                'status'      : lg.status,
                'members'     : [{'id': m.user.id, 'username': m.user.username,
                                   'email': m.user.email, 'role': m.role,
                                   'points': m.total_points} for m in members],
                'member_count': members.count(),
                'max_members' : lg.max_members,
                'created_at'  : lg.created_at.strftime('%d/%m/%Y'),
            })
        return Response(data)

    def post(self, request):
        from apps.leagues.serializers import LeagueSerializer
        s = LeagueSerializer(data=request.data)
        if s.is_valid():
            league = s.save(created_by=request.user)
            LeagueMember.objects.create(league=league, user=request.user, role='manager')
            request.user.role = 'manager'
            request.user.save(update_fields=['role'])
            return Response(LeagueSerializer(league).data, status=201)
        return Response(s.errors, status=400)


# ── DÉTAIL LIGUE MANAGER ─────────────────────────────────────────────────────
class ManagerLeagueDetailView(APIView):
    permission_classes = [IsManager]

    def _get_league(self, pk, user):
        try:
            lg = League.objects.get(pk=pk)
            if lg.created_by != user and not user.is_staff:
                return None, Response({'error': 'Accès refusé.'}, status=403)
            return lg, None
        except League.DoesNotExist:
            return None, Response({'error': 'Ligue introuvable.'}, status=404)

    def put(self, request, pk):
        lg, err = self._get_league(pk, request.user)
        if err: return err
        from apps.leagues.serializers import LeagueSerializer
        s = LeagueSerializer(lg, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        lg, err = self._get_league(pk, request.user)
        if err: return err
        lg.delete()
        return Response({'message': 'Ligue supprimée.'}, status=204)


# ── INVITER PAR EMAIL ────────────────────────────────────────────────────────
class ManagerInviteView(APIView):
    permission_classes = [IsManager]

    def post(self, request, pk):
        try:
            lg = League.objects.get(pk=pk, created_by=request.user)
        except League.DoesNotExist:
            if request.user.is_staff:
                try: lg = League.objects.get(pk=pk)
                except: return Response({'error': 'Ligue introuvable.'}, status=404)
            else:
                return Response({'error': 'Ligue introuvable.'}, status=404)

        emails = request.data.get('emails', [])
        if isinstance(emails, str):
            emails = [e.strip() for e in emails.split(',') if e.strip()]

        if not emails:
            return Response({'error': 'Aucun email fourni.'}, status=400)

        sent, skipped = [], []
        for email in emails:
            try:
                send_mail(
                    subject=f'LoL Fantasy — Invitation a rejoindre "{lg.name}"',
                    message=f"""Bonjour,

{request.user.username} vous invite a rejoindre la ligue "{lg.name}" sur LoL Fantasy League !

Code d invitation : {lg.invite_code}

Comment rejoindre :
1. Connectez-vous sur http://localhost:3000/login
2. Allez dans "Ligues" → "Rejoindre"
3. Entrez le code : {lg.invite_code}

Budget par equipe : {lg.budget_per_team} credits
Membres : {lg.members.count()} / {lg.max_members}

Bonne chance sur la Faille !
— {request.user.username} via LoL Fantasy League""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                )
                sent.append(email)
            except Exception as e:
                skipped.append({'email': email, 'error': str(e)})

        return Response({
            'message': f'{len(sent)} invitation(s) envoyee(s).',
            'sent'   : sent,
            'skipped': skipped,
            'code'   : lg.invite_code,
        })


# ── MEMBRES D'UNE LIGUE (gestion par manager) ────────────────────────────────
class ManagerMembersView(APIView):
    permission_classes = [IsManager]

    def get(self, request, pk):
        try:
            lg = League.objects.get(pk=pk)
        except League.DoesNotExist:
            return Response({'error': 'Ligue introuvable.'}, status=404)

        members = LeagueMember.objects.filter(league=lg).select_related('user').order_by('-total_points')
        data = []
        for idx, m in enumerate(members):
            roster = Roster.objects.filter(user=m.user, league=lg).first()
            data.append({
                'rank'        : idx + 1,
                'user_id'     : m.user.id,
                'username'    : m.user.username,
                'email'       : m.user.email,
                'role'        : m.role,
                'total_points': m.total_points,
                'joined_at'   : m.joined_at.strftime('%d/%m/%Y'),
                'roster_complete': roster.is_complete if roster else False,
                'roster_slots': roster.slots.count() if roster else 0,
            })
        return Response({
            'league'  : lg.name,
            'code'    : lg.invite_code,
            'members' : data,
            'count'   : len(data),
        })

    def delete(self, request, pk):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id requis.'}, status=400)
        try:
            lg = League.objects.get(pk=pk, created_by=request.user)
        except League.DoesNotExist:
            return Response({'error': 'Ligue introuvable ou accès refusé.'}, status=404)
        try:
            m = LeagueMember.objects.get(league=lg, user_id=user_id)
            if m.role == 'manager':
                return Response({'error': 'Impossible de retirer le manager.'}, status=400)
            m.delete()
            return Response({'message': 'Membre retiré de la ligue.'})
        except LeagueMember.DoesNotExist:
            return Response({'error': 'Membre introuvable.'}, status=404)


# ── ROSTERS D'UNE LIGUE (vue manager) ────────────────────────────────────────
class ManagerRostersView(APIView):
    permission_classes = [IsManager]

    def get(self, request, pk):
        try:
            lg = League.objects.get(pk=pk)
        except League.DoesNotExist:
            return Response({'error': 'Ligue introuvable.'}, status=404)

        rosters = Roster.objects.filter(league=lg).select_related('user').prefetch_related('slots__player')
        data = []
        for r in rosters:
            slots = [{'position': s.position, 'player': s.player.in_game_name,
                      'team': s.player.team_code or s.player.team,
                      'price': float(s.player.price), 'captain': s.is_captain}
                     for s in r.slots.all()]
            total_pts = FantasyScore.objects.filter(user=r.user, league=lg).aggregate(t=Sum('points'))['t'] or 0
            data.append({
                'user_id'     : r.user.id,
                'username'    : r.user.username,
                'budget_used' : float(r.budget_used),
                'is_complete' : r.is_complete,
                'is_locked'   : r.is_locked,
                'total_points': round(total_pts, 2),
                'slots'       : slots,
            })
        data.sort(key=lambda x: x['total_points'], reverse=True)
        return Response({'league': lg.name, 'rosters': data, 'count': len(data)})


# ── VERROUILLER / DÉVERROUILLER UNE LIGUE ────────────────────────────────────
class ManagerLockLeagueView(APIView):
    permission_classes = [IsManager]

    def post(self, request, pk):
        try:
            lg = League.objects.get(pk=pk, created_by=request.user)
        except League.DoesNotExist:
            return Response({'error': 'Ligue introuvable ou accès refusé.'}, status=404)

        action = request.data.get('action', 'lock')
        new_status = 'active' if action == 'unlock' else 'finished'
        lock_rosters = action == 'lock'

        lg.status = new_status
        lg.save()
        Roster.objects.filter(league=lg).update(is_locked=lock_rosters)

        return Response({
            'message': f'Ligue {"verrouillée" if lock_rosters else "déverrouillée"}.',
            'status' : new_status,
            'rosters_locked': lock_rosters,
        })


# ── CLASSEMENT GLOBAL MANAGER ────────────────────────────────────────────────
class ManagerRankingView(APIView):
    permission_classes = [IsManager]

    def get(self, request, pk):
        try:
            lg = League.objects.get(pk=pk)
        except League.DoesNotExist:
            return Response({'error': 'Ligue introuvable.'}, status=404)

        members = LeagueMember.objects.filter(league=lg)\
            .select_related('user').order_by('-total_points')

        scores_by_match = FantasyScore.objects.filter(league=lg)\
            .select_related('user', 'match')\
            .order_by('-created_at')[:20]

        history = [{
            'username': s.user.username,
            'match'   : f"{s.match.team1.acronym} vs {s.match.team2.acronym}",
            'date'    : s.match.date.strftime('%d/%m/%Y'),
            'points'  : s.points,
        } for s in scores_by_match]

        return Response({
            'league'  : lg.name,
            'ranking' : [{
                'rank'        : idx + 1,
                'username'    : m.user.username,
                'role'        : m.role,
                'total_points': m.total_points,
                'joined_at'   : m.joined_at.strftime('%d/%m/%Y'),
            } for idx, m in enumerate(members)],
            'recent_scores': history,
        })


# ── PROMOUVOIR UN USER EN MANAGER (admin uniquement) ─────────────────────────
class PromoteToManagerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Réservé à l\'admin.'}, status=403)
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)

        user.role = 'manager'
        user.save(update_fields=['role'])

        try:
            send_mail(
                'LoL Fantasy — Vous etes maintenant Manager',
                f"""Bonjour {user.username},

Vous avez ete promu Manager sur LoL Fantasy League.

En tant que Manager, vous pouvez :
- Creer et gerer des ligues privees et publiques
- Inviter des participants
- Gerer les rosters de votre ligue
- Consulter les scores et classements

Connectez-vous : http://localhost:3000/login

— L'equipe LoL Fantasy League""",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        except Exception:
            pass

        return Response({
            'message': f'{user.username} est maintenant Manager.',
            'role'   : user.role,
        })


# ── RÉTROGRADER UN MANAGER ───────────────────────────────────────────────────
class DemoteManagerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Réservé à l\'admin.'}, status=403)
        try:
            user = Utilisateur.objects.get(pk=pk)
            user.role = 'joueur'
            user.save(update_fields=['role'])
            return Response({'message': f'{user.username} est maintenant Joueur.'})
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)
