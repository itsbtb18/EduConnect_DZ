from core.viewsets import TenantAwareViewSet

from .models import Activity, Enrollment, Session
from .serializers import ActivitySerializer, EnrollmentSerializer, SessionSerializer


class ActivityViewSet(TenantAwareViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer


class EnrollmentViewSet(TenantAwareViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer


class SessionViewSet(TenantAwareViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
