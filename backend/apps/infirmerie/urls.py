from django.urls import path
from . import views

app_name = "infirmerie"

urlpatterns = [
    # ─── Dashboard & Reports ────────────────────────────────────
    path("dashboard/", views.InfirmerieDashboardView.as_view(), name="dashboard"),
    path("reports/", views.InfirmerieReportsView.as_view(), name="reports"),
    path("low-stock/", views.LowStockMedicationsView.as_view(), name="low-stock"),
    # ─── Medical Records ────────────────────────────────────────
    path("records/", views.MedicalRecordListCreateView.as_view(), name="record-list"),
    path(
        "records/<uuid:pk>/",
        views.MedicalRecordDetailView.as_view(),
        name="record-detail",
    ),
    # ─── Nested: Medical History ─────────────────────────────────
    path(
        "records/<uuid:record_pk>/history/",
        views.MedicalHistoryListCreateView.as_view(),
        name="history-list",
    ),
    path(
        "history/<uuid:pk>/",
        views.MedicalHistoryDetailView.as_view(),
        name="history-detail",
    ),
    # ─── Nested: Allergies ───────────────────────────────────────
    path(
        "records/<uuid:record_pk>/allergies/",
        views.AllergyListCreateView.as_view(),
        name="allergy-list",
    ),
    path(
        "allergies/<uuid:pk>/", views.AllergyDetailView.as_view(), name="allergy-detail"
    ),
    # ─── Nested: Medications ─────────────────────────────────────
    path(
        "records/<uuid:record_pk>/medications/",
        views.MedicationListCreateView.as_view(),
        name="medication-list",
    ),
    path(
        "medications/<uuid:pk>/",
        views.MedicationDetailView.as_view(),
        name="medication-detail",
    ),
    # ─── Nested: Vaccinations ────────────────────────────────────
    path(
        "records/<uuid:record_pk>/vaccinations/",
        views.VaccinationListCreateView.as_view(),
        name="vaccination-list",
    ),
    path(
        "vaccinations/<uuid:pk>/",
        views.VaccinationDetailView.as_view(),
        name="vaccination-detail",
    ),
    # ─── Nested: Disabilities ────────────────────────────────────
    path(
        "records/<uuid:record_pk>/disabilities/",
        views.DisabilityListCreateView.as_view(),
        name="disability-list",
    ),
    path(
        "disabilities/<uuid:pk>/",
        views.DisabilityDetailView.as_view(),
        name="disability-detail",
    ),
    # ─── Nested: Psychological Records ───────────────────────────
    path(
        "records/<uuid:record_pk>/psychological/",
        views.PsychologicalRecordListCreateView.as_view(),
        name="psych-list",
    ),
    path(
        "psychological/<uuid:pk>/",
        views.PsychologicalRecordDetailView.as_view(),
        name="psych-detail",
    ),
    # ─── Consultations ──────────────────────────────────────────
    path(
        "consultations/",
        views.ConsultationListCreateView.as_view(),
        name="consultation-list",
    ),
    path(
        "consultations/<uuid:pk>/",
        views.ConsultationDetailView.as_view(),
        name="consultation-detail",
    ),
    # ─── Emergency Protocols ─────────────────────────────────────
    path(
        "protocols/",
        views.EmergencyProtocolListCreateView.as_view(),
        name="protocol-list",
    ),
    path(
        "protocols/<uuid:pk>/",
        views.EmergencyProtocolDetailView.as_view(),
        name="protocol-detail",
    ),
    # ─── Emergency Events ────────────────────────────────────────
    path(
        "emergencies/",
        views.EmergencyEventListCreateView.as_view(),
        name="emergency-list",
    ),
    path(
        "emergencies/<uuid:pk>/",
        views.EmergencyEventDetailView.as_view(),
        name="emergency-detail",
    ),
    path(
        "emergencies/<uuid:pk>/close/",
        views.EmergencyEventCloseView.as_view(),
        name="emergency-close",
    ),
    # ─── Messages ────────────────────────────────────────────────
    path(
        "messages/", views.InfirmeryMessageListCreateView.as_view(), name="message-list"
    ),
    path(
        "messages/<uuid:pk>/read/",
        views.InfirmeryMessageMarkReadView.as_view(),
        name="message-read",
    ),
    # ─── Absence Justifications ──────────────────────────────────
    path(
        "justifications/",
        views.AbsenceJustificationListCreateView.as_view(),
        name="justification-list",
    ),
    path(
        "justifications/<uuid:pk>/validate/",
        views.AbsenceJustificationValidateView.as_view(),
        name="justification-validate",
    ),
    # ─── Epidemic Alerts ─────────────────────────────────────────
    path(
        "epidemics/", views.EpidemicAlertListCreateView.as_view(), name="epidemic-list"
    ),
    path(
        "epidemics/<uuid:pk>/",
        views.EpidemicAlertDetailView.as_view(),
        name="epidemic-detail",
    ),
    # ─── Contagious Diseases ─────────────────────────────────────
    path(
        "contagious/",
        views.ContagiousDiseaseListCreateView.as_view(),
        name="contagious-list",
    ),
    path(
        "contagious/<uuid:pk>/",
        views.ContagiousDiseaseDetailView.as_view(),
        name="contagious-detail",
    ),
    # ─── Teacher: Accommodations ─────────────────────────────────
    path(
        "accommodations/<uuid:student_id>/",
        views.TeacherAccommodationsView.as_view(),
        name="teacher-accommodations",
    ),
    # ─── Parent endpoints ────────────────────────────────────────
    path(
        "parent/<uuid:student_id>/summary/",
        views.ParentMedicalSummaryView.as_view(),
        name="parent-summary",
    ),
    path(
        "parent/<uuid:student_id>/vaccinations/",
        views.ParentVaccinationsView.as_view(),
        name="parent-vaccinations",
    ),
    path(
        "parent/<uuid:student_id>/messages/",
        views.ParentInfirmeryMessagesView.as_view(),
        name="parent-messages",
    ),
    path(
        "parent/<uuid:student_id>/update-request/",
        views.ParentMedicalUpdateRequestView.as_view(),
        name="parent-update-request",
    ),
]
