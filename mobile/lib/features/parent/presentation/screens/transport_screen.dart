import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/transport_model.dart';
import '../../data/repositories/transport_repository.dart';

/// Transport screen — lines, stops, driver info, GPS tracking.
class TransportScreen extends StatefulWidget {
  const TransportScreen({super.key});

  @override
  State<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends State<TransportScreen> {
  List<TransportInfo> _infos = [];
  List<GpsPosition> _gps = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = getIt<TransportRepository>();
      final results = await Future.wait([
        repo.getTransportInfo(),
        repo.getGpsTrack(),
      ]);
      setState(() {
        _infos = results[0] as List<TransportInfo>;
        _gps = results[1] as List<GpsPosition>;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Transport scolaire')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_infos.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.directions_bus_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 12),
            Text('Aucune info transport disponible'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // GPS banner if live tracking exists
          if (_gps.isNotEmpty) _gpsBanner(),
          ..._infos.map(_childTransportCard),
        ],
      ),
    );
  }

  Widget _gpsBanner() {
    final latest = _gps.first;
    return Card(
      color: Colors.blue.shade50,
      margin: const EdgeInsets.only(bottom: 14),
      child: ListTile(
        leading: const Icon(Icons.gps_fixed, color: Colors.blue),
        title: Text('Bus en route — ${latest.lineName}'),
        subtitle: latest.speed != null
            ? Text('Vitesse : ${latest.speed!.toStringAsFixed(0)} km/h')
            : null,
        trailing: const Icon(Icons.arrow_forward_ios, size: 14),
        onTap: () {
          // Could navigate to map view in future
        },
      ),
    );
  }

  Widget _childTransportCard(TransportInfo info) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Child name
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: Colors.indigo.shade100,
                  child: Text(
                    info.childName.isNotEmpty
                        ? info.childName[0].toUpperCase()
                        : '?',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    info.childName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),

            // Line info
            if (info.line != null) ...[
              const SizedBox(height: 12),
              _infoRow(Icons.route, 'Ligne', info.line!.name),
              if (info.line!.neighborhood != null)
                _infoRow(
                  Icons.location_city,
                  'Quartier',
                  info.line!.neighborhood!,
                ),
              if (info.line!.departureTime != null)
                _infoRow(
                  Icons.access_time,
                  'Départ',
                  info.line!.departureTime!,
                ),
              if (info.line!.returnTime != null)
                _infoRow(Icons.access_time, 'Retour', info.line!.returnTime!),
              if (info.line!.vehiclePlate != null)
                _infoRow(
                  Icons.directions_bus,
                  'Véhicule',
                  '${info.line!.vehicleModel ?? ''} ${info.line!.vehicleColor ?? ''} — ${info.line!.vehiclePlate}'
                      .trim(),
                ),
            ],

            // Driver info
            if (info.driver != null) ...[
              const SizedBox(height: 8),
              const Divider(),
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(
                    'Chauffeur : ${info.driver!.name}',
                    style: const TextStyle(fontSize: 13),
                  ),
                  const Spacer(),
                  if (info.driver!.phone != null)
                    IconButton(
                      icon: const Icon(Icons.phone, size: 18),
                      color: Colors.green,
                      onPressed: () => _callDriver(info.driver!.phone!),
                      tooltip: 'Appeler',
                    ),
                ],
              ),
            ],

            // Pickup / dropoff
            if (info.pickupStop != null || info.dropoffStop != null) ...[
              const Divider(),
              if (info.pickupStop != null)
                _stopRow(Icons.arrow_upward, 'Ramassage', info.pickupStop!),
              if (info.dropoffStop != null)
                _stopRow(Icons.arrow_downward, 'Dépose', info.dropoffStop!),
            ],

            // All stops
            if (info.allStops.isNotEmpty) ...[
              const SizedBox(height: 8),
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: Text(
                  'Tous les arrêts (${info.allStops.length})',
                  style: const TextStyle(fontSize: 13),
                ),
                children: info.allStops
                    .map(
                      (s) => ListTile(
                        dense: true,
                        leading: CircleAvatar(
                          radius: 12,
                          child: Text(
                            '${s.order}',
                            style: const TextStyle(fontSize: 10),
                          ),
                        ),
                        title: Text(
                          s.name,
                          style: const TextStyle(fontSize: 13),
                        ),
                        trailing: s.estimatedTime != null
                            ? Text(
                                s.estimatedTime!,
                                style: const TextStyle(fontSize: 12),
                              )
                            : null,
                      ),
                    )
                    .toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(
            '$label : ',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stopRow(IconData icon, String label, TransportStop stop) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.indigo),
          const SizedBox(width: 8),
          Text('$label : ', style: const TextStyle(fontSize: 13)),
          Expanded(
            child: Text(
              stop.name,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
          if (stop.estimatedTime != null)
            Text(
              stop.estimatedTime!,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
        ],
      ),
    );
  }

  Future<void> _callDriver(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}
