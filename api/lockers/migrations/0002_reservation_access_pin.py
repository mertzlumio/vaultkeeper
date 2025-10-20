# Generated migration for adding access_pin field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lockers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='access_pin',
            field=models.CharField(blank=True, max_length=6),
        ),
    ]