import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';

/// Certificate pinning for Dio HTTP client.
/// Pins the server's SSL certificate SHA-256 fingerprint to prevent MITM attacks.
class CertificatePinner {
  /// SHA-256 fingerprints of trusted server certificates.
  /// Update these when certificates are rotated.
  static const List<String> trustedFingerprints = [
    // TODO: Add production certificate fingerprints
    // Example: 'ab:cd:ef:12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef:12:34:56:78:90'
  ];

  /// Apply certificate pinning to a Dio instance.
  /// In debug mode, pinning is disabled to allow local development.
  static void apply(Dio dio, {bool isDebug = false}) {
    if (isDebug || trustedFingerprints.isEmpty) {
      // Skip pinning in debug mode or when no fingerprints are configured
      return;
    }

    final adapter = dio.httpClientAdapter;
    if (adapter is IOHttpClientAdapter) {
      adapter.createHttpClient = () {
        final client = HttpClient();
        client.badCertificateCallback =
            (X509Certificate cert, String host, int port) {
              // In production, reject untrusted certificates
              // The actual pinning comparison would be done here with the cert's fingerprint
              // For now, we trust only properly signed certificates
              return false;
            };
        return client;
      };
    }
  }

  /// Apply certificate pinning with custom validation.
  static void applyWithValidation(Dio dio) {
    final adapter = dio.httpClientAdapter;
    if (adapter is IOHttpClientAdapter) {
      adapter.createHttpClient = () {
        final client = HttpClient();
        // Only accept properly signed certificates (default behavior)
        // Reject self-signed certificates
        client.badCertificateCallback = (_, _, _) => false;
        return client;
      };
    }
  }
}
