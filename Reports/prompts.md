# ILMI — Prompts de Développement Complets
### Roadmap de développement ordonnée de A à Z · Toutes les fonctionnalités manquantes

---

## État Actuel du Projet (Résumé de l'Analyse)

### Backend (Django)
- 17 apps Django existantes : academics, accounts, ai_chatbot, announcements, attendance, canteen, chat, discipline, extracurricular, finance, fingerprint, grades, homework, library, notifications, schools, transport
- ~78 modèles, ~218 endpoints API, ~14 tâches Celery, 3 consumers WebSocket
- Multi-tenant avec TenantModel + TenantMiddleware
- **Manquant** : App Infirmerie, système d'abonnement par modules (SchoolSubscription, ModuleActivationLog, SubscriptionInvoice), décorateur `require_module`, Super Admin endpoints avancés (impersonation, facturation, analytics globales), catégorie "Centre de Formation" (TRAINING_CENTER logic), système de notifications SMS, e-learning/quiz en ligne

### Frontend Admin (React + Ant Design)
- 28 pages implémentées : Dashboard, Login, Setup Wizard (9 étapes), Students, Teachers, Grades, Attendance, Homework, Financial, Announcements, Messaging, Notifications, Timetable, Analytics, Settings, Users, Schools, Super Admin (Dashboard + Analytics + Plans + ActivityLogs + SystemHealth + PlatformSettings)
- **Manquant** : Pages Cantine, Transport, Bibliothèque, Infirmerie, Empreintes, E-Learning/Auto-Éducation, SMS, Module Disciplinaire complet, Gestion des Abonnements/Modules par école, Facturation/Invoices, Impersonation, Personnel administratif, Centre de Formation (terminologie/UI adaptée), Superviseur Général (vue lecture seule), Finance Manager / Librarian / Nurse / Canteen Manager / Transport Manager interfaces, Emploi du temps drag-and-drop structuré

### Mobile Flutter
- Architecture Clean + BLoC, 67 fichiers Dart
- Auth (login + PIN), Student (6 screens dont 4 placeholders), Teacher (4 screens avec données hardcodées), Parent (3 screens avec données hardcodées), Shared (6 screens dont 3 placeholders)
- **Manquant** : Rôle Driver (chauffeur), Rôle Trainer (formateur), Rôle Trainee (apprenant), Sélecteur de contexte multi-rôles, Dashboards réels (tous sont des placeholders), Connexion des screens aux BLoCs/APIs au lieu de données hardcodées, Chat temps réel fonctionnel, Notifications fonctionnelles, Annonces fonctionnelles, Finance/Paiements (parent), Cantine, Transport, Bibliothèque, Infirmerie (dossier médical parent), E-Learning, Carte d'identité QR dynamique, Gamification élève, Emploi du temps unifié multi-contexte, Mode hors ligne complet, Cahier de texte enseignant, Fiche de paie enseignant
