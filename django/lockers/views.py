from rest_framework import viewsets, permissions
from .models import Locker, Reservation
from .serializers import LockerSerializer, ReservationSerializer  # exact names


class LockerViewSet(viewsets.ModelViewSet):
    queryset = Locker.objects.all()
    serializer_class = LockerSerializer
    permission_classes = [permissions.IsAuthenticated]  # only logged-in users

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
