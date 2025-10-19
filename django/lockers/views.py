from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Locker, Reservation
from .serializers import (
    LockerSerializer, 
    ReservationSerializer, 
    UserRegistrationSerializer,
    UserSerializer,
    ReservationReleaseSerializer,
    LockerUnlockSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin, IsAdminUser


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """
    Register a new user
    POST /api/auth/register/
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LockerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Locker operations
    - List all lockers: GET /api/lockers/
    - Get locker details: GET /api/lockers/<id>/
    - Create locker (Admin only): POST /api/lockers/
    - Update locker (Admin only): PUT/PATCH /api/lockers/<id>/
    - Delete locker (Admin only): DELETE /api/lockers/<id>/
    """
    queryset = Locker.objects.all()
    serializer_class = LockerSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Filter lockers based on query parameters"""
        queryset = Locker.objects.all()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete: mark locker as inactive instead of deleting
        """
        locker = self.get_object()
        locker.status = 'inactive'
        locker.save()
        return Response({
            'message': f'Locker {locker.locker_number} deactivated successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Custom endpoint to get only available lockers
        GET /api/lockers/available/
        """
        available_lockers = Locker.objects.filter(status='available')
        serializer = self.get_serializer(available_lockers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def unlock(self, request):
        """
        Unlock a locker with PIN (simulates physical access)
        POST /api/lockers/unlock/
        Body: {
            "locker_number": "A1",
            "access_pin": "123456"
        }
        """
        serializer = LockerUnlockSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        locker_number = serializer.validated_data['locker_number']
        access_pin = serializer.validated_data['access_pin']

        # Find the locker
        try:
            locker = Locker.objects.get(locker_number=locker_number)
        except Locker.DoesNotExist:
            return Response({
                'error': 'Locker not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Find active reservation with matching PIN
        reservation = Reservation.objects.filter(
            locker=locker,
            access_pin=access_pin,
            is_active=True,
            reserved_until__gte=timezone.now()
        ).first()

        if not reservation:
            return Response({
                'error': 'Invalid PIN or reservation expired/not found'
            }, status=status.HTTP_403_FORBIDDEN)

        # Success - locker unlocked
        return Response({
            'message': f'Locker {locker_number} unlocked successfully',
            'locker': LockerSerializer(locker).data,
            'reservation': {
                'user': reservation.user.username,
                'reserved_until': reservation.reserved_until
            }
        }, status=status.HTTP_200_OK)


class ReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Reservation operations
    - List reservations: GET /api/reservations/
      (Admin sees all, users see only their own)
    - Get reservation details: GET /api/reservations/<id>/
    - Create reservation: POST /api/reservations/
    - Release reservation: PUT /api/reservations/<id>/release/
    """
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        """
        Admin sees all reservations
        Regular users see only their own reservations
        """
        user = self.request.user
        if user.is_staff:
            return Reservation.objects.all()
        return Reservation.objects.filter(user=user)

    def perform_create(self, serializer):
        """
        Automatically set the user to the current logged-in user
        """
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['put', 'patch'], 
            serializer_class=ReservationReleaseSerializer)
    def release(self, request, pk=None):
        """
        Release a reservation (cancel it)
        PUT /api/reservations/<id>/release/
        """
        reservation = self.get_object()
        
        if not reservation.is_active:
            return Response({
                'error': 'This reservation is already released'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark reservation as inactive
        reservation.is_active = False
        reservation.save()

        # Update locker status to available
        locker = reservation.locker
        locker.status = 'available'
        locker.save()

        return Response({
            'message': f'Reservation for locker {locker.locker_number} released successfully',
            'reservation': ReservationSerializer(reservation).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get only active reservations
        GET /api/reservations/active/
        """
        queryset = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def all(self, request):
        """
        Admin-only endpoint to see ALL reservations
        GET /api/reservations/all/
        """
        reservations = Reservation.objects.all()
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)