from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LockerViewSet, ReservationViewSet

router = DefaultRouter()
router.register(r'lockers', LockerViewSet)
router.register(r'reservations', ReservationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
