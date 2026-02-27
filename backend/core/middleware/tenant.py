"""
Tenant middleware for multi-school isolation.
Attaches the school (tenant) context to every request based on the authenticated user.
"""

from django.utils.deprecation import MiddlewareMixin


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware that attaches the current user's school (tenant) to the request.
    This enables multi-tenant data isolation throughout the application.
    """

    def process_request(self, request):
        request.school = None
        if hasattr(request, "user") and request.user.is_authenticated:
            request.school = getattr(request.user, "school", None)
