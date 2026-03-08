/// Transport information for parent's child
class TransportInfo {
  final String childId;
  final String childName;
  final TransportLine? line;
  final TransportDriver? driver;
  final TransportStop? pickupStop;
  final TransportStop? dropoffStop;
  final List<TransportStop> allStops;

  const TransportInfo({
    required this.childId,
    required this.childName,
    this.line,
    this.driver,
    this.pickupStop,
    this.dropoffStop,
    this.allStops = const [],
  });

  factory TransportInfo.fromJson(Map<String, dynamic> json) {
    return TransportInfo(
      childId: json['child_id'] as String? ?? '',
      childName: json['child_name'] as String? ?? '',
      line: json['line'] != null
          ? TransportLine.fromJson(json['line'] as Map<String, dynamic>)
          : null,
      driver: json['driver'] != null
          ? TransportDriver.fromJson(json['driver'] as Map<String, dynamic>)
          : null,
      pickupStop: json['pickup_stop'] != null
          ? TransportStop.fromJson(json['pickup_stop'] as Map<String, dynamic>)
          : null,
      dropoffStop: json['dropoff_stop'] != null
          ? TransportStop.fromJson(json['dropoff_stop'] as Map<String, dynamic>)
          : null,
      allStops:
          (json['all_stops'] as List<dynamic>?)
              ?.map((e) => TransportStop.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class TransportLine {
  final String id;
  final String name;
  final String? neighborhood;
  final String? departureTime;
  final String? returnTime;
  final String? vehiclePlate;
  final String? vehicleModel;
  final String? vehicleColor;

  const TransportLine({
    required this.id,
    required this.name,
    this.neighborhood,
    this.departureTime,
    this.returnTime,
    this.vehiclePlate,
    this.vehicleModel,
    this.vehicleColor,
  });

  factory TransportLine.fromJson(Map<String, dynamic> json) {
    return TransportLine(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      neighborhood: json['neighborhood'] as String?,
      departureTime: json['departure_time'] as String?,
      returnTime: json['return_time'] as String?,
      vehiclePlate: json['vehicle_plate'] as String?,
      vehicleModel: json['vehicle_model'] as String?,
      vehicleColor: json['vehicle_color'] as String?,
    );
  }
}

class TransportDriver {
  final String name;
  final String? phone;

  const TransportDriver({required this.name, this.phone});

  factory TransportDriver.fromJson(Map<String, dynamic> json) {
    return TransportDriver(
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String?,
    );
  }
}

class TransportStop {
  final String id;
  final String name;
  final int order;
  final String? estimatedTime;
  final double? lat;
  final double? lng;

  const TransportStop({
    required this.id,
    required this.name,
    this.order = 0,
    this.estimatedTime,
    this.lat,
    this.lng,
  });

  factory TransportStop.fromJson(Map<String, dynamic> json) {
    return TransportStop(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      estimatedTime: json['estimated_time'] as String?,
      lat: (json['latitude'] as num?)?.toDouble(),
      lng: (json['longitude'] as num?)?.toDouble(),
    );
  }
}

class GpsPosition {
  final String childId;
  final String childName;
  final String lineId;
  final String lineName;
  final double? lat;
  final double? lng;
  final double? speed;
  final DateTime? recordedAt;

  const GpsPosition({
    required this.childId,
    required this.childName,
    required this.lineId,
    required this.lineName,
    this.lat,
    this.lng,
    this.speed,
    this.recordedAt,
  });

  factory GpsPosition.fromJson(Map<String, dynamic> json) {
    final gps = json['gps'] as Map<String, dynamic>?;
    return GpsPosition(
      childId: json['child_id'] as String? ?? '',
      childName: json['child_name'] as String? ?? '',
      lineId: json['line_id'] as String? ?? '',
      lineName: json['line_name'] as String? ?? '',
      lat: (gps?['latitude'] as num?)?.toDouble(),
      lng: (gps?['longitude'] as num?)?.toDouble(),
      speed: (gps?['speed'] as num?)?.toDouble(),
      recordedAt: gps?['recorded_at'] != null
          ? DateTime.parse(gps!['recorded_at'] as String)
          : null,
    );
  }
}
