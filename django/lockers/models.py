from django.db import models
from django.contrib.auth.models import User

class Locker(models.Model):
    locker_number = models.CharField(max_length=20, unique=True)
    location = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='available')  # available, reserved, inactive
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Locker {self.locker_number} ({self.status})"


class Reservation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    locker = models.ForeignKey(Locker, on_delete=models.CASCADE)
    reserved_at = models.DateTimeField(auto_now_add=True)
    reserved_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} reserved {self.locker.locker_number}"
