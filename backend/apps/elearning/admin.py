from django.contrib import admin

from .models import (
    DigitalResource,
    ExamBank,
    Quiz,
    QuizQuestion,
    QuizAttempt,
    StudentProgress,
)

admin.site.register(DigitalResource)
admin.site.register(ExamBank)
admin.site.register(Quiz)
admin.site.register(QuizQuestion)
admin.site.register(QuizAttempt)
admin.site.register(StudentProgress)
