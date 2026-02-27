from rest_framework import permissions, viewsets
from core.permissions import IsAdmin
from .models import FeeStructure, Payment
from .serializers import FeeStructureSerializer, PaymentSerializer


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return FeeStructure.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Payment.objects.filter(school=self.request.user.school)
        if self.request.user.role == "parent":
            children = self.request.user.parent_profile.children.all()
            qs = qs.filter(student__in=children)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
