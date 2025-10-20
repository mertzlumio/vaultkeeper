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
    - Deactivate locker with reservation handling: DELETE /api/lockers/<id>/
    - Reactivate locker: POST /api/lockers/<id>/reactivate/
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
        Deactivate a locker (soft delete)
        - If locker has active reservations, they are automatically released
        - Locker status becomes 'inactive'
        DELETE /api/lockers/<id>/
        """
        locker = self.get_object()
        
        # Find all active reservations for this locker
        active_reservations = Reservation.objects.filter(
            locker=locker,
            is_active=True,
            reserved_until__gte=timezone.now()
        )

        released_count = 0
        released_users = []

        # Release all active reservations
        for reservation in active_reservations:
            reservation.is_active = False
            reservation.save()
            released_count += 1
            released_users.append({
                'username': reservation.user.username,
                'email': reservation.user.email,
                'reserved_until': str(reservation.reserved_until)
            })

        # Deactivate the locker
        locker.status = 'inactive'
        locker.save()

        return Response({
            'message': f'Locker {locker.locker_number} has been deactivated',
            'action': 'deactivated',
            'locker': LockerSerializer(locker).data,
            'affected_reservations': {
                'count': released_count,
                'users': released_users
            },
            'note': 'All active reservations for this locker have been automatically released'
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

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reactivate(self, request, pk=None):
        """
        Reactivate a deactivated locker
        POST /api/lockers/<id>/reactivate/
        """
        locker = self.get_object()
        
        if locker.status == 'inactive':
            locker.status = 'available'
            locker.save()
            return Response({
                'message': f'Locker {locker.locker_number} has been reactivated',
                'locker': LockerSerializer(locker).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': f'Locker is already {locker.status}'
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlock(self, request):
        """
        Unlock a locker with PIN (simulates physical access)
        - Users can only unlock their own active reservations
        - Admins can unlock any locker with valid PIN
        - Cannot unlock if locker is inactive (even with valid PIN)
        
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

        # Check if locker is inactive
        if locker.status == 'inactive':
            return Response({
                'error': 'This locker has been deactivated by admin and is no longer accessible'
            }, status=status.HTTP_403_FORBIDDEN)

        # Build query based on user role
        query_params = {
            'locker': locker,
            'access_pin': access_pin,
            'is_active': True,
            'reserved_until__gte': timezone.now()
        }

        # Admin can unlock any locker with valid PIN
        # Regular users can only unlock their own reservations
        if not request.user.is_staff:
            query_params['user'] = request.user

        reservation = Reservation.objects.filter(**query_params).first()

        if not reservation:
            if request.user.is_staff:
                error_msg = 'Invalid PIN or reservation expired/not found'
            else:
                error_msg = 'Invalid PIN, reservation expired, or you do not have access to this locker'
            
            return Response({
                'error': error_msg
            }, status=status.HTTP_403_FORBIDDEN)

        # Success - locker unlocked
        return Response({
            'message': f'Locker {locker_number} unlocked successfully',
            'locker': LockerSerializer(locker).data,
            'reservation': {
                'user': reservation.user.username,
                'reserved_until': reservation.reserved_until,
                'accessed_by': request.user.username,
                'is_admin_access': request.user.is_staff
            }
        }, status=status.HTTP_200_OK)


class ReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Reservation operations
    - List reservations: GET /api/reservations/
      (Admin sees all, users see only their own)
    - Get reservation details: GET /api/reservations/<id>/
    - Create reservation: POST /api/reservations/
    - Update reservation time (Admin only): PUT/PATCH /api/reservations/<id>/
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

    def update(self, request, *args, **kwargs):
        """
        Update reservation (Admin only can modify reserved_until time)
        PUT/PATCH /api/reservations/<id>/
        Body: {
            "reserved_until": "2025-10-22T18:00:00Z"
        }
        """
        reservation = self.get_object()

        # Only admins can update reservations
        if not request.user.is_staff:
            return Response({
                'error': 'You can only release your reservation, not modify it'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if reservation is still active
        if not reservation.is_active:
            return Response({
                'error': 'Cannot modify a released reservation'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if locker still exists and is not inactive
        if reservation.locker.status == 'inactive':
            return Response({
                'error': 'Cannot modify reservation for an inactive locker'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Allow only reserved_until to be updated by admin
        if 'reserved_until' in request.data:
            new_reserved_until = request.data.get('reserved_until')
            
            # Validate new time is in future
            if new_reserved_until:
                from django.utils.dateparse import parse_datetime
                dt = parse_datetime(new_reserved_until) if isinstance(new_reserved_until, str) else new_reserved_until
                
                if dt <= timezone.now():
                    return Response({
                        'error': 'Reservation end time must be in the future'
                    }, status=status.HTTP_400_BAD_REQUEST)

                reservation.reserved_until = dt
                reservation.save()

                return Response({
                    'message': f'Reservation updated successfully by admin {request.user.username}',
                    'reservation': ReservationSerializer(reservation).data
                }, status=status.HTTP_200_OK)

        return Response({
            'error': 'Only reserved_until can be modified'
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put', 'patch'], 
            serializer_class=ReservationReleaseSerializer)
    def release(self, request, pk=None):
        """
        Release a reservation (cancel it)
        - Users can release their own reservations
        - Admins can release any reservation
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

        # Update locker status to available (if no other active reservations)
        locker = reservation.locker
        active_count = Reservation.objects.filter(
            locker=locker,
            is_active=True,
            reserved_until__gte=timezone.now()
        ).count()

        if active_count == 0 and locker.status != 'inactive':
            locker.status = 'available'
            locker.save()

        released_by = 'user' if request.user == reservation.user else 'admin'

        return Response({
            'message': f'Reservation for locker {locker.locker_number} released successfully',
            'released_by': released_by,
            'released_by_user': request.user.username,
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