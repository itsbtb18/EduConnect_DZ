import 'package:dio/dio.dart';

import '../../../../../core/constants/api_endpoints.dart';
import '../../../../../core/network/api_response.dart';
import '../../../../../core/network/dio_client.dart';
import '../models/gamification_model.dart';

class GamificationRepository {
  final DioClient _dioClient;
  GamificationRepository(this._dioClient);

  Future<GamificationProfile> getMyProfile() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gamificationProfile,
      );
      return GamificationProfile.fromJson(
        response.data as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<PointTransaction>> getMyPoints() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gamificationPoints,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => PointTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<BadgeDefinition>> getAllBadges() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gamificationBadges,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => BadgeDefinition.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<Achievement>> getMyBadges() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gamificationMyBadges,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => Achievement.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<WeeklyChallenge>> getChallenges() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gamificationChallenges,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => WeeklyChallenge.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<ChallengeParticipation>> getMyChallenges() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gamificationMyChallenges,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map(
            (e) => ChallengeParticipation.fromJson(e as Map<String, dynamic>),
          )
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<ChallengeParticipation> joinChallenge(String challengeId) async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.gamificationJoinChallenge,
        data: {'challenge_id': challengeId},
      );
      return ChallengeParticipation.fromJson(
        response.data as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }

  Future<List<LeaderboardEntry>> getLeaderboard() async {
    try {
      final response = await _dioClient.dio.get(
        ApiEndpoints.gamificationLeaderboard,
      );
      final results =
          response.data['results'] as List<dynamic>? ??
          (response.data is List ? response.data as List<dynamic> : []);
      return results
          .map((e) => LeaderboardEntry.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromResponse(
        e.response?.data as Map<String, dynamic>?,
        e.response?.statusCode,
      );
    }
  }
}
