# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("schools", "0003_alter_academicyear_unique_together_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="school",
            name="available_streams",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="List of stream codes available at this school, e.g. ['TC_SCI','SE','MATH']",
            ),
        ),
    ]
