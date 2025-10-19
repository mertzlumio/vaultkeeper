from rest_framework import serializers
from .models import Locker, Reservation

class LockerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locker
        fields = '__all__'

class ReservationSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    locker = serializers.PrimaryKeyRelatedField(queryset=Locker.objects.all())

    class Meta:
        model = Reservation
        fields = '__all__'
