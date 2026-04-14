import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

if not User.objects.filter(username='admin123').exists():
    User.objects.create_superuser('admin123', 'admin@doppagames.uz', 'admin1234a')
    print("Superuser created: admin123 / admin1234a")
else:
    print("User admin123 already exists.")
