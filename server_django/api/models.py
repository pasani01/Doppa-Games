from django.db import models

class Game(models.Model):
    STATUS_CHOICES = [
        ('released', 'Released'),
        ('upcoming', 'Upcoming'),
        ('development', 'In Development'),
    ]

    name = models.CharField(max_length=255)
    desc = models.TextField()
    long_desc = models.TextField(blank=True, default="")
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags")
    platform = models.CharField(max_length=100, default="PC")
    url = models.URLField(blank=True, default="")
    img = models.URLField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    release_date = models.CharField(max_length=50, blank=True, default="")
    featured = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class StudioSettings(models.Model):
    studio_name = models.CharField(max_length=255, default="Doppa Games")
    tagline = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    telegram = models.CharField(max_length=255, blank=True)
    instagram = models.CharField(max_length=255, blank=True)
    about_title = models.CharField(max_length=255, blank=True)
    about_p1 = models.TextField(blank=True)
    about_p2 = models.TextField(blank=True)

    def __str__(self):
        return self.studio_name

    class Meta:
        verbose_name_plural = "Studio Settings"

class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name}"
