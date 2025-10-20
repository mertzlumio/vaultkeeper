from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LockerViewSet, ReservationViewSet

# Create router and register viewsets with basename
router = DefaultRouter()
router.register(r'lockers', LockerViewSet, basename='locker')
router.register(r'reservations', ReservationViewSet, basename='reservation')

# The router automatically generates routes for all @action decorated methods
# Available routes:
# GET    /api/lockers/                     - List all lockers
# POST   /api/lockers/                     - Create locker (admin only)
# GET    /api/lockers/<id>/                - Get locker details
# PUT    /api/lockers/<id>/                - Update locker (admin only)
# PATCH  /api/lockers/<id>/                - Partial update locker (admin only)
# DELETE /api/lockers/<id>/                - Deactivate locker (admin only)
# GET    /api/lockers/available/           - Get available lockers
# POST   /api/lockers/<id>/reactivate/     - Reactivate locker (admin only)
# POST   /api/lockers/unlock/              - Unlock locker with PIN
#
# GET    /api/reservations/                - List reservations
# POST   /api/reservations/                - Create reservation
# GET    /api/reservations/<id>/           - Get reservation details
# PUT    /api/reservations/<id>/           - Update reservation time (admin only)
# PATCH  /api/reservations/<id>/           - Partial update reservation (admin only)
# GET    /api/reservations/active/         - Get active reservations
# GET    /api/reservations/all/            - Get all reservations (admin only)
# PUT    /api/reservations/<id>/release/   - Release reservation
# PATCH  /api/reservations/<id>/release/   - Release reservation

urlpatterns = [
    path('', include(router.urls)),
]