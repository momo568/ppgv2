from rest_framework.permissions import BasePermission
from .models import Admin, Manager


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and isinstance(request.user, Admin)


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and isinstance(request.user, (Manager, Admin))


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj == request.user or isinstance(request.user, Admin)