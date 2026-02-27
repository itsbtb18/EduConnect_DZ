"""
Standard pagination classes for EduConnect API.
"""

from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Default pagination: 20 items per page, max 100."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SmallResultsSetPagination(PageNumberPagination):
    """Smaller pagination: 10 items per page, max 50."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class LargeResultsSetPagination(PageNumberPagination):
    """Larger pagination for bulk operations: 50 items per page, max 200."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200
