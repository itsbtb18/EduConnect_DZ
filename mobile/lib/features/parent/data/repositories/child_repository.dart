import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/child_model.dart';

/// Repository for fetching parent's children across schools.
class ChildRepository {
  final DioClient _dioClient;

  ChildRepository(this._dioClient);

  /// Fetch all children linked to the authenticated parent.
  Future<List<ChildProfile>> getMyChildren() async {
    final response = await _dioClient.dio.get(ApiEndpoints.myChildren);
    final results =
        response.data['results'] as List<dynamic>? ??
        (response.data is List ? response.data as List<dynamic> : []);
    return results
        .map((e) => ChildProfile.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
