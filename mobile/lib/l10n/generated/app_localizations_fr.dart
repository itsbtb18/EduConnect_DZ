// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class SFr extends S {
  SFr([String locale = 'fr']) : super(locale);

  @override
  String get appName => 'ILMI';

  @override
  String get appTagline => 'Algérie';

  @override
  String get login => 'Connexion';

  @override
  String get phoneNumber => 'Numéro de téléphone';

  @override
  String get phoneHint => '0555 12 34 56';

  @override
  String get password => 'Mot de passe';

  @override
  String get passwordHint => '••••••••';

  @override
  String get loginButton => 'Se connecter';

  @override
  String get pinLoginLink => 'Connexion par code PIN (élèves)';

  @override
  String get errorPhoneRequired => 'Veuillez entrer votre numéro';

  @override
  String get errorPhoneInvalid => 'Numéro de téléphone invalide';

  @override
  String get errorPasswordRequired => 'Veuillez entrer votre mot de passe';

  @override
  String get errorPasswordShort =>
      'Le mot de passe doit contenir au moins 6 caractères';

  @override
  String get pinLoginTitle => 'Connexion Élève';

  @override
  String get pinGreeting => 'Bonjour ! 👋';

  @override
  String get pinInstructions =>
      'Entre le numéro de téléphone de ton parent\net ton code PIN';

  @override
  String get pinPhoneHint => '05XX XXX XXX';

  @override
  String get pinCountryCode => '+213 ';

  @override
  String get pinPhoneError => 'Entre le numéro de téléphone';

  @override
  String get pinCode => 'Code PIN';

  @override
  String get pinEnter => 'Entrer';

  @override
  String get pinBackLink => '← Retour à la connexion classique';

  @override
  String get securityTitle => 'Sécurité';

  @override
  String get appLockSection => 'Verrouillage de l\'application';

  @override
  String get dataProtectionSection => 'Protection des données';

  @override
  String get pinLockOption => 'Code PIN';

  @override
  String get pinLockDesc =>
      'Protégez l\'accès à l\'application avec un code PIN';

  @override
  String get biometricOption => 'Empreinte digitale / Face ID';

  @override
  String get biometricDesc => 'Déverrouillez rapidement avec la biométrie';

  @override
  String get encryptionOption => 'Chiffrement des données';

  @override
  String get encryptionDesc =>
      'Vos données sensibles sont chiffrées localement';

  @override
  String get screenshotProtection => 'Protection anti-capture';

  @override
  String get screenshotDesc =>
      'Les captures d\'écran sont bloquées sur les pages sensibles';

  @override
  String get autoLogout => 'Déconnexion automatique';

  @override
  String get autoLogoutDesc =>
      'L\'application se verrouille après 5 minutes d\'inactivité';

  @override
  String get configurePinTitle => 'Configurer le code PIN';

  @override
  String get pinInputLabel => 'Code PIN (4-6 chiffres)';

  @override
  String get pinConfirmLabel => 'Confirmer le code PIN';

  @override
  String get cancel => 'Annuler';

  @override
  String get confirm => 'Confirmer';

  @override
  String get pinMinError => 'Minimum 4 chiffres';

  @override
  String get pinMismatch => 'Les codes ne correspondent pas';

  @override
  String get studentSpace => 'Espace Élève';

  @override
  String get parentSpace => 'Espace Parent';

  @override
  String get teacherSpace => 'Espace Enseignant';

  @override
  String get trainerSpace => 'Espace Formateur';

  @override
  String get traineeSpace => 'Espace Stagiaire';

  @override
  String get navHome => 'Accueil';

  @override
  String get navGrades => 'Notes';

  @override
  String get navSchedule => 'Emploi';

  @override
  String get navHomework => 'Devoirs';

  @override
  String get navAttendance => 'Présence';

  @override
  String get navHealth => 'Santé';

  @override
  String get navPayments => 'Paiements';

  @override
  String get menuIdCard => 'Carte d\'identité';

  @override
  String get menuELearning => 'E-Learning';

  @override
  String get menuLibrary => 'Bibliothèque';

  @override
  String get menuCanteen => 'Cantine';

  @override
  String get menuTransport => 'Transport';

  @override
  String get menuGamification => 'Gamification';

  @override
  String get menuAIChatbot => 'Assistant IA';

  @override
  String get menuProfile => 'Mon profil';

  @override
  String get menuReportCards => 'Bulletins';

  @override
  String get menuJustifications => 'Justifications';

  @override
  String get menuPreferences => 'Préférences';

  @override
  String get menuTextbook => 'Cahier de Texte';

  @override
  String get menuResources => 'Ressources Pédagogiques';

  @override
  String get menuPayslips => 'Fiches de Paie';

  @override
  String get menuCommunication => 'Communication';

  @override
  String get menuExams => 'Examens & Évaluations';

  @override
  String get menuAnnouncements => 'Annonces';

  @override
  String get dashboard => 'Tableau de bord';

  @override
  String get parentDashboard => 'Tableau de bord Parent';

  @override
  String get trainerDashboard => 'Tableau de bord Formateur';

  @override
  String get todayClasses => 'Cours aujourd\'hui';

  @override
  String get recentGrades => 'Dernières notes';

  @override
  String get pendingHomework => 'Devoirs à rendre';

  @override
  String get announcements => 'Annonces';

  @override
  String get noClassesToday => 'Pas de cours aujourd\'hui';

  @override
  String get noRecentGrades => 'Aucune note récente';

  @override
  String get noPendingHomework => 'Aucun devoir en attente';

  @override
  String get noAnnouncements => 'Aucune annonce';

  @override
  String get subject => 'Matière';

  @override
  String get today => 'Aujourd\'hui';

  @override
  String get daysShort => ' j';

  @override
  String get myGrades => 'Mes Notes';

  @override
  String get noGrades => 'Aucune note disponible';

  @override
  String get retry => 'Réessayer';

  @override
  String get exam => 'Examen';

  @override
  String gradeCount(int count) {
    return '$count note(s)';
  }

  @override
  String get scheduleTitle => 'Emploi du Temps';

  @override
  String get dayView => 'Jour';

  @override
  String get weekView => 'Semaine';

  @override
  String get noClassesDay => 'Pas de cours ce jour';

  @override
  String get myHomework => 'Mes Devoirs';

  @override
  String pendingTab(int count) {
    return 'À faire ($count)';
  }

  @override
  String submittedTab(int count) {
    return 'Soumis ($count)';
  }

  @override
  String overdueTab(int count) {
    return 'En retard ($count)';
  }

  @override
  String get noPendingHW => 'Aucun devoir à faire';

  @override
  String get noSubmittedHW => 'Aucun devoir soumis';

  @override
  String get noOverdueHW => 'Aucun devoir en retard';

  @override
  String get overdue => 'En retard';

  @override
  String get idCardTitle => 'Carte d\'identité';

  @override
  String get idCardUserError =>
      'Impossible de récupérer l\'identifiant utilisateur.';

  @override
  String idCardLoadError(String error) {
    return 'Erreur lors du chargement de la carte: $error';
  }

  @override
  String get canteenTitle => 'Cantine 🍽️';

  @override
  String get noMenuPublished => 'Aucun menu publié';

  @override
  String get noDetailsAvailable => 'Pas de détails disponibles';

  @override
  String get transportTitle => 'Transport 🚌';

  @override
  String get noTransportAssigned => 'Aucun transport assigné';

  @override
  String get contactAdmin =>
      'Contactez l\'administration pour plus d\'informations.';

  @override
  String get line => 'Ligne';

  @override
  String get vehicle => 'Véhicule';

  @override
  String get driver => 'Chauffeur';

  @override
  String get neighborhood => 'Quartier:';

  @override
  String get departure => 'Départ';

  @override
  String get returnTime => 'Retour';

  @override
  String get vehicleModel => 'Modèle';

  @override
  String get licensePlate => 'Plaque';

  @override
  String get vehicleColor => 'Couleur';

  @override
  String get libraryTitle => 'Bibliothèque';

  @override
  String get searchBookHint => 'Rechercher un livre…';

  @override
  String get categoryAll => 'Tous';

  @override
  String get categoryFiction => 'Fiction';

  @override
  String get categoryNonFiction => 'Non-fiction';

  @override
  String get categorySciences => 'Sciences';

  @override
  String get categoryMath => 'Mathématiques';

  @override
  String get categoryHistory => 'Histoire';

  @override
  String get categoryGeography => 'Géographie';

  @override
  String get categoryLiterature => 'Littérature';

  @override
  String get categoryReligion => 'Religion';

  @override
  String get categoryArts => 'Arts';

  @override
  String get categoryTechnology => 'Technologie';

  @override
  String get categoryReference => 'Référence';

  @override
  String get categoryPhilosophy => 'Philosophie';

  @override
  String get categoryLanguages => 'Langues';

  @override
  String get categorySports => 'Sports';

  @override
  String get categoryOther => 'Autre';

  @override
  String get noBooksFound => 'Aucun livre trouvé';

  @override
  String get myBorrows => 'Mes emprunts';

  @override
  String get loansTab => 'Emprunts';

  @override
  String get reservationsTab => 'Réservations';

  @override
  String get noActiveLoans => 'Aucun emprunt en cours';

  @override
  String get noReservations => 'Aucune réservation';

  @override
  String get statusActive => 'Actif';

  @override
  String get statusOverdue => 'En retard';

  @override
  String get statusReturned => 'Retourné';

  @override
  String get myQuizzes => 'Mes Quiz';

  @override
  String get noQuizzes => 'Aucun quiz disponible';

  @override
  String get quizClosed => 'Fermé';

  @override
  String get resourcesTitle => 'Ressources pédagogiques';

  @override
  String get searchResourceHint => 'Rechercher une ressource...';

  @override
  String get subjectAll => 'Tous';

  @override
  String get subjectMath => 'Mathématiques';

  @override
  String get subjectPhysics => 'Physique';

  @override
  String get subjectNaturalSciences => 'Sciences Naturelles';

  @override
  String get subjectArabic => 'Langue Arabe';

  @override
  String get subjectFrench => 'Langue Française';

  @override
  String get subjectEnglish => 'Anglais';

  @override
  String get subjectCS => 'Informatique';

  @override
  String get noResourcesFound => 'Aucune ressource trouvée';

  @override
  String get examBankTitle => 'Banque d\'examens';

  @override
  String get examAll => 'Tout';

  @override
  String get examBEP => 'BEP';

  @override
  String get examBEM => 'BEM';

  @override
  String get examBAC => 'BAC';

  @override
  String get examExercise => 'Exercice';

  @override
  String get examDevoir => 'Devoir';

  @override
  String get examBlanc => 'Examen blanc';

  @override
  String get noExamsFound => 'Aucun examen trouvé';

  @override
  String get rewardsTitle => 'Mes Récompenses ⭐';

  @override
  String get myBadges => 'Mes Badges';

  @override
  String get weeklyChallenges => 'Défis de la Semaine';

  @override
  String get leaderboard => 'Classement';

  @override
  String get noChallengesThisWeek => 'Pas de défi cette semaine';

  @override
  String get leaderboardUnavailable => 'Classement non disponible';

  @override
  String get congratulations => 'Félicitations ! 🎉';

  @override
  String badgeEarned(String badgeName) {
    return 'Tu as gagné le badge\n\"$badgeName\"';
  }

  @override
  String get badgesTitle => 'Mes Badges 🏅';

  @override
  String earnedBadges(int count) {
    return 'Badges gagnés ($count)';
  }

  @override
  String lockedBadges(int count) {
    return 'Badges à débloquer ($count)';
  }

  @override
  String get noBadgesAvailable => 'Aucun badge disponible pour le moment';

  @override
  String get leaderboardTitle => 'Classement 🏆';

  @override
  String get pointsUnit => ' pts';

  @override
  String get challengesTitle => 'Défis 🎯';

  @override
  String get comeBackSoon => 'Reviens bientôt !';

  @override
  String get childGradesTitle => 'Notes de mon enfant';

  @override
  String get columnSubject => 'Matière';

  @override
  String get columnType => 'Type';

  @override
  String get columnGrade => 'Note';

  @override
  String get columnAvg => 'Moy';

  @override
  String overallAverage(String value) {
    return 'Moyenne Générale: $value / 20';
  }

  @override
  String get childAttendanceTitle => 'Présences de mon enfant';

  @override
  String get monthJan => 'Janvier';

  @override
  String get monthFeb => 'Février';

  @override
  String get monthMar => 'Mars';

  @override
  String get monthApr => 'Avril';

  @override
  String get monthMay => 'Mai';

  @override
  String get monthJun => 'Juin';

  @override
  String get monthJul => 'Juillet';

  @override
  String get monthAug => 'Août';

  @override
  String get monthSep => 'Septembre';

  @override
  String get monthOct => 'Octobre';

  @override
  String get monthNov => 'Novembre';

  @override
  String get monthDec => 'Décembre';

  @override
  String get attendancePresent => 'Présences';

  @override
  String get attendanceAbsent => 'Absences';

  @override
  String get attendanceLate => 'Retards';

  @override
  String get attendanceRate => 'Taux';

  @override
  String get statusPresent => 'Présent';

  @override
  String get statusAbsent => 'Absent';

  @override
  String get statusLate => 'Retard';

  @override
  String get statusNA => 'N/A';

  @override
  String get canteenParentTitle => 'Cantine';

  @override
  String get periodWeek => 'Semaine';

  @override
  String get periodMonth => 'Mois';

  @override
  String get periodTrimester => 'Trimestre';

  @override
  String get mealStarter => '🥗 Entrée';

  @override
  String get mealMain => '🍖 Plat principal';

  @override
  String get mealSide => '🥕 Accompagnement';

  @override
  String get mealDessert => '🍰 Dessert';

  @override
  String allergenLabel(String list) {
    return 'Allergènes : $list';
  }

  @override
  String get diabeticLabel => 'Diabétique ✓';

  @override
  String get celiacLabel => 'Cœliaque ✓';

  @override
  String get schoolTransportTitle => 'Transport scolaire';

  @override
  String busEnRoute(String lineName) {
    return 'Bus en route — $lineName';
  }

  @override
  String speed(String value) {
    return 'Vitesse : $value km/h';
  }

  @override
  String get noTransportInfo => 'Aucune info transport disponible';

  @override
  String get callDriver => 'Appeler';

  @override
  String get financeTitle => 'Finances & Paiements';

  @override
  String get financeSummary => 'Résumé financier';

  @override
  String get totalFees => 'Total frais';

  @override
  String get paid => 'Payé';

  @override
  String get remaining => 'Restant';

  @override
  String get rate => 'Taux';

  @override
  String get currencyDA => ' DA';

  @override
  String get absenceJustTitle => 'Justification d\'absences';

  @override
  String get submitTab => 'Soumettre';

  @override
  String get trackingTab => 'Suivi';

  @override
  String get noAbsenceToJustify => 'Aucune absence à justifier';

  @override
  String get noJustificationSubmitted => 'Aucune justification soumise';

  @override
  String get statusApproved => 'Approuvée';

  @override
  String get statusRejected => 'Rejetée';

  @override
  String get statusPending => 'En attente';

  @override
  String get justify => 'Justifier';

  @override
  String get preferencesTitle => 'Préférences';

  @override
  String get notificationsSection => 'Notifications';

  @override
  String get silentModeSection => 'Mode silencieux';

  @override
  String get languageSection => 'Langue';

  @override
  String get appearanceSection => 'Apparence';

  @override
  String get notifGrades => 'Notes & Bulletins';

  @override
  String get notifAttendance => 'Présence & Absences';

  @override
  String get notifHomework => 'Devoirs';

  @override
  String get notifCanteen => 'Cantine';

  @override
  String get notifTransport => 'Transport';

  @override
  String get notifAnnouncements => 'Annonces';

  @override
  String get notifFinance => 'Finance';

  @override
  String get enableSilentMode => 'Activer le mode silencieux';

  @override
  String get silentModeDesc => 'Pas de notifications pendant la plage horaire';

  @override
  String get silentStart => 'Début';

  @override
  String get silentEnd => 'Fin';

  @override
  String get languageFr => 'Français';

  @override
  String get languageAr => 'العربية';

  @override
  String get darkMode => 'Mode sombre';

  @override
  String get darkModeDesc => 'Adapter l\'affichage pour la nuit';

  @override
  String get teacherAppTitle => 'ILMI — Enseignant';

  @override
  String get attendanceMarkingTitle => 'Appel — Présences';

  @override
  String get validate => 'Valider';

  @override
  String get classLabel => 'Classe';

  @override
  String get selectClass => 'Sélectionnez une classe';

  @override
  String get noStudentsFound => 'Aucun élève trouvé';

  @override
  String get attendanceSaved => 'Appel enregistré avec succès';

  @override
  String errorMessage(String message) {
    return 'Erreur: $message';
  }

  @override
  String get gradeEntryTitle => 'Saisie des notes';

  @override
  String get save => 'Enregistrer';

  @override
  String get subjectLabel => 'Matière';

  @override
  String get examTypeLabel => 'Type d\'examen';

  @override
  String get gradeEntryHint =>
      'Sélectionnez une classe, une matière et un type d\'examen';

  @override
  String get hwManagementTitle => 'Devoirs & Exercises';

  @override
  String get myHomeworkTab => 'Mes devoirs';

  @override
  String get submissionsTab => 'Soumissions';

  @override
  String get statsTab => 'Stats';

  @override
  String get calendarTab => 'Calendrier';

  @override
  String get newHomework => 'Nouveau devoir';

  @override
  String get noHomework => 'Aucun devoir';

  @override
  String get profileTitle => 'Mon Profil';

  @override
  String get email => 'E-mail';

  @override
  String get phone => 'Téléphone';

  @override
  String get school => 'École';

  @override
  String get language => 'Langue';

  @override
  String get changePassword => 'Changer le mot de passe';

  @override
  String get about => 'À propos';

  @override
  String get logout => 'Déconnexion';

  @override
  String get changePasswordSoon => 'Changement de mot de passe à venir';

  @override
  String get messagesTitle => 'Messages';

  @override
  String get noConversations => 'Aucune conversation';

  @override
  String get noLastMessage => 'Pas de message';

  @override
  String get conversationTitle => 'Conversation';

  @override
  String get noMessages => 'Aucun message';

  @override
  String get announcementsTitle => 'Annonces';

  @override
  String get noAnnouncementsYet => 'Aucune annonce pour le moment';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get markAllRead => 'Tout marquer lu';

  @override
  String get noNotificationsYet => 'Aucune notification pour le moment';

  @override
  String get edubot => 'EduBot';

  @override
  String get newConversation => 'Nouvelle conversation';

  @override
  String get edubotThinking => 'EduBot réfléchit...';

  @override
  String get daySunday => 'Dimanche';

  @override
  String get dayMonday => 'Lundi';

  @override
  String get dayTuesday => 'Mardi';

  @override
  String get dayWednesday => 'Mercredi';

  @override
  String get dayThursday => 'Jeudi';

  @override
  String get trainerGroups => 'Mes groupes';

  @override
  String get trainerSessions => 'Séances';

  @override
  String get trainerMessages => 'Messages';

  @override
  String unmarkedSessions(int count) {
    return '$count séance(s) non marquée(s)';
  }

  @override
  String get attendanceToRecord => 'Présence à enregistrer';

  @override
  String get todaySessions => 'Séances du jour';

  @override
  String get myGroups => 'Mes groupes';

  @override
  String get traineeTrainings => 'Formations';

  @override
  String get traineeAttendance => 'Présence';

  @override
  String get traineePayments => 'Paiements';

  @override
  String get nextSession => 'Prochaine séance';

  @override
  String get myTrainings => 'Mes formations';

  @override
  String pendingPayments(int count) {
    return '$count paiement(s) en attente';
  }

  @override
  String get infirmaryTitle => 'Messages infirmerie';

  @override
  String get medicalSummary => 'Résumé médical';
}
