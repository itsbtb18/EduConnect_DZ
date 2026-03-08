import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../parent/data/models/transport_model.dart';
import '../../../parent/data/repositories/transport_repository.dart';

/// Student transport screen — shows assigned line, driver, stops & schedule.
class StudentTransportScreen extends StatefulWidget {
  const StudentTransportScreen({super.key});

  @override
  State<StudentTransportScreen> createState() => _StudentTransportScreenState();
}

class _StudentTransportScreenState extends State<StudentTransportScreen> {
  bool _loading = true;
  String? _error;
  TransportInfo? _info;

  @override
  void initState() {
    super.initState();
    _loadTransport();
  }

  Future<void> _loadTransport() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await getIt<TransportRepository>().getTransportInfo();
      // For a student the API returns their own info (single entry)
      _info = list.isNotEmpty ? list.first : null;
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Transport 🚌'), centerTitle: true),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildError()
          : _info == null || _info!.line == null
          ? _buildEmpty()
          : _buildContent(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppColors.error),
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadTransport,
            icon: const Icon(Icons.refresh),
            label: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('🚌', style: TextStyle(fontSize: 48)),
          SizedBox(height: 12),
          Text(
            'Aucun transport assigné',
            style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
          ),
          SizedBox(height: 4),
          Text(
            'Contactez l\'administration pour plus d\'informations.',
            style: TextStyle(fontSize: 13, color: AppColors.textHint),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final info = _info!;
    final line = info.line!;

    return RefreshIndicator(
      onRefresh: _loadTransport,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Line info card
          _SectionCard(
            icon: Icons.route,
            title: 'Ligne',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  line.name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (line.neighborhood != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Quartier: ${line.neighborhood}',
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    _InfoChip(
                      icon: Icons.access_time,
                      label: 'Départ',
                      value: line.departureTime ?? '--:--',
                    ),
                    const SizedBox(width: 12),
                    _InfoChip(
                      icon: Icons.access_time_filled,
                      label: 'Retour',
                      value: line.returnTime ?? '--:--',
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Vehicle info
          if (line.vehiclePlate != null ||
              line.vehicleModel != null ||
              line.vehicleColor != null)
            _SectionCard(
              icon: Icons.directions_bus,
              title: 'Véhicule',
              child: Row(
                children: [
                  if (line.vehicleModel != null)
                    Expanded(child: _DetailRow('Modèle', line.vehicleModel!)),
                  if (line.vehiclePlate != null)
                    Expanded(child: _DetailRow('Plaque', line.vehiclePlate!)),
                  if (line.vehicleColor != null)
                    Expanded(child: _DetailRow('Couleur', line.vehicleColor!)),
                ],
              ),
            ),
          if (line.vehiclePlate != null) const SizedBox(height: 12),

          // Driver info
          if (info.driver != null) ...[
            _SectionCard(
              icon: Icons.person,
              title: 'Chauffeur',
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: const Icon(Icons.person, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          info.driver!.name,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        if (info.driver!.phone != null)
                          Text(
                            info.driver!.phone!,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Pickup/Dropoff
          if (info.pickupStop != null || info.dropoffStop != null)
            _SectionCard(
              icon: Icons.pin_drop,
              title: 'Mes arrêts',
              child: Column(
                children: [
                  if (info.pickupStop != null)
                    _StopTile(
                      label: 'Montée',
                      stop: info.pickupStop!,
                      color: AppColors.success,
                    ),
                  if (info.pickupStop != null && info.dropoffStop != null)
                    const Divider(height: 16),
                  if (info.dropoffStop != null)
                    _StopTile(
                      label: 'Descente',
                      stop: info.dropoffStop!,
                      color: AppColors.secondary,
                    ),
                ],
              ),
            ),
          if (info.pickupStop != null) const SizedBox(height: 12),

          // All stops timeline
          if (info.allStops.isNotEmpty) ...[
            _SectionCard(
              icon: Icons.timeline,
              title: 'Tous les arrêts (${info.allStops.length})',
              child: Column(
                children: [
                  for (int i = 0; i < info.allStops.length; i++)
                    _TimelineStop(
                      stop: info.allStops[i],
                      isFirst: i == 0,
                      isLast: i == info.allStops.length - 1,
                      isMyStop:
                          info.allStops[i].id == info.pickupStop?.id ||
                          info.allStops[i].id == info.dropoffStop?.id,
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 10, color: AppColors.textHint),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textHint),
        ),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _StopTile extends StatelessWidget {
  final String label;
  final TransportStop stop;
  final Color color;
  const _StopTile({
    required this.label,
    required this.stop,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(
            label == 'Montée' ? Icons.arrow_upward : Icons.arrow_downward,
            size: 18,
            color: color,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                stop.name,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        if (stop.estimatedTime != null)
          Text(
            stop.estimatedTime!,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
            ),
          ),
      ],
    );
  }
}

class _TimelineStop extends StatelessWidget {
  final TransportStop stop;
  final bool isFirst;
  final bool isLast;
  final bool isMyStop;
  const _TimelineStop({
    required this.stop,
    required this.isFirst,
    required this.isLast,
    required this.isMyStop,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                if (!isFirst)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                Container(
                  width: isMyStop ? 14 : 10,
                  height: isMyStop ? 14 : 10,
                  decoration: BoxDecoration(
                    color: isMyStop ? AppColors.primary : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.primary,
                      width: isMyStop ? 3 : 2,
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      stop.name,
                      style: TextStyle(
                        fontWeight: isMyStop
                            ? FontWeight.bold
                            : FontWeight.normal,
                        color: isMyStop ? AppColors.primary : null,
                      ),
                    ),
                  ),
                  if (stop.estimatedTime != null)
                    Text(
                      stop.estimatedTime!,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isMyStop
                            ? AppColors.primary
                            : AppColors.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
