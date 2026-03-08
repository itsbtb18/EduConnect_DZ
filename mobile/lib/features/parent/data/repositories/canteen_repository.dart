import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/canteen_model.dart';

/// Repository for parent canteen menu access.
class CanteenRepository {
  final DioClient _dioClient;

  CanteenRepository(this._dioClient);

  /// Get published menus with their items.
  Future<List<CanteenMenu>> getPublishedMenus() async {
    final response = await _dioClient.dio.get(ApiEndpoints.parentMenus);
    final results =
        response.data['results'] as List<dynamic>? ??
        (response.data is List ? response.data as List<dynamic> : []);
    return results
        .map((e) => CanteenMenu.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
