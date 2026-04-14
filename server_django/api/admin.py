from django.contrib import admin
from .models import Game, StudioSettings, ContactMessage

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'featured', 'release_date')
    list_filter = ('status', 'featured')
    search_fields = ('name', 'desc')

@admin.register(StudioSettings)
class StudioSettingsAdmin(admin.ModelAdmin):
    list_display = ('studio_name', 'email', 'telegram')

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'created_at')
    readonly_fields = ('created_at',)
