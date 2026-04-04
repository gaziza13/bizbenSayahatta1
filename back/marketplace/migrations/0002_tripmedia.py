from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("marketplace", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TripMedia",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="trip_media/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "trip",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="media", to="marketplace.trip"),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="users.user"),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
