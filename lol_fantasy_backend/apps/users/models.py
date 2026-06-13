from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UtilisateurManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email obligatoire')
        email = self.normalize_email(email)
        user  = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, username, password, **extra_fields)


class Utilisateur(AbstractUser):
    OTP_METHOD_CHOICES = [
        ('qrcode', 'QR Code'),
        ('email',  'Email'),
    ]

    bio                 = models.TextField(blank=True, default='')
    points              = models.BigIntegerField(default=0)
    niveau              = models.IntegerField(default=1)
    otp_secret          = models.CharField(max_length=64, blank=True, default='')
    is_2fa_enabled      = models.BooleanField(default=True)
    otp_method          = models.CharField(max_length=10, choices=OTP_METHOD_CHOICES, default='qrcode')
    must_change_password = models.BooleanField(default=False)  # True après création par admin
    email_otp_code      = models.CharField(max_length=6, blank=True, default='')
    email_otp_expires   = models.DateTimeField(null=True, blank=True)

    email           = models.EmailField(unique=True)
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']
    objects         = UtilisateurManager()

    class Meta:
        verbose_name        = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return self.email


class Manager(Utilisateur):
    class Meta:
        verbose_name        = 'Manager'
        verbose_name_plural = 'Managers'


class Admin(Utilisateur):
    class Meta:
        verbose_name        = 'Administrateur'
        verbose_name_plural = 'Administrateurs'

    def delete_utilisateur(self, user_id):
        Utilisateur.objects.filter(pk=user_id).delete()


class DemandeInscription(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('approuvee',  'Approuvée'),
        ('rejetee',    'Rejetée'),
    ]

    nom       = models.CharField(max_length=100)
    prenom    = models.CharField(max_length=100)
    email     = models.EmailField(unique=True)
    username  = models.CharField(max_length=50)
    message   = models.TextField(blank=True, help_text="Pourquoi veux-tu rejoindre ?")
    statut    = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Demande d'inscription"
        verbose_name_plural = "Demandes d'inscription"
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.nom} {self.prenom} — {self.email} ({self.statut})"