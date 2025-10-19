from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Locker, Reservation
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        return token




class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['id', 'is_staff']


class LockerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locker
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def validate_locker_number(self, value):
        # Check for duplicate locker numbers on create/update
        instance = self.instance
        if instance is None:  # Creating new locker
            if Locker.objects.filter(locker_number=value).exists():
                raise serializers.ValidationError("Locker number already exists.")
        else:  # Updating existing locker
            if Locker.objects.filter(locker_number=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError("Locker number already exists.")
        return value


class ReservationSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    locker = serializers.PrimaryKeyRelatedField(queryset=Locker.objects.all())
    locker_details = LockerSerializer(source='locker', read_only=True)

    class Meta:
        model = Reservation
        fields = ['id', 'user', 'locker', 'locker_details', 'reserved_at', 
                  'reserved_until', 'is_active', 'access_pin']
        read_only_fields = ['id', 'user', 'reserved_at', 'is_active', 'access_pin']

    def validate_reserved_until(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Reservation end time must be in the future.")
        return value

    def validate(self, data):
        locker = data.get('locker')
        
        # Check if locker is available
        if locker.status != 'available':
            raise serializers.ValidationError({
                'locker': f"Locker {locker.locker_number} is not available."
            })

        # Check for overlapping reservations
        reserved_until = data.get('reserved_until')
        overlapping = Reservation.objects.filter(
            locker=locker,
            is_active=True,
            reserved_until__gte=timezone.now()
        ).exists()

        if overlapping:
            raise serializers.ValidationError({
                'locker': f"Locker {locker.locker_number} is already reserved."
            })

        return data

    def create(self, validated_data):
        # Create reservation
        reservation = Reservation.objects.create(**validated_data)
        
        # Update locker status
        locker = reservation.locker
        locker.status = 'reserved'
        locker.save()
        
        return reservation


class ReservationReleaseSerializer(serializers.Serializer):
    """Serializer for releasing a reservation"""
    pass  # No fields needed, just for endpoint consistency


class LockerUnlockSerializer(serializers.Serializer):
    """Serializer for unlocking a locker with PIN"""
    locker_number = serializers.CharField(max_length=20)
    access_pin = serializers.CharField(max_length=6, min_length=6)