from django.db import models
from django.contrib.auth.models import User
import random
import string

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
    access_pin = models.CharField(max_length=6, blank=True)  # 6-digit PIN for physical access

    def __str__(self):
        return f"{self.user.username} reserved {self.locker.locker_number}"

    def generate_pin(self):
        """Generate a random 6-digit PIN"""
        return ''.join(random.choices(string.digits, k=6))

    def save(self, *args, **kwargs):
        # Auto-generate PIN on creation
        if not self.access_pin:
            self.access_pin = self.generate_pin()
        super().save(*args, **kwargs)