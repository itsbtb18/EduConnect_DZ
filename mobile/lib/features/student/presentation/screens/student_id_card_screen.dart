import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../data/datasources/student_remote_datasource.dart';
import '../../data/models/student_card_model.dart';

/// Screen that displays the student's digital ID card.
///
/// Route: `/student/id-card`
class StudentIdCardScreen extends StatefulWidget {
  const StudentIdCardScreen({super.key});

  @override
  State<StudentIdCardScreen> createState() => _StudentIdCardScreenState();
}

class _StudentIdCardScreenState extends State<StudentIdCardScreen> {
  StudentCardData? _card;
  bool _loading = true;
  String? _error;
  Timer? _qrRefreshTimer;
  int _qrCountdown = 30;

  @override
  void initState() {
    super.initState();
    _loadCard();
  }

  @override
  void dispose() {
    _qrRefreshTimer?.cancel();
    super.dispose();
  }

  void _startQrTimer() {
    _qrRefreshTimer?.cancel();
    _qrCountdown = 30;
    _qrRefreshTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() => _qrCountdown--);
      if (_qrCountdown <= 0) {
        _refreshQrCode();
      }
    });
  }

  Future<void> _refreshQrCode() async {
    final userId = _getCurrentUserId(context);
    if (userId == null || _card == null) return;
    try {
      final ds = getIt<StudentRemoteDatasource>();
      final json = await ds.getStudentCard(userId);
      final updated = StudentCardData.fromJson(json);
      if (mounted) {
        setState(() {
          _card = updated;
          _qrCountdown = 30;
        });
      }
    } catch (_) {
      // Silently fail — will retry on next tick
      if (mounted) setState(() => _qrCountdown = 30);
    }
  }

  Future<void> _loadCard() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final userId = _getCurrentUserId(context);
      if (userId == null) {
        setState(() {
          _error = 'Impossible de récupérer l\'identifiant utilisateur.';
          _loading = false;
        });
        return;
      }

      final ds = getIt<StudentRemoteDatasource>();
      final json = await ds.getStudentCard(userId);
      setState(() {
        _card = StudentCardData.fromJson(json);
        _loading = false;
      });
      _startQrTimer();
    } catch (e) {
      setState(() {
        _error = 'Erreur lors du chargement de la carte: $e';
        _loading = false;
      });
    }
  }

  /// Extract the authenticated user's ID from the AuthBloc.
  String? _getCurrentUserId(BuildContext context) {
    try {
      final authState = context.read<AuthBloc>().state;
      if (authState is AuthAuthenticated) {
        return authState.user.id;
      }
    } catch (_) {}
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Carte d\'identité'), centerTitle: true),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildError()
          : _card != null
          ? _buildCard(context, _card!)
          : const SizedBox.shrink(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadCard,
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(BuildContext context, StudentCardData card) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            children: [
              _IDCardFront(card: card),
              const SizedBox(height: 16),
              _IDCardBack(card: card, qrCountdown: _qrCountdown),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ID Card — Front
// ═══════════════════════════════════════════════════════════════════════════

class _IDCardFront extends StatelessWidget {
  final StudentCardData card;
  const _IDCardFront({required this.card});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1.586, // ISO/IEC 7810 ID-1 (credit card)
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        clipBehavior: Clip.antiAlias,
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.primaryDark, AppColors.primary],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header: school logo + name ──
                Row(
                  children: [
                    if (card.school.logo != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: CachedNetworkImage(
                          imageUrl: card.school.logo!,
                          width: 36,
                          height: 36,
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) => const Icon(
                            Icons.school,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                      )
                    else
                      const Icon(Icons.school, color: Colors.white, size: 28),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        card.school.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),

                const Spacer(),

                // ── Middle: photo + details ──
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Photo
                    Container(
                      width: 64,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.white54, width: 2),
                      ),
                      child: card.photo != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: CachedNetworkImage(
                                imageUrl: card.photo!,
                                fit: BoxFit.cover,
                                errorWidget: (_, _, _) => const Icon(
                                  Icons.person,
                                  size: 40,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            )
                          : const Icon(
                              Icons.person,
                              size: 40,
                              color: AppColors.textSecondary,
                            ),
                    ),
                    const SizedBox(width: 12),

                    // Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            card.fullName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          _detailRow(Icons.class_outlined, card.className),
                          if (card.dateOfBirth != null &&
                              card.dateOfBirth!.isNotEmpty)
                            _detailRow(Icons.cake_outlined, card.dateOfBirth!),
                          _detailRow(
                            Icons.badge_outlined,
                            card.studentId.isNotEmpty
                                ? card.studentId
                                : card.id.substring(0, 8),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        children: [
          Icon(icon, color: Colors.white70, size: 14),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ID Card — Back (QR code + school details)
// ═══════════════════════════════════════════════════════════════════════════

class _IDCardBack extends StatelessWidget {
  final StudentCardData card;
  final int qrCountdown;
  const _IDCardBack({required this.card, this.qrCountdown = 30});

  @override
  Widget build(BuildContext context) {
    final qrBytes = _decodeBase64Image(card.qrCodeBase64);

    return AspectRatio(
      aspectRatio: 1.586,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // QR code
              if (qrBytes != null)
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Image.memory(
                    qrBytes,
                    width: 120,
                    height: 120,
                    fit: BoxFit.contain,
                  ),
                )
              else
                const Icon(
                  Icons.qr_code_2,
                  size: 120,
                  color: AppColors.textSecondary,
                ),

              const SizedBox(height: 6),

              // QR refresh countdown
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      value: qrCountdown / 30,
                      strokeWidth: 2,
                      color: AppColors.primary,
                      backgroundColor: AppColors.primary.withValues(
                        alpha: 0.15,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Renouvellement dans ${qrCountdown}s',
                    style: const TextStyle(
                      fontSize: 9,
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // School address + info
              Text(
                card.school.name,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              if (card.school.address.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  card.school.address,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (card.school.phone.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  card.school.phone,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],

              const Spacer(),

              // Academic year
              if (card.academicYear.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    card.academicYear,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: AppColors.primary,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// Decode a `data:image/png;base64,...` string to raw bytes.
  Uint8List? _decodeBase64Image(String dataUri) {
    if (dataUri.isEmpty) return null;
    try {
      final base64Str = dataUri.contains(',')
          ? dataUri.split(',').last
          : dataUri;
      return base64Decode(base64Str);
    } catch (_) {
      return null;
    }
  }
}
