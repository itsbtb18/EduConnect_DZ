import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/network/api_response.dart';
import '../models/payslip_model.dart';

class PayslipRepository {
  final DioClient _dioClient;

  PayslipRepository(this._dioClient);

  Future<List<PaySlip>> getMyPayslips({int? year}) async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.payslipsMy,
        queryParameters: {'year': ?year},
      );
      final paginated = PaginatedResponse.fromJson(
        response.data,
        (json) => PaySlip.fromJson(json),
      );
      return paginated.results;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<String> getPayslipPdfUrl(String id) async {
    try {
      final response = await _dioClient.dio.get(ApiEndpoints.payslipPdf(id));
      return response.data['url'] as String;
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
