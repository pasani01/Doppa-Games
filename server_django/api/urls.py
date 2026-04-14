from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GameViewSet, StudioSettingsViewSet, ContactMessageViewSet, admin_login, admin_profile

router = DefaultRouter()
router.register(r'games', GameViewSet)
router.register(r'settings', StudioSettingsViewSet)
router.register(r'contact', ContactMessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('admin/login', admin_login, name='admin_login'),
    path('admin/profile', admin_profile, name='admin_profile'),
]
