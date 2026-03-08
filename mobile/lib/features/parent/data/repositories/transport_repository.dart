import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/transport_model.dart';

/// Repository for parent transport information.
class TransportRepository {
  final DioClient _dioClient;

  TransportRepository(this._dioClient);

  /// Get transport info for all children (lines, stops, driver).
  Future<List<TransportInfo>> getTransportInfo() async {
    final response = await _dioClient.dio.get(ApiEndpoints.parentTransportInfo);
    final data = response.data;
    if (data is List) {
      return data
          .map((e) => TransportInfo.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    final results = (data as Map<String, dynamic>)['results'] as List<dynamic>?;
    if (results != null) {
      return results
          .map((e) => TransportInfo.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    // Single child response
    return [TransportInfo.fromJson(data)];
  }

  /// Get live GPS positions per child's bus line.
  Future<List<GpsPosition>> getGpsTrack() async {
    final response = await _dioClient.dio.get(ApiEndpoints.parentGpsTrack);
    final data = response.data;
    if (data is List) {
      return data
          .map((e) => GpsPosition.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    final results = (data as Map<String, dynamic>)['results'] as List<dynamic>?;
    return (results ?? [])
        .map((e) => GpsPosition.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
