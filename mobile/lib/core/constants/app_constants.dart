/// Application-wide constants
class AppConstants {
  AppConstants._();

  static const String appName = 'EduConnect Algeria';
  static const String appNameAr = 'إيدو كونكت الجزائر';

  // API Configuration
  static const String baseUrl = 'http://10.0.2.2:8001/api/v1';
  static const String wsBaseUrl = 'ws://10.0.2.2:8001/ws';

  // Pagination
  static const int defaultPageSize = 20;

  // Cache durations
  static const Duration tokenRefreshThreshold = Duration(minutes: 5);
  static const Duration cacheExpiry = Duration(hours: 1);

  // Algerian school constants
  static const List<String> algerianWilayas = [
    'Adrar',
    'Chlef',
    'Laghouat',
    'Oum El Bouaghi',
    'Batna',
    'Béjaïa',
    'Biskra',
    'Béchar',
    'Blida',
    'Bouira',
    'Tamanrasset',
    'Tébessa',
    'Tlemcen',
    'Tiaret',
    'Tizi Ouzou',
    'Alger',
    'Djelfa',
    'Jijel',
    'Sétif',
    'Saïda',
    'Skikda',
    'Sidi Bel Abbès',
    'Annaba',
    'Guelma',
    'Constantine',
    'Médéa',
    'Mostaganem',
    'M\'Sila',
    'Mascara',
    'Ouargla',
    'Oran',
    'El Bayadh',
    'Illizi',
    'Bordj Bou Arréridj',
    'Boumerdès',
    'El Tarf',
    'Tindouf',
    'Tissemsilt',
    'El Oued',
    'Khenchela',
    'Souk Ahras',
    'Tipaza',
    'Mila',
    'Aïn Defla',
    'Naâma',
    'Aïn Témouchent',
    'Ghardaïa',
    'Relizane',
    'El M\'Ghair',
    'El Meniaa',
    'Ouled Djellal',
    'Bordj Badji Mokhtar',
    'Béni Abbès',
    'Timimoun',
    'Touggourt',
    'Djanet',
    'In Salah',
    'In Guezzam',
  ];

  // School days (Sunday to Thursday in Algeria)
  static const List<String> schoolDays = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
  ];

  // Grading system
  static const double maxGrade = 20.0;
  static const double passingGrade = 10.0;

  // File upload limits
  static const int maxFileSizeMB = 25;
  static const List<String> allowedFileExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'jpg',
    'jpeg',
    'png',
    'gif',
    'mp4',
    'mp3',
  ];
}
