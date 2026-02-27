import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

/// Structured logging interceptor for development / debug builds
class LoggingInterceptor extends Interceptor {
  final Logger _logger;

  LoggingInterceptor({Logger? logger}) : _logger = logger ?? Logger();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    _logger.d(
      '→ ${options.method} ${options.uri}\n'
      '  Headers: ${options.headers}\n'
      '  Data: ${options.data}',
    );
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _logger.d(
      '← ${response.statusCode} ${response.requestOptions.uri}\n'
      '  Data: ${_truncate(response.data.toString(), 500)}',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _logger.e(
      '✗ ${err.response?.statusCode ?? 'NO STATUS'} '
      '${err.requestOptions.uri}\n'
      '  Message: ${err.message}\n'
      '  Response: ${err.response?.data}',
    );
    handler.next(err);
  }

  String _truncate(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}… (truncated)';
  }
}
