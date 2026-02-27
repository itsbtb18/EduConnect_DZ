/// API Response wrapper for consistent error handling
class ApiResponse<T> {
  final T? data;
  final String? message;
  final bool success;
  final int? statusCode;

  const ApiResponse({
    this.data,
    this.message,
    this.success = true,
    this.statusCode,
  });

  factory ApiResponse.success(T data, {int? statusCode}) {
    return ApiResponse(data: data, success: true, statusCode: statusCode);
  }

  factory ApiResponse.error(String message, {int? statusCode}) {
    return ApiResponse(
      message: message,
      success: false,
      statusCode: statusCode,
    );
  }
}

/// Paginated response from the Django REST Framework
class PaginatedResponse<T> {
  final int count;
  final String? next;
  final String? previous;
  final List<T> results;

  const PaginatedResponse({
    required this.count,
    this.next,
    this.previous,
    required this.results,
  });

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PaginatedResponse(
      count: json['count'] as int,
      next: json['next'] as String?,
      previous: json['previous'] as String?,
      results: (json['results'] as List)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
    );
  }

  bool get hasMore => next != null;
}

/// Network exception types
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? errors;

  const ApiException({required this.message, this.statusCode, this.errors});

  @override
  String toString() => 'ApiException($statusCode): $message';

  /// Parse Django REST framework error response
  factory ApiException.fromResponse(
    Map<String, dynamic>? data,
    int? statusCode,
  ) {
    if (data == null) {
      return ApiException(
        message: 'Unknown error occurred',
        statusCode: statusCode,
      );
    }

    // DRF returns errors in different formats
    if (data.containsKey('detail')) {
      return ApiException(
        message: data['detail'] as String,
        statusCode: statusCode,
      );
    }

    // Field-level errors
    final errors = <String, dynamic>{};
    String firstError = 'Validation error';
    data.forEach((key, value) {
      if (value is List && value.isNotEmpty) {
        errors[key] = value;
        firstError = '${value.first}';
      } else if (value is String) {
        errors[key] = value;
        firstError = value;
      }
    });

    return ApiException(
      message: firstError,
      statusCode: statusCode,
      errors: errors,
    );
  }
}
