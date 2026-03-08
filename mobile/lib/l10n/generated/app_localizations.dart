import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of S
/// returned by `S.of(context)`.
///
/// Applications need to include `S.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: S.localizationsDelegates,
///   supportedLocales: S.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the S.supportedLocales
/// property.
abstract class S {
  S(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static S of(BuildContext context) {
    return Localizations.of<S>(context, S)!;
  }

  static const LocalizationsDelegate<S> delegate = _SDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('fr'),
  ];

  /// No description provided for @appName.
  ///
  /// In fr, this message translates to:
  /// **'ILMI'**
  String get appName;

  /// No description provided for @appTagline.
  ///
  /// In fr, this message translates to:
  /// **'Algérie'**
  String get appTagline;

  /// No description provided for @login.
  ///
  /// In fr, this message translates to:
  /// **'Connexion'**
  String get login;

  /// No description provided for @phoneNumber.
  ///
  /// In fr, this message translates to:
  /// **'Numéro de téléphone'**
  String get phoneNumber;

  /// No description provided for @phoneHint.
  ///
  /// In fr, this message translates to:
  /// **'0555 12 34 56'**
  String get phoneHint;

  /// No description provided for @password.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get password;

  /// No description provided for @passwordHint.
  ///
  /// In fr, this message translates to:
  /// **'••••••••'**
  String get passwordHint;

  /// No description provided for @loginButton.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get loginButton;

  /// No description provided for @pinLoginLink.
  ///
  /// In fr, this message translates to:
  /// **'Connexion par code PIN (élèves)'**
  String get pinLoginLink;

  /// No description provided for @errorPhoneRequired.
  ///
  /// In fr, this message translates to:
  /// **'Veuillez entrer votre numéro'**
  String get errorPhoneRequired;

  /// No description provided for @errorPhoneInvalid.
  ///
  /// In fr, this message translates to:
  /// **'Numéro de téléphone invalide'**
  String get errorPhoneInvalid;

  /// No description provided for @errorPasswordRequired.
  ///
  /// In fr, this message translates to:
  /// **'Veuillez entrer votre mot de passe'**
  String get errorPasswordRequired;

  /// No description provided for @errorPasswordShort.
  ///
  /// In fr, this message translates to:
  /// **'Le mot de passe doit contenir au moins 6 caractères'**
  String get errorPasswordShort;

  /// No description provided for @pinLoginTitle.
  ///
  /// In fr, this message translates to:
  /// **'Connexion Élève'**
  String get pinLoginTitle;

  /// No description provided for @pinGreeting.
  ///
  /// In fr, this message translates to:
  /// **'Bonjour ! 👋'**
  String get pinGreeting;

  /// No description provided for @pinInstructions.
  ///
  /// In fr, this message translates to:
  /// **'Entre le numéro de téléphone de ton parent\net ton code PIN'**
  String get pinInstructions;

  /// No description provided for @pinPhoneHint.
  ///
  /// In fr, this message translates to:
  /// **'05XX XXX XXX'**
  String get pinPhoneHint;

  /// No description provided for @pinCountryCode.
  ///
  /// In fr, this message translates to:
  /// **'+213 '**
  String get pinCountryCode;

  /// No description provided for @pinPhoneError.
  ///
  /// In fr, this message translates to:
  /// **'Entre le numéro de téléphone'**
  String get pinPhoneError;

  /// No description provided for @pinCode.
  ///
  /// In fr, this message translates to:
  /// **'Code PIN'**
  String get pinCode;

  /// No description provided for @pinEnter.
  ///
  /// In fr, this message translates to:
  /// **'Entrer'**
  String get pinEnter;

  /// No description provided for @pinBackLink.
  ///
  /// In fr, this message translates to:
  /// **'← Retour à la connexion classique'**
  String get pinBackLink;

  /// No description provided for @securityTitle.
  ///
  /// In fr, this message translates to:
  /// **'Sécurité'**
  String get securityTitle;

  /// No description provided for @appLockSection.
  ///
  /// In fr, this message translates to:
  /// **'Verrouillage de l\'application'**
  String get appLockSection;

  /// No description provided for @dataProtectionSection.
  ///
  /// In fr, this message translates to:
  /// **'Protection des données'**
  String get dataProtectionSection;

  /// No description provided for @pinLockOption.
  ///
  /// In fr, this message translates to:
  /// **'Code PIN'**
  String get pinLockOption;

  /// No description provided for @pinLockDesc.
  ///
  /// In fr, this message translates to:
  /// **'Protégez l\'accès à l\'application avec un code PIN'**
  String get pinLockDesc;

  /// No description provided for @biometricOption.
  ///
  /// In fr, this message translates to:
  /// **'Empreinte digitale / Face ID'**
  String get biometricOption;

  /// No description provided for @biometricDesc.
  ///
  /// In fr, this message translates to:
  /// **'Déverrouillez rapidement avec la biométrie'**
  String get biometricDesc;

  /// No description provided for @encryptionOption.
  ///
  /// In fr, this message translates to:
  /// **'Chiffrement des données'**
  String get encryptionOption;

  /// No description provided for @encryptionDesc.
  ///
  /// In fr, this message translates to:
  /// **'Vos données sensibles sont chiffrées localement'**
  String get encryptionDesc;

  /// No description provided for @screenshotProtection.
  ///
  /// In fr, this message translates to:
  /// **'Protection anti-capture'**
  String get screenshotProtection;

  /// No description provided for @screenshotDesc.
  ///
  /// In fr, this message translates to:
  /// **'Les captures d\'écran sont bloquées sur les pages sensibles'**
  String get screenshotDesc;

  /// No description provided for @autoLogout.
  ///
  /// In fr, this message translates to:
  /// **'Déconnexion automatique'**
  String get autoLogout;

  /// No description provided for @autoLogoutDesc.
  ///
  /// In fr, this message translates to:
  /// **'L\'application se verrouille après 5 minutes d\'inactivité'**
  String get autoLogoutDesc;

  /// No description provided for @configurePinTitle.
  ///
  /// In fr, this message translates to:
  /// **'Configurer le code PIN'**
  String get configurePinTitle;

  /// No description provided for @pinInputLabel.
  ///
  /// In fr, this message translates to:
  /// **'Code PIN (4-6 chiffres)'**
  String get pinInputLabel;

  /// No description provided for @pinConfirmLabel.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer le code PIN'**
  String get pinConfirmLabel;

  /// No description provided for @cancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get cancel;

  /// No description provided for @confirm.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer'**
  String get confirm;

  /// No description provided for @pinMinError.
  ///
  /// In fr, this message translates to:
  /// **'Minimum 4 chiffres'**
  String get pinMinError;

  /// No description provided for @pinMismatch.
  ///
  /// In fr, this message translates to:
  /// **'Les codes ne correspondent pas'**
  String get pinMismatch;

  /// No description provided for @studentSpace.
  ///
  /// In fr, this message translates to:
  /// **'Espace Élève'**
  String get studentSpace;

  /// No description provided for @parentSpace.
  ///
  /// In fr, this message translates to:
  /// **'Espace Parent'**
  String get parentSpace;

  /// No description provided for @teacherSpace.
  ///
  /// In fr, this message translates to:
  /// **'Espace Enseignant'**
  String get teacherSpace;

  /// No description provided for @trainerSpace.
  ///
  /// In fr, this message translates to:
  /// **'Espace Formateur'**
  String get trainerSpace;

  /// No description provided for @traineeSpace.
  ///
  /// In fr, this message translates to:
  /// **'Espace Stagiaire'**
  String get traineeSpace;

  /// No description provided for @navHome.
  ///
  /// In fr, this message translates to:
  /// **'Accueil'**
  String get navHome;

  /// No description provided for @navGrades.
  ///
  /// In fr, this message translates to:
  /// **'Notes'**
  String get navGrades;

  /// No description provided for @navSchedule.
  ///
  /// In fr, this message translates to:
  /// **'Emploi'**
  String get navSchedule;

  /// No description provided for @navHomework.
  ///
  /// In fr, this message translates to:
  /// **'Devoirs'**
  String get navHomework;

  /// No description provided for @navAttendance.
  ///
  /// In fr, this message translates to:
  /// **'Présence'**
  String get navAttendance;

  /// No description provided for @navHealth.
  ///
  /// In fr, this message translates to:
  /// **'Santé'**
  String get navHealth;

  /// No description provided for @navPayments.
  ///
  /// In fr, this message translates to:
  /// **'Paiements'**
  String get navPayments;

  /// No description provided for @menuIdCard.
  ///
  /// In fr, this message translates to:
  /// **'Carte d\'identité'**
  String get menuIdCard;

  /// No description provided for @menuELearning.
  ///
  /// In fr, this message translates to:
  /// **'E-Learning'**
  String get menuELearning;

  /// No description provided for @menuLibrary.
  ///
  /// In fr, this message translates to:
  /// **'Bibliothèque'**
  String get menuLibrary;

  /// No description provided for @menuCanteen.
  ///
  /// In fr, this message translates to:
  /// **'Cantine'**
  String get menuCanteen;

  /// No description provided for @menuTransport.
  ///
  /// In fr, this message translates to:
  /// **'Transport'**
  String get menuTransport;

  /// No description provided for @menuGamification.
  ///
  /// In fr, this message translates to:
  /// **'Gamification'**
  String get menuGamification;

  /// No description provided for @menuAIChatbot.
  ///
  /// In fr, this message translates to:
  /// **'Assistant IA'**
  String get menuAIChatbot;

  /// No description provided for @menuProfile.
  ///
  /// In fr, this message translates to:
  /// **'Mon profil'**
  String get menuProfile;

  /// No description provided for @menuReportCards.
  ///
  /// In fr, this message translates to:
  /// **'Bulletins'**
  String get menuReportCards;

  /// No description provided for @menuJustifications.
  ///
  /// In fr, this message translates to:
  /// **'Justifications'**
  String get menuJustifications;

  /// No description provided for @menuPreferences.
  ///
  /// In fr, this message translates to:
  /// **'Préférences'**
  String get menuPreferences;

  /// No description provided for @menuTextbook.
  ///
  /// In fr, this message translates to:
  /// **'Cahier de Texte'**
  String get menuTextbook;

  /// No description provided for @menuResources.
  ///
  /// In fr, this message translates to:
  /// **'Ressources Pédagogiques'**
  String get menuResources;

  /// No description provided for @menuPayslips.
  ///
  /// In fr, this message translates to:
  /// **'Fiches de Paie'**
  String get menuPayslips;

  /// No description provided for @menuCommunication.
  ///
  /// In fr, this message translates to:
  /// **'Communication'**
  String get menuCommunication;

  /// No description provided for @menuExams.
  ///
  /// In fr, this message translates to:
  /// **'Examens & Évaluations'**
  String get menuExams;

  /// No description provided for @menuAnnouncements.
  ///
  /// In fr, this message translates to:
  /// **'Annonces'**
  String get menuAnnouncements;

  /// No description provided for @dashboard.
  ///
  /// In fr, this message translates to:
  /// **'Tableau de bord'**
  String get dashboard;

  /// No description provided for @parentDashboard.
  ///
  /// In fr, this message translates to:
  /// **'Tableau de bord Parent'**
  String get parentDashboard;

  /// No description provided for @trainerDashboard.
  ///
  /// In fr, this message translates to:
  /// **'Tableau de bord Formateur'**
  String get trainerDashboard;

  /// No description provided for @todayClasses.
  ///
  /// In fr, this message translates to:
  /// **'Cours aujourd\'hui'**
  String get todayClasses;

  /// No description provided for @recentGrades.
  ///
  /// In fr, this message translates to:
  /// **'Dernières notes'**
  String get recentGrades;

  /// No description provided for @pendingHomework.
  ///
  /// In fr, this message translates to:
  /// **'Devoirs à rendre'**
  String get pendingHomework;

  /// No description provided for @announcements.
  ///
  /// In fr, this message translates to:
  /// **'Annonces'**
  String get announcements;

  /// No description provided for @noClassesToday.
  ///
  /// In fr, this message translates to:
  /// **'Pas de cours aujourd\'hui'**
  String get noClassesToday;

  /// No description provided for @noRecentGrades.
  ///
  /// In fr, this message translates to:
  /// **'Aucune note récente'**
  String get noRecentGrades;

  /// No description provided for @noPendingHomework.
  ///
  /// In fr, this message translates to:
  /// **'Aucun devoir en attente'**
  String get noPendingHomework;

  /// No description provided for @noAnnouncements.
  ///
  /// In fr, this message translates to:
  /// **'Aucune annonce'**
  String get noAnnouncements;

  /// No description provided for @subject.
  ///
  /// In fr, this message translates to:
  /// **'Matière'**
  String get subject;

  /// No description provided for @today.
  ///
  /// In fr, this message translates to:
  /// **'Aujourd\'hui'**
  String get today;

  /// No description provided for @daysShort.
  ///
  /// In fr, this message translates to:
  /// **' j'**
  String get daysShort;

  /// No description provided for @myGrades.
  ///
  /// In fr, this message translates to:
  /// **'Mes Notes'**
  String get myGrades;

  /// No description provided for @noGrades.
  ///
  /// In fr, this message translates to:
  /// **'Aucune note disponible'**
  String get noGrades;

  /// No description provided for @retry.
  ///
  /// In fr, this message translates to:
  /// **'Réessayer'**
  String get retry;

  /// No description provided for @exam.
  ///
  /// In fr, this message translates to:
  /// **'Examen'**
  String get exam;

  /// No description provided for @gradeCount.
  ///
  /// In fr, this message translates to:
  /// **'{count} note(s)'**
  String gradeCount(int count);

  /// No description provided for @scheduleTitle.
  ///
  /// In fr, this message translates to:
  /// **'Emploi du Temps'**
  String get scheduleTitle;

  /// No description provided for @dayView.
  ///
  /// In fr, this message translates to:
  /// **'Jour'**
  String get dayView;

  /// No description provided for @weekView.
  ///
  /// In fr, this message translates to:
  /// **'Semaine'**
  String get weekView;

  /// No description provided for @noClassesDay.
  ///
  /// In fr, this message translates to:
  /// **'Pas de cours ce jour'**
  String get noClassesDay;

  /// No description provided for @myHomework.
  ///
  /// In fr, this message translates to:
  /// **'Mes Devoirs'**
  String get myHomework;

  /// No description provided for @pendingTab.
  ///
  /// In fr, this message translates to:
  /// **'À faire ({count})'**
  String pendingTab(int count);

  /// No description provided for @submittedTab.
  ///
  /// In fr, this message translates to:
  /// **'Soumis ({count})'**
  String submittedTab(int count);

  /// No description provided for @overdueTab.
  ///
  /// In fr, this message translates to:
  /// **'En retard ({count})'**
  String overdueTab(int count);

  /// No description provided for @noPendingHW.
  ///
  /// In fr, this message translates to:
  /// **'Aucun devoir à faire'**
  String get noPendingHW;

  /// No description provided for @noSubmittedHW.
  ///
  /// In fr, this message translates to:
  /// **'Aucun devoir soumis'**
  String get noSubmittedHW;

  /// No description provided for @noOverdueHW.
  ///
  /// In fr, this message translates to:
  /// **'Aucun devoir en retard'**
  String get noOverdueHW;

  /// No description provided for @overdue.
  ///
  /// In fr, this message translates to:
  /// **'En retard'**
  String get overdue;

  /// No description provided for @idCardTitle.
  ///
  /// In fr, this message translates to:
  /// **'Carte d\'identité'**
  String get idCardTitle;

  /// No description provided for @idCardUserError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de récupérer l\'identifiant utilisateur.'**
  String get idCardUserError;

  /// No description provided for @idCardLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Erreur lors du chargement de la carte: {error}'**
  String idCardLoadError(String error);

  /// No description provided for @canteenTitle.
  ///
  /// In fr, this message translates to:
  /// **'Cantine 🍽️'**
  String get canteenTitle;

  /// No description provided for @noMenuPublished.
  ///
  /// In fr, this message translates to:
  /// **'Aucun menu publié'**
  String get noMenuPublished;

  /// No description provided for @noDetailsAvailable.
  ///
  /// In fr, this message translates to:
  /// **'Pas de détails disponibles'**
  String get noDetailsAvailable;

  /// No description provided for @transportTitle.
  ///
  /// In fr, this message translates to:
  /// **'Transport 🚌'**
  String get transportTitle;

  /// No description provided for @noTransportAssigned.
  ///
  /// In fr, this message translates to:
  /// **'Aucun transport assigné'**
  String get noTransportAssigned;

  /// No description provided for @contactAdmin.
  ///
  /// In fr, this message translates to:
  /// **'Contactez l\'administration pour plus d\'informations.'**
  String get contactAdmin;

  /// No description provided for @line.
  ///
  /// In fr, this message translates to:
  /// **'Ligne'**
  String get line;

  /// No description provided for @vehicle.
  ///
  /// In fr, this message translates to:
  /// **'Véhicule'**
  String get vehicle;

  /// No description provided for @driver.
  ///
  /// In fr, this message translates to:
  /// **'Chauffeur'**
  String get driver;

  /// No description provided for @neighborhood.
  ///
  /// In fr, this message translates to:
  /// **'Quartier:'**
  String get neighborhood;

  /// No description provided for @departure.
  ///
  /// In fr, this message translates to:
  /// **'Départ'**
  String get departure;

  /// No description provided for @returnTime.
  ///
  /// In fr, this message translates to:
  /// **'Retour'**
  String get returnTime;

  /// No description provided for @vehicleModel.
  ///
  /// In fr, this message translates to:
  /// **'Modèle'**
  String get vehicleModel;

  /// No description provided for @licensePlate.
  ///
  /// In fr, this message translates to:
  /// **'Plaque'**
  String get licensePlate;

  /// No description provided for @vehicleColor.
  ///
  /// In fr, this message translates to:
  /// **'Couleur'**
  String get vehicleColor;

  /// No description provided for @libraryTitle.
  ///
  /// In fr, this message translates to:
  /// **'Bibliothèque'**
  String get libraryTitle;

  /// No description provided for @searchBookHint.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher un livre…'**
  String get searchBookHint;

  /// No description provided for @categoryAll.
  ///
  /// In fr, this message translates to:
  /// **'Tous'**
  String get categoryAll;

  /// No description provided for @categoryFiction.
  ///
  /// In fr, this message translates to:
  /// **'Fiction'**
  String get categoryFiction;

  /// No description provided for @categoryNonFiction.
  ///
  /// In fr, this message translates to:
  /// **'Non-fiction'**
  String get categoryNonFiction;

  /// No description provided for @categorySciences.
  ///
  /// In fr, this message translates to:
  /// **'Sciences'**
  String get categorySciences;

  /// No description provided for @categoryMath.
  ///
  /// In fr, this message translates to:
  /// **'Mathématiques'**
  String get categoryMath;

  /// No description provided for @categoryHistory.
  ///
  /// In fr, this message translates to:
  /// **'Histoire'**
  String get categoryHistory;

  /// No description provided for @categoryGeography.
  ///
  /// In fr, this message translates to:
  /// **'Géographie'**
  String get categoryGeography;

  /// No description provided for @categoryLiterature.
  ///
  /// In fr, this message translates to:
  /// **'Littérature'**
  String get categoryLiterature;

  /// No description provided for @categoryReligion.
  ///
  /// In fr, this message translates to:
  /// **'Religion'**
  String get categoryReligion;

  /// No description provided for @categoryArts.
  ///
  /// In fr, this message translates to:
  /// **'Arts'**
  String get categoryArts;

  /// No description provided for @categoryTechnology.
  ///
  /// In fr, this message translates to:
  /// **'Technologie'**
  String get categoryTechnology;

  /// No description provided for @categoryReference.
  ///
  /// In fr, this message translates to:
  /// **'Référence'**
  String get categoryReference;

  /// No description provided for @categoryPhilosophy.
  ///
  /// In fr, this message translates to:
  /// **'Philosophie'**
  String get categoryPhilosophy;

  /// No description provided for @categoryLanguages.
  ///
  /// In fr, this message translates to:
  /// **'Langues'**
  String get categoryLanguages;

  /// No description provided for @categorySports.
  ///
  /// In fr, this message translates to:
  /// **'Sports'**
  String get categorySports;

  /// No description provided for @categoryOther.
  ///
  /// In fr, this message translates to:
  /// **'Autre'**
  String get categoryOther;

  /// No description provided for @noBooksFound.
  ///
  /// In fr, this message translates to:
  /// **'Aucun livre trouvé'**
  String get noBooksFound;

  /// No description provided for @myBorrows.
  ///
  /// In fr, this message translates to:
  /// **'Mes emprunts'**
  String get myBorrows;

  /// No description provided for @loansTab.
  ///
  /// In fr, this message translates to:
  /// **'Emprunts'**
  String get loansTab;

  /// No description provided for @reservationsTab.
  ///
  /// In fr, this message translates to:
  /// **'Réservations'**
  String get reservationsTab;

  /// No description provided for @noActiveLoans.
  ///
  /// In fr, this message translates to:
  /// **'Aucun emprunt en cours'**
  String get noActiveLoans;

  /// No description provided for @noReservations.
  ///
  /// In fr, this message translates to:
  /// **'Aucune réservation'**
  String get noReservations;

  /// No description provided for @statusActive.
  ///
  /// In fr, this message translates to:
  /// **'Actif'**
  String get statusActive;

  /// No description provided for @statusOverdue.
  ///
  /// In fr, this message translates to:
  /// **'En retard'**
  String get statusOverdue;

  /// No description provided for @statusReturned.
  ///
  /// In fr, this message translates to:
  /// **'Retourné'**
  String get statusReturned;

  /// No description provided for @myQuizzes.
  ///
  /// In fr, this message translates to:
  /// **'Mes Quiz'**
  String get myQuizzes;

  /// No description provided for @noQuizzes.
  ///
  /// In fr, this message translates to:
  /// **'Aucun quiz disponible'**
  String get noQuizzes;

  /// No description provided for @quizClosed.
  ///
  /// In fr, this message translates to:
  /// **'Fermé'**
  String get quizClosed;

  /// No description provided for @resourcesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Ressources pédagogiques'**
  String get resourcesTitle;

  /// No description provided for @searchResourceHint.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher une ressource...'**
  String get searchResourceHint;

  /// No description provided for @subjectAll.
  ///
  /// In fr, this message translates to:
  /// **'Tous'**
  String get subjectAll;

  /// No description provided for @subjectMath.
  ///
  /// In fr, this message translates to:
  /// **'Mathématiques'**
  String get subjectMath;

  /// No description provided for @subjectPhysics.
  ///
  /// In fr, this message translates to:
  /// **'Physique'**
  String get subjectPhysics;

  /// No description provided for @subjectNaturalSciences.
  ///
  /// In fr, this message translates to:
  /// **'Sciences Naturelles'**
  String get subjectNaturalSciences;

  /// No description provided for @subjectArabic.
  ///
  /// In fr, this message translates to:
  /// **'Langue Arabe'**
  String get subjectArabic;

  /// No description provided for @subjectFrench.
  ///
  /// In fr, this message translates to:
  /// **'Langue Française'**
  String get subjectFrench;

  /// No description provided for @subjectEnglish.
  ///
  /// In fr, this message translates to:
  /// **'Anglais'**
  String get subjectEnglish;

  /// No description provided for @subjectCS.
  ///
  /// In fr, this message translates to:
  /// **'Informatique'**
  String get subjectCS;

  /// No description provided for @noResourcesFound.
  ///
  /// In fr, this message translates to:
  /// **'Aucune ressource trouvée'**
  String get noResourcesFound;

  /// No description provided for @examBankTitle.
  ///
  /// In fr, this message translates to:
  /// **'Banque d\'examens'**
  String get examBankTitle;

  /// No description provided for @examAll.
  ///
  /// In fr, this message translates to:
  /// **'Tout'**
  String get examAll;

  /// No description provided for @examBEP.
  ///
  /// In fr, this message translates to:
  /// **'BEP'**
  String get examBEP;

  /// No description provided for @examBEM.
  ///
  /// In fr, this message translates to:
  /// **'BEM'**
  String get examBEM;

  /// No description provided for @examBAC.
  ///
  /// In fr, this message translates to:
  /// **'BAC'**
  String get examBAC;

  /// No description provided for @examExercise.
  ///
  /// In fr, this message translates to:
  /// **'Exercice'**
  String get examExercise;

  /// No description provided for @examDevoir.
  ///
  /// In fr, this message translates to:
  /// **'Devoir'**
  String get examDevoir;

  /// No description provided for @examBlanc.
  ///
  /// In fr, this message translates to:
  /// **'Examen blanc'**
  String get examBlanc;

  /// No description provided for @noExamsFound.
  ///
  /// In fr, this message translates to:
  /// **'Aucun examen trouvé'**
  String get noExamsFound;

  /// No description provided for @rewardsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mes Récompenses ⭐'**
  String get rewardsTitle;

  /// No description provided for @myBadges.
  ///
  /// In fr, this message translates to:
  /// **'Mes Badges'**
  String get myBadges;

  /// No description provided for @weeklyChallenges.
  ///
  /// In fr, this message translates to:
  /// **'Défis de la Semaine'**
  String get weeklyChallenges;

  /// No description provided for @leaderboard.
  ///
  /// In fr, this message translates to:
  /// **'Classement'**
  String get leaderboard;

  /// No description provided for @noChallengesThisWeek.
  ///
  /// In fr, this message translates to:
  /// **'Pas de défi cette semaine'**
  String get noChallengesThisWeek;

  /// No description provided for @leaderboardUnavailable.
  ///
  /// In fr, this message translates to:
  /// **'Classement non disponible'**
  String get leaderboardUnavailable;

  /// No description provided for @congratulations.
  ///
  /// In fr, this message translates to:
  /// **'Félicitations ! 🎉'**
  String get congratulations;

  /// No description provided for @badgeEarned.
  ///
  /// In fr, this message translates to:
  /// **'Tu as gagné le badge\n\"{badgeName}\"'**
  String badgeEarned(String badgeName);

  /// No description provided for @badgesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mes Badges 🏅'**
  String get badgesTitle;

  /// No description provided for @earnedBadges.
  ///
  /// In fr, this message translates to:
  /// **'Badges gagnés ({count})'**
  String earnedBadges(int count);

  /// No description provided for @lockedBadges.
  ///
  /// In fr, this message translates to:
  /// **'Badges à débloquer ({count})'**
  String lockedBadges(int count);

  /// No description provided for @noBadgesAvailable.
  ///
  /// In fr, this message translates to:
  /// **'Aucun badge disponible pour le moment'**
  String get noBadgesAvailable;

  /// No description provided for @leaderboardTitle.
  ///
  /// In fr, this message translates to:
  /// **'Classement 🏆'**
  String get leaderboardTitle;

  /// No description provided for @pointsUnit.
  ///
  /// In fr, this message translates to:
  /// **' pts'**
  String get pointsUnit;

  /// No description provided for @challengesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Défis 🎯'**
  String get challengesTitle;

  /// No description provided for @comeBackSoon.
  ///
  /// In fr, this message translates to:
  /// **'Reviens bientôt !'**
  String get comeBackSoon;

  /// No description provided for @childGradesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Notes de mon enfant'**
  String get childGradesTitle;

  /// No description provided for @columnSubject.
  ///
  /// In fr, this message translates to:
  /// **'Matière'**
  String get columnSubject;

  /// No description provided for @columnType.
  ///
  /// In fr, this message translates to:
  /// **'Type'**
  String get columnType;

  /// No description provided for @columnGrade.
  ///
  /// In fr, this message translates to:
  /// **'Note'**
  String get columnGrade;

  /// No description provided for @columnAvg.
  ///
  /// In fr, this message translates to:
  /// **'Moy'**
  String get columnAvg;

  /// No description provided for @overallAverage.
  ///
  /// In fr, this message translates to:
  /// **'Moyenne Générale: {value} / 20'**
  String overallAverage(String value);

  /// No description provided for @childAttendanceTitle.
  ///
  /// In fr, this message translates to:
  /// **'Présences de mon enfant'**
  String get childAttendanceTitle;

  /// No description provided for @monthJan.
  ///
  /// In fr, this message translates to:
  /// **'Janvier'**
  String get monthJan;

  /// No description provided for @monthFeb.
  ///
  /// In fr, this message translates to:
  /// **'Février'**
  String get monthFeb;

  /// No description provided for @monthMar.
  ///
  /// In fr, this message translates to:
  /// **'Mars'**
  String get monthMar;

  /// No description provided for @monthApr.
  ///
  /// In fr, this message translates to:
  /// **'Avril'**
  String get monthApr;

  /// No description provided for @monthMay.
  ///
  /// In fr, this message translates to:
  /// **'Mai'**
  String get monthMay;

  /// No description provided for @monthJun.
  ///
  /// In fr, this message translates to:
  /// **'Juin'**
  String get monthJun;

  /// No description provided for @monthJul.
  ///
  /// In fr, this message translates to:
  /// **'Juillet'**
  String get monthJul;

  /// No description provided for @monthAug.
  ///
  /// In fr, this message translates to:
  /// **'Août'**
  String get monthAug;

  /// No description provided for @monthSep.
  ///
  /// In fr, this message translates to:
  /// **'Septembre'**
  String get monthSep;

  /// No description provided for @monthOct.
  ///
  /// In fr, this message translates to:
  /// **'Octobre'**
  String get monthOct;

  /// No description provided for @monthNov.
  ///
  /// In fr, this message translates to:
  /// **'Novembre'**
  String get monthNov;

  /// No description provided for @monthDec.
  ///
  /// In fr, this message translates to:
  /// **'Décembre'**
  String get monthDec;

  /// No description provided for @attendancePresent.
  ///
  /// In fr, this message translates to:
  /// **'Présences'**
  String get attendancePresent;

  /// No description provided for @attendanceAbsent.
  ///
  /// In fr, this message translates to:
  /// **'Absences'**
  String get attendanceAbsent;

  /// No description provided for @attendanceLate.
  ///
  /// In fr, this message translates to:
  /// **'Retards'**
  String get attendanceLate;

  /// No description provided for @attendanceRate.
  ///
  /// In fr, this message translates to:
  /// **'Taux'**
  String get attendanceRate;

  /// No description provided for @statusPresent.
  ///
  /// In fr, this message translates to:
  /// **'Présent'**
  String get statusPresent;

  /// No description provided for @statusAbsent.
  ///
  /// In fr, this message translates to:
  /// **'Absent'**
  String get statusAbsent;

  /// No description provided for @statusLate.
  ///
  /// In fr, this message translates to:
  /// **'Retard'**
  String get statusLate;

  /// No description provided for @statusNA.
  ///
  /// In fr, this message translates to:
  /// **'N/A'**
  String get statusNA;

  /// No description provided for @canteenParentTitle.
  ///
  /// In fr, this message translates to:
  /// **'Cantine'**
  String get canteenParentTitle;

  /// No description provided for @periodWeek.
  ///
  /// In fr, this message translates to:
  /// **'Semaine'**
  String get periodWeek;

  /// No description provided for @periodMonth.
  ///
  /// In fr, this message translates to:
  /// **'Mois'**
  String get periodMonth;

  /// No description provided for @periodTrimester.
  ///
  /// In fr, this message translates to:
  /// **'Trimestre'**
  String get periodTrimester;

  /// No description provided for @mealStarter.
  ///
  /// In fr, this message translates to:
  /// **'🥗 Entrée'**
  String get mealStarter;

  /// No description provided for @mealMain.
  ///
  /// In fr, this message translates to:
  /// **'🍖 Plat principal'**
  String get mealMain;

  /// No description provided for @mealSide.
  ///
  /// In fr, this message translates to:
  /// **'🥕 Accompagnement'**
  String get mealSide;

  /// No description provided for @mealDessert.
  ///
  /// In fr, this message translates to:
  /// **'🍰 Dessert'**
  String get mealDessert;

  /// No description provided for @allergenLabel.
  ///
  /// In fr, this message translates to:
  /// **'Allergènes : {list}'**
  String allergenLabel(String list);

  /// No description provided for @diabeticLabel.
  ///
  /// In fr, this message translates to:
  /// **'Diabétique ✓'**
  String get diabeticLabel;

  /// No description provided for @celiacLabel.
  ///
  /// In fr, this message translates to:
  /// **'Cœliaque ✓'**
  String get celiacLabel;

  /// No description provided for @schoolTransportTitle.
  ///
  /// In fr, this message translates to:
  /// **'Transport scolaire'**
  String get schoolTransportTitle;

  /// No description provided for @busEnRoute.
  ///
  /// In fr, this message translates to:
  /// **'Bus en route — {lineName}'**
  String busEnRoute(String lineName);

  /// No description provided for @speed.
  ///
  /// In fr, this message translates to:
  /// **'Vitesse : {value} km/h'**
  String speed(String value);

  /// No description provided for @noTransportInfo.
  ///
  /// In fr, this message translates to:
  /// **'Aucune info transport disponible'**
  String get noTransportInfo;

  /// No description provided for @callDriver.
  ///
  /// In fr, this message translates to:
  /// **'Appeler'**
  String get callDriver;

  /// No description provided for @financeTitle.
  ///
  /// In fr, this message translates to:
  /// **'Finances & Paiements'**
  String get financeTitle;

  /// No description provided for @financeSummary.
  ///
  /// In fr, this message translates to:
  /// **'Résumé financier'**
  String get financeSummary;

  /// No description provided for @totalFees.
  ///
  /// In fr, this message translates to:
  /// **'Total frais'**
  String get totalFees;

  /// No description provided for @paid.
  ///
  /// In fr, this message translates to:
  /// **'Payé'**
  String get paid;

  /// No description provided for @remaining.
  ///
  /// In fr, this message translates to:
  /// **'Restant'**
  String get remaining;

  /// No description provided for @rate.
  ///
  /// In fr, this message translates to:
  /// **'Taux'**
  String get rate;

  /// No description provided for @currencyDA.
  ///
  /// In fr, this message translates to:
  /// **' DA'**
  String get currencyDA;

  /// No description provided for @absenceJustTitle.
  ///
  /// In fr, this message translates to:
  /// **'Justification d\'absences'**
  String get absenceJustTitle;

  /// No description provided for @submitTab.
  ///
  /// In fr, this message translates to:
  /// **'Soumettre'**
  String get submitTab;

  /// No description provided for @trackingTab.
  ///
  /// In fr, this message translates to:
  /// **'Suivi'**
  String get trackingTab;

  /// No description provided for @noAbsenceToJustify.
  ///
  /// In fr, this message translates to:
  /// **'Aucune absence à justifier'**
  String get noAbsenceToJustify;

  /// No description provided for @noJustificationSubmitted.
  ///
  /// In fr, this message translates to:
  /// **'Aucune justification soumise'**
  String get noJustificationSubmitted;

  /// No description provided for @statusApproved.
  ///
  /// In fr, this message translates to:
  /// **'Approuvée'**
  String get statusApproved;

  /// No description provided for @statusRejected.
  ///
  /// In fr, this message translates to:
  /// **'Rejetée'**
  String get statusRejected;

  /// No description provided for @statusPending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get statusPending;

  /// No description provided for @justify.
  ///
  /// In fr, this message translates to:
  /// **'Justifier'**
  String get justify;

  /// No description provided for @preferencesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Préférences'**
  String get preferencesTitle;

  /// No description provided for @notificationsSection.
  ///
  /// In fr, this message translates to:
  /// **'Notifications'**
  String get notificationsSection;

  /// No description provided for @silentModeSection.
  ///
  /// In fr, this message translates to:
  /// **'Mode silencieux'**
  String get silentModeSection;

  /// No description provided for @languageSection.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get languageSection;

  /// No description provided for @appearanceSection.
  ///
  /// In fr, this message translates to:
  /// **'Apparence'**
  String get appearanceSection;

  /// No description provided for @notifGrades.
  ///
  /// In fr, this message translates to:
  /// **'Notes & Bulletins'**
  String get notifGrades;

  /// No description provided for @notifAttendance.
  ///
  /// In fr, this message translates to:
  /// **'Présence & Absences'**
  String get notifAttendance;

  /// No description provided for @notifHomework.
  ///
  /// In fr, this message translates to:
  /// **'Devoirs'**
  String get notifHomework;

  /// No description provided for @notifCanteen.
  ///
  /// In fr, this message translates to:
  /// **'Cantine'**
  String get notifCanteen;

  /// No description provided for @notifTransport.
  ///
  /// In fr, this message translates to:
  /// **'Transport'**
  String get notifTransport;

  /// No description provided for @notifAnnouncements.
  ///
  /// In fr, this message translates to:
  /// **'Annonces'**
  String get notifAnnouncements;

  /// No description provided for @notifFinance.
  ///
  /// In fr, this message translates to:
  /// **'Finance'**
  String get notifFinance;

  /// No description provided for @enableSilentMode.
  ///
  /// In fr, this message translates to:
  /// **'Activer le mode silencieux'**
  String get enableSilentMode;

  /// No description provided for @silentModeDesc.
  ///
  /// In fr, this message translates to:
  /// **'Pas de notifications pendant la plage horaire'**
  String get silentModeDesc;

  /// No description provided for @silentStart.
  ///
  /// In fr, this message translates to:
  /// **'Début'**
  String get silentStart;

  /// No description provided for @silentEnd.
  ///
  /// In fr, this message translates to:
  /// **'Fin'**
  String get silentEnd;

  /// No description provided for @languageFr.
  ///
  /// In fr, this message translates to:
  /// **'Français'**
  String get languageFr;

  /// No description provided for @languageAr.
  ///
  /// In fr, this message translates to:
  /// **'العربية'**
  String get languageAr;

  /// No description provided for @darkMode.
  ///
  /// In fr, this message translates to:
  /// **'Mode sombre'**
  String get darkMode;

  /// No description provided for @darkModeDesc.
  ///
  /// In fr, this message translates to:
  /// **'Adapter l\'affichage pour la nuit'**
  String get darkModeDesc;

  /// No description provided for @teacherAppTitle.
  ///
  /// In fr, this message translates to:
  /// **'ILMI — Enseignant'**
  String get teacherAppTitle;

  /// No description provided for @attendanceMarkingTitle.
  ///
  /// In fr, this message translates to:
  /// **'Appel — Présences'**
  String get attendanceMarkingTitle;

  /// No description provided for @validate.
  ///
  /// In fr, this message translates to:
  /// **'Valider'**
  String get validate;

  /// No description provided for @classLabel.
  ///
  /// In fr, this message translates to:
  /// **'Classe'**
  String get classLabel;

  /// No description provided for @selectClass.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez une classe'**
  String get selectClass;

  /// No description provided for @noStudentsFound.
  ///
  /// In fr, this message translates to:
  /// **'Aucun élève trouvé'**
  String get noStudentsFound;

  /// No description provided for @attendanceSaved.
  ///
  /// In fr, this message translates to:
  /// **'Appel enregistré avec succès'**
  String get attendanceSaved;

  /// No description provided for @errorMessage.
  ///
  /// In fr, this message translates to:
  /// **'Erreur: {message}'**
  String errorMessage(String message);

  /// No description provided for @gradeEntryTitle.
  ///
  /// In fr, this message translates to:
  /// **'Saisie des notes'**
  String get gradeEntryTitle;

  /// No description provided for @save.
  ///
  /// In fr, this message translates to:
  /// **'Enregistrer'**
  String get save;

  /// No description provided for @subjectLabel.
  ///
  /// In fr, this message translates to:
  /// **'Matière'**
  String get subjectLabel;

  /// No description provided for @examTypeLabel.
  ///
  /// In fr, this message translates to:
  /// **'Type d\'examen'**
  String get examTypeLabel;

  /// No description provided for @gradeEntryHint.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez une classe, une matière et un type d\'examen'**
  String get gradeEntryHint;

  /// No description provided for @hwManagementTitle.
  ///
  /// In fr, this message translates to:
  /// **'Devoirs & Exercises'**
  String get hwManagementTitle;

  /// No description provided for @myHomeworkTab.
  ///
  /// In fr, this message translates to:
  /// **'Mes devoirs'**
  String get myHomeworkTab;

  /// No description provided for @submissionsTab.
  ///
  /// In fr, this message translates to:
  /// **'Soumissions'**
  String get submissionsTab;

  /// No description provided for @statsTab.
  ///
  /// In fr, this message translates to:
  /// **'Stats'**
  String get statsTab;

  /// No description provided for @calendarTab.
  ///
  /// In fr, this message translates to:
  /// **'Calendrier'**
  String get calendarTab;

  /// No description provided for @newHomework.
  ///
  /// In fr, this message translates to:
  /// **'Nouveau devoir'**
  String get newHomework;

  /// No description provided for @noHomework.
  ///
  /// In fr, this message translates to:
  /// **'Aucun devoir'**
  String get noHomework;

  /// No description provided for @profileTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mon Profil'**
  String get profileTitle;

  /// No description provided for @email.
  ///
  /// In fr, this message translates to:
  /// **'E-mail'**
  String get email;

  /// No description provided for @phone.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get phone;

  /// No description provided for @school.
  ///
  /// In fr, this message translates to:
  /// **'École'**
  String get school;

  /// No description provided for @language.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get language;

  /// No description provided for @changePassword.
  ///
  /// In fr, this message translates to:
  /// **'Changer le mot de passe'**
  String get changePassword;

  /// No description provided for @about.
  ///
  /// In fr, this message translates to:
  /// **'À propos'**
  String get about;

  /// No description provided for @logout.
  ///
  /// In fr, this message translates to:
  /// **'Déconnexion'**
  String get logout;

  /// No description provided for @changePasswordSoon.
  ///
  /// In fr, this message translates to:
  /// **'Changement de mot de passe à venir'**
  String get changePasswordSoon;

  /// No description provided for @messagesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Messages'**
  String get messagesTitle;

  /// No description provided for @noConversations.
  ///
  /// In fr, this message translates to:
  /// **'Aucune conversation'**
  String get noConversations;

  /// No description provided for @noLastMessage.
  ///
  /// In fr, this message translates to:
  /// **'Pas de message'**
  String get noLastMessage;

  /// No description provided for @conversationTitle.
  ///
  /// In fr, this message translates to:
  /// **'Conversation'**
  String get conversationTitle;

  /// No description provided for @noMessages.
  ///
  /// In fr, this message translates to:
  /// **'Aucun message'**
  String get noMessages;

  /// No description provided for @announcementsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Annonces'**
  String get announcementsTitle;

  /// No description provided for @noAnnouncementsYet.
  ///
  /// In fr, this message translates to:
  /// **'Aucune annonce pour le moment'**
  String get noAnnouncementsYet;

  /// No description provided for @notificationsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @markAllRead.
  ///
  /// In fr, this message translates to:
  /// **'Tout marquer lu'**
  String get markAllRead;

  /// No description provided for @noNotificationsYet.
  ///
  /// In fr, this message translates to:
  /// **'Aucune notification pour le moment'**
  String get noNotificationsYet;

  /// No description provided for @edubot.
  ///
  /// In fr, this message translates to:
  /// **'EduBot'**
  String get edubot;

  /// No description provided for @newConversation.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle conversation'**
  String get newConversation;

  /// No description provided for @edubotThinking.
  ///
  /// In fr, this message translates to:
  /// **'EduBot réfléchit...'**
  String get edubotThinking;

  /// No description provided for @daySunday.
  ///
  /// In fr, this message translates to:
  /// **'Dimanche'**
  String get daySunday;

  /// No description provided for @dayMonday.
  ///
  /// In fr, this message translates to:
  /// **'Lundi'**
  String get dayMonday;

  /// No description provided for @dayTuesday.
  ///
  /// In fr, this message translates to:
  /// **'Mardi'**
  String get dayTuesday;

  /// No description provided for @dayWednesday.
  ///
  /// In fr, this message translates to:
  /// **'Mercredi'**
  String get dayWednesday;

  /// No description provided for @dayThursday.
  ///
  /// In fr, this message translates to:
  /// **'Jeudi'**
  String get dayThursday;

  /// No description provided for @trainerGroups.
  ///
  /// In fr, this message translates to:
  /// **'Mes groupes'**
  String get trainerGroups;

  /// No description provided for @trainerSessions.
  ///
  /// In fr, this message translates to:
  /// **'Séances'**
  String get trainerSessions;

  /// No description provided for @trainerMessages.
  ///
  /// In fr, this message translates to:
  /// **'Messages'**
  String get trainerMessages;

  /// No description provided for @unmarkedSessions.
  ///
  /// In fr, this message translates to:
  /// **'{count} séance(s) non marquée(s)'**
  String unmarkedSessions(int count);

  /// No description provided for @attendanceToRecord.
  ///
  /// In fr, this message translates to:
  /// **'Présence à enregistrer'**
  String get attendanceToRecord;

  /// No description provided for @todaySessions.
  ///
  /// In fr, this message translates to:
  /// **'Séances du jour'**
  String get todaySessions;

  /// No description provided for @myGroups.
  ///
  /// In fr, this message translates to:
  /// **'Mes groupes'**
  String get myGroups;

  /// No description provided for @traineeTrainings.
  ///
  /// In fr, this message translates to:
  /// **'Formations'**
  String get traineeTrainings;

  /// No description provided for @traineeAttendance.
  ///
  /// In fr, this message translates to:
  /// **'Présence'**
  String get traineeAttendance;

  /// No description provided for @traineePayments.
  ///
  /// In fr, this message translates to:
  /// **'Paiements'**
  String get traineePayments;

  /// No description provided for @nextSession.
  ///
  /// In fr, this message translates to:
  /// **'Prochaine séance'**
  String get nextSession;

  /// No description provided for @myTrainings.
  ///
  /// In fr, this message translates to:
  /// **'Mes formations'**
  String get myTrainings;

  /// No description provided for @pendingPayments.
  ///
  /// In fr, this message translates to:
  /// **'{count} paiement(s) en attente'**
  String pendingPayments(int count);

  /// No description provided for @infirmaryTitle.
  ///
  /// In fr, this message translates to:
  /// **'Messages infirmerie'**
  String get infirmaryTitle;

  /// No description provided for @medicalSummary.
  ///
  /// In fr, this message translates to:
  /// **'Résumé médical'**
  String get medicalSummary;
}

class _SDelegate extends LocalizationsDelegate<S> {
  const _SDelegate();

  @override
  Future<S> load(Locale locale) {
    return SynchronousFuture<S>(lookupS(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_SDelegate old) => false;
}

S lookupS(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return SAr();
    case 'fr':
      return SFr();
  }

  throw FlutterError(
    'S.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
