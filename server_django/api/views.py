from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
from django.core.mail import send_mail
from .models import Game, StudioSettings, ContactMessage
from .serializers import GameSerializer, StudioSettingsSerializer, ContactMessageSerializer


# ─────────────────────────────────────────
#  Admin Login (returns token)
# ─────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'detail': "Login va parol kiritilishi shart"}, status=400)

    user = authenticate(username=username, password=password)
    if user and user.is_staff:
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'success': True,
            'token': token.key,
            'username': user.username,
            'name': user.get_full_name() or user.username,
            'email': user.email
        })
    return Response({'detail': "Noto'g'ri login yoki parol"}, status=401)


# ─────────────────────────────────────────
#  Admin Profile Update
# ─────────────────────────────────────────
@api_view(['PUT', 'GET'])
@permission_classes([IsAuthenticated])
def admin_profile(request):
    user = request.user
    
    if request.method == 'GET':
        return Response({
            'username': user.username,
            'name': user.get_full_name() or user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })

    # PUT
    data = request.data
    if 'username' in data and data['username']:
        user.username = data['username']
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'email' in data:
        user.email = data['email']
    
    response_data = {'success': True, 'message': 'Profil yangilandi!'}
    
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        # Re-create token after password change
        from rest_framework.authtoken.models import Token
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)
        user.save()
        response_data['message'] = 'Profil va parol yangilandi!'
        response_data['new_token'] = new_token.key
    else:
        user.save()
        
    return Response(response_data)


# ─────────────────────────────────────────
#  Game ViewSet
# ─────────────────────────────────────────
class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all().order_by('-featured', '-id')
    serializer_class = GameSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get('data'), dict):
            # Handle tags as comma-separated string if passed as list
            data = kwargs['data'].copy() if hasattr(kwargs['data'], 'copy') else dict(kwargs['data'])
            if isinstance(data.get('tags'), list):
                data['tags'] = ','.join(data['tags'])
            kwargs['data'] = data
        return super().get_serializer(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if isinstance(data.get('tags'), list):
            data['tags'] = ','.join(data['tags'])
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        data = request.data.copy()
        if isinstance(data.get('tags'), list):
            data['tags'] = ','.join(data['tags'])
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        # Convert tags string back to list for frontend
        data = []
        for item in serializer.data:
            item_dict = dict(item)
            tags_raw = item_dict.get('tags', '')
            if isinstance(tags_raw, str):
                item_dict['tags'] = [t.strip() for t in tags_raw.split(',') if t.strip()]
            data.append(item_dict)
        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        item_dict = dict(serializer.data)
        tags_raw = item_dict.get('tags', '')
        if isinstance(tags_raw, str):
            item_dict['tags'] = [t.strip() for t in tags_raw.split(',') if t.strip()]
        return Response(item_dict)


# ─────────────────────────────────────────
#  StudioSettings ViewSet
# ─────────────────────────────────────────
class StudioSettingsViewSet(viewsets.ModelViewSet):
    queryset = StudioSettings.objects.all()
    serializer_class = StudioSettingsSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        settings_obj, _ = StudioSettings.objects.get_or_create(id=1)
        serializer = self.get_serializer(settings_obj)
        return Response(serializer.data)


# ─────────────────────────────────────────
#  ContactMessage ViewSet
# ─────────────────────────────────────────
class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-id')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        msg = serializer.save()

        subject = 'Saytdan yangi xabar'
        text = f"Yangi Xabar:\n\nIsm: {msg.name}\nEmail: {msg.email}\nXabar: {msg.message}"
        
        try:
            send_mail(
                subject,
                text,
                settings.EMAIL_HOST_USER,
                [settings.EMAIL_HOST_USER],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email yuborishda xato: {e}")
