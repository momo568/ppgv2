from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings

from .models import Utilisateur, DemandeInscription
from .utils import generate_otp_secret, generate_temp_password, send_credentials_email
from .serializers import UserProfileSerializer


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


# ── STATS ────────────────────────────────────
class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            'total_users'        : Utilisateur.objects.filter(is_staff=False).count(),
            'total_admins'       : Utilisateur.objects.filter(is_staff=True).count(),
            'demandes_attente'   : DemandeInscription.objects.filter(statut='en_attente').count(),
            'demandes_approuvees': DemandeInscription.objects.filter(statut='approuvee').count(),
            'demandes_rejetees'  : DemandeInscription.objects.filter(statut='rejetee').count(),
        })


# ── DEMANDES ─────────────────────────────────
class AdminDemandesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        demandes = DemandeInscription.objects.all().order_by('-created_at')
        data = [{
            'id'        : d.id,
            'nom'       : d.nom,
            'prenom'    : d.prenom,
            'email'     : d.email,
            'username'  : d.username,
            'message'   : d.message,
            'statut'    : d.statut,
            'created_at': d.created_at.strftime('%d/%m/%Y %H:%M'),
        } for d in demandes]
        return Response(data)


class AdminApprouverDemandeView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            demande = DemandeInscription.objects.get(pk=pk, statut='en_attente')
        except DemandeInscription.DoesNotExist:
            return Response(
                {'error': 'Demande introuvable ou déjà traitée.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if Utilisateur.objects.filter(email=demande.email).exists():
            return Response(
                {'error': 'Un compte existe déjà avec cet email.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        temp_password = generate_temp_password()

        Utilisateur.objects.create_user(
            email                = demande.email,
            username             = demande.username,
            password             = temp_password,
            otp_secret           = generate_otp_secret(),
            is_2fa_enabled       = True,
            must_change_password = True,
            first_name           = demande.prenom,
            last_name            = demande.nom,
        )

        send_credentials_email(demande.email, demande.username, temp_password)
        demande.statut = 'approuvee'
        demande.save()

        return Response({
            'message': f'✅ {demande.email} approuvé — email envoyé.'
        })


class AdminRejeterDemandeView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            demande = DemandeInscription.objects.get(pk=pk, statut='en_attente')
            demande.statut = 'rejetee'
            demande.save()
            return Response({'message': 'Demande rejetée.'})
        except DemandeInscription.DoesNotExist:
            return Response(
                {'error': 'Demande introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )


# ── UTILISATEURS ─────────────────────────────
class AdminUtilisateursView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = Utilisateur.objects.all().order_by('-date_joined')
        data = [{
            'id'                 : u.id,
            'email'              : u.email,
            'username'           : u.username,
            'is_active'          : u.is_active,
            'is_staff'           : u.is_staff,
            'is_superuser'       : u.is_superuser,
            'must_change_password': u.must_change_password,
            'otp_method'         : u.otp_method,
            'points'             : u.points,
            'niveau'             : u.niveau,
            'date_joined'        : u.date_joined.strftime('%d/%m/%Y'),
        } for u in users]
        return Response(data)


class AdminToggleUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        if request.user.pk == pk:
            return Response(
                {'error': 'Vous ne pouvez pas désactiver votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = Utilisateur.objects.get(pk=pk)
            user.is_active = not user.is_active
            user.save()
            status_text = 'activé' if user.is_active else 'désactivé'
            return Response({
                'message'  : f'Utilisateur {status_text}.',
                'is_active': user.is_active,
            })
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminDeleteUserView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        if request.user.pk == pk:
            return Response(
                {'error': 'Vous ne pouvez pas supprimer votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = Utilisateur.objects.get(pk=pk)
            email = user.email
            user.delete()
            return Response({'message': f'{email} supprimé.'})
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )


# ── PROMOTION ADMIN ───────────────────────────
class AdminPromouvoirView(APIView):
    """
    POST /api/admin/utilisateurs/<pk>/promouvoir/
    Promeut un utilisateur en administrateur.
    Réservé au superadmin (is_superuser) uniquement.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        if not request.user.is_superuser:
            return Response(
                {'error': 'Seul le Super Admin peut promouvoir des administrateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user = Utilisateur.objects.get(pk=pk)

            if user.is_staff:
                return Response(
                    {'error': f'{user.email} est déjà administrateur.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.is_staff = True
            user.save()

            # Envoie email de notification
            try:
                send_mail(
                    '⚔️ LoL Fantasy — Vous êtes maintenant Administrateur',
                    f"""Bonjour {user.username},

Vous avez été promu Administrateur de LoL Fantasy League.

Vous pouvez maintenant accéder au panel d'administration :
http://localhost:3000/admin/login

Email    : {user.email}
Rôle     : Administrateur

— L'équipe LoL Fantasy League""",
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                )
            except Exception:
                pass

            return Response({
                'message' : f'✅ {user.email} est maintenant Administrateur. Email de notification envoyé.',
                'is_staff': user.is_staff,
            })

        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminRetirerAdminView(APIView):
    """
    POST /api/admin/utilisateurs/<pk>/retirer-admin/
    Retire le rôle admin d'un utilisateur.
    Réservé au superadmin uniquement.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        if not request.user.is_superuser:
            return Response(
                {'error': 'Seul le Super Admin peut retirer le rôle admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.pk == pk:
            return Response(
                {'error': 'Vous ne pouvez pas retirer votre propre rôle admin.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = Utilisateur.objects.get(pk=pk)

            if not user.is_staff:
                return Response(
                    {'error': f'{user.email} n\'est pas administrateur.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.is_staff     = False
            user.is_superuser = False
            user.save()

            return Response({
                'message': f'{user.email} n\'est plus administrateur.'
            })

        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )