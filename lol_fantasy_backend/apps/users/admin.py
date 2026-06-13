from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib import messages
from .models import Utilisateur, Manager, Admin, DemandeInscription
from .utils import generate_otp_secret, generate_temp_password, send_credentials_email


@admin.register(DemandeInscription)
class DemandeInscriptionAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'prenom', 'email', 'username', 'statut', 'created_at']
    list_filter   = ['statut']
    search_fields = ['email', 'username', 'nom', 'prenom']
    actions       = ['approuver_demandes', 'rejeter_demandes']

    def approuver_demandes(self, request, queryset):
        for demande in queryset.filter(statut='en_attente'):
            try:
                if Utilisateur.objects.filter(email=demande.email).exists():
                    self.message_user(request, f"⚠️ {demande.email} a déjà un compte.", messages.WARNING)
                    continue

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

                self.message_user(
                    request,
                    f"✅ {demande.email} approuvé — email envoyé.",
                    messages.SUCCESS
                )

            except Exception as e:
                self.message_user(
                    request,
                    f"❌ Erreur : {str(e)}",
                    messages.ERROR
                )

    approuver_demandes.short_description = "✅ Approuver et envoyer les identifiants par email"

    def rejeter_demandes(self, request, queryset):
        queryset.filter(statut='en_attente').update(statut='rejetee')
        self.message_user(request, "Demandes rejetées.", messages.WARNING)

    rejeter_demandes.short_description = "❌ Rejeter les demandes sélectionnées"


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display  = ['email', 'username', 'otp_method', 'must_change_password', 'is_active']
    list_filter   = ['is_active', 'otp_method', 'must_change_password']
    search_fields = ['email', 'username']
    ordering      = ['-date_joined']
    fieldsets     = UserAdmin.fieldsets + (
        ('LoL Fantasy', {
            'fields': ('bio', 'points', 'niveau', 'otp_secret', 'is_2fa_enabled', 'otp_method', 'must_change_password')
        }),
    )


@admin.register(Manager)
class ManagerAdmin(UserAdmin):
    list_display = ['email', 'username', 'is_active']


@admin.register(Admin)
class AdminAdmin(UserAdmin):
    list_display = ['email', 'username', 'is_active']