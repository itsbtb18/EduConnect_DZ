# 📚 ILMI — Plateforme de Gestion Scolaire & E-Learning
### Conçue pour les écoles privées algériennes

> **SaaS Multi-Tenant · Django · React · Flutter · PostgreSQL · Redis · Celery**  
> Version 3.0 — 2026 | Statut : Phase Foundation

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Architecture Multi-Tenant SaaS](#2-architecture-multi-tenant-saas)
3. [Les Cinq Applications](#3-les-cinq-applications)
4. [Système Éducatif Algérien](#4-système-éducatif-algérien)
5. [Rôles & Hiérarchie](#5-rôles--hiérarchie)
6. [Structure du Projet](#6-structure-du-projet)
7. [Démarrage Rapide](#7-démarrage-rapide)
8. [Stack Technologique](#8-stack-technologique)
9. [Modules & Fonctionnalités](#9-modules--fonctionnalités)
   - [9.1 Panneau Admin Web](#91-panneau-admin-web)
   - [9.2 Gestion Pédagogique](#92-gestion-pédagogique)
   - [9.3 Gestion Financière](#93-gestion-financière)
   - [9.4 Cantine Scolaire](#94-cantine-scolaire)
   - [9.5 Transport Scolaire](#95-transport-scolaire)
   - [9.6 Activités Extrascolaires](#96-activités-extrascolaires)
   - [9.7 Bibliothèque Scolaire](#97-bibliothèque-scolaire)
   - [9.8 Empreintes Digitales](#98-empreintes-digitales)
   - [9.9 Messagerie & Chat](#99-messagerie--chat)
   - [9.10 Application Enseignant](#910-application-enseignant)
   - [9.11 Application Élève](#911-application-élève)
   - [9.12 Application Parents](#912-application-parents)
10. [Schéma de Base de Données](#10-schéma-de-base-de-données)
11. [API Reference](#11-api-reference)
12. [Authentification & Sécurité](#12-authentification--sécurité)
13. [Notifications](#13-notifications)
14. [Chatbot IA (RAG)](#14-chatbot-ia-rag)
15. [Génération de Rapports & PDF](#15-génération-de-rapports--pdf)
16. [Mode Hors Ligne](#16-mode-hors-ligne)
17. [Conformité Légale Algérienne](#17-conformité-légale-algérienne)
18. [Plan de Développement & Prompts](#18-plan-de-développement--prompts)
19. [Tests & Qualité](#19-tests--qualité)
20. [Déploiement & Infrastructure](#20-déploiement--infrastructure)
21. [Modèle Commercial & Tarification](#21-modèle-commercial--tarification)
22. [Variables d'Environnement](#22-variables-denvironnement)
23. [Glossaire](#23-glossaire)

---

## 1. Résumé Exécutif

**ILMI** est une plateforme SaaS multi-tenant de gestion scolaire et d'e-learning conçue spécifiquement pour les écoles privées primaires, moyennes et secondaires en Algérie. Elle comble un vide critique : communication fragmentée, travail administratif manuel, et absence totale d'infrastructure numérique reliant l'administration, les enseignants, les parents et les élèves.

### Problèmes résolus

| Problème actuel | Solution ILMI |
|---|---|
| Notes communiquées par papier ou WhatsApp | Saisie, validation et publication numérique des notes |
| Devoirs perdus ou oubliés | Posts de devoirs avec notifications push et dates d'échéance |
| Parents sans visibilité sur la scolarité | Application parent avec tableau de bord académique complet |
| Administration noyée dans la paperasse | Génération de bulletins en un clic, suivi des présences automatisé |
| Aucune communication enseignant-parent structurée | Canaux de chat privés dédiés par élève |
| Connaissances scolaires dispersées | Chatbot IA (RAG) répondant à toute question |
| Aucune analyse de performance pour les directeurs | Analytics avancées, détection des risques, alertes prédictives |
| Suivi manuel des frais, reçus papier | Suivi des paiements numérique, génération de reçus PDF |

---

## 2. Architecture Multi-Tenant SaaS

> **Décision architecturale la plus importante du projet.** Un seul déploiement sert toutes les écoles. Chaque école est un tenant isolé à l'intérieur du même système.

### Concept Central

```
Vous déployez UNE FOIS :
  - 1 Backend (Django API)
  - 1 Base de données (PostgreSQL)
  - 1 Panneau Admin (React)
  - 1 Application Mobile (Flutter — publiée une fois sur Play Store & App Store)

Chaque école souscrit → création d'un enregistrement School → accès immédiat.
Pas de nouveaux serveurs. Pas de redéploiement. Pas de nouvelles bases de données.
```

### Isolation des Données

Chaque table contient une colonne `school_id`. Le backend Django filtre automatiquement chaque requête par l'`school_id` de l'utilisateur authentifié via JWT.

```python
class TenantAwareViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'SUPER_ADMIN':
            return qs
        return qs.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
```

Une école ne peut **jamais** voir les données d'une autre école.

### Plans & Feature Flags

```python
if school.subscription_plan == 'PRO_AI':
    enable_ai_chatbot()
elif school.subscription_plan == 'PRO':
    enable_premium_content()
else:  # STARTER
    basic_features_only()
```

---

## 3. Les Cinq Applications

| Application | Utilisateurs | Plateforme | Rôle Principal |
|---|---|---|---|
| **Panneau Admin Web** | Directeurs, secrétaires, comptables, superviseurs, bibliothécaires, finance | React (Web) | Gestion complète de l'école |
| **Super Admin Panel** | Propriétaire de la plateforme | React (Web) | Gestion SaaS multi-écoles, facturation, support |
| **Application Enseignant** | Tous les enseignants | Flutter (Mobile) | Classes, devoirs, notes, messagerie |
| **Application Parent** | Parents / tuteurs | Flutter (Mobile) | Suivi des enfants, communication, chatbot |
| **Application Élève** | Tous les élèves (5–18 ans) | Flutter (Mobile) | Consultation ressources, devoirs, notes |

```
┌────────────────────────────────────────────────────────────┐
│                         ILMI                               │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Admin   │  │Enseignant│  │  Parent  │  │  Élève   │  │
│  │Web Panel │  │ Mobile   │  │  Mobile  │  │  Mobile  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                            │
│              ┌──────────────────┐                          │
│              │   Super Admin    │                          │
│              │  Panel (Owner)   │                          │
│              └──────────────────┘                          │
│                                                            │
│           Backend Django REST API Partagé                  │
│         WebSocket (Channels) · Celery · Redis              │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Système Éducatif Algérien

La plateforme est construite autour de la structure officielle du Ministère de l'Éducation Nationale algérien.

### Niveaux d'Enseignement

#### École Primaire (6 ans)

| Année | Nom | Échelle | Seuil | Examen |
|---|---|---|---|---|
| Année 0 | Préparatoire (CP1) | /10 | 5/10 | — |
| Année 1–4 | 1AP → 4AP | /10 | 5/10 | — |
| Année 5 | 5AP | /10 | 5/10 | **BEP** |

#### CEM — Collège d'Enseignement Moyen (4 ans)

| Année | Nom | Échelle | Seuil | Examen |
|---|---|---|---|---|
| Année 1–3 | 1AM → 3AM | /20 | 10/20 | — |
| Année 4 | 4AM | /20 | 10/20 | **BEM** |

#### Lycée (3 ans)

| Année | Nom | Échelle | Seuil | Examen |
|---|---|---|---|---|
| Année 1 | 1AS (Tronc commun) | /20 | 10/20 | — |
| Année 2–3 | 2AS → 3AS (Spécialisé) | /20 | 10/20 | **BAC** |

**Filières lycée (2AS & 3AS) :** Sciences · Mathématiques · Mathématiques Techniques · Lettres & Philosophie · Langues Étrangères · Gestion & Économie

### Structure Trimestrielle

```
Septembre ──► Janvier     [Trimestre 1]
Février   ──► Avril       [Trimestre 2]
Avril     ──► Juin        [Trimestre 3]
```

Chaque trimestre comprend : Évaluation continue · Devoir 1 · Devoir 2 · Examen Final

**Pondération par défaut (configurable par école) :**

| Composant | Poids par défaut |
|---|---|
| Évaluation continue | 20% |
| Devoir 1 | 20% |
| Devoir 2 | 20% |
| Examen Final | 40% |

**Formule de calcul :**
```
Moyenne Trimestrielle = Σ(Note × Coefficient) ÷ Σ(Coefficients)
Moyenne Annuelle = (T1 + T2 + T3) ÷ 3
```

> ⚠️ Tous les poids et coefficients sont configurables par école et par niveau depuis le panneau admin.

---

## 5. Rôles & Hiérarchie

### Définition des Rôles

```
SUPER_ADMIN (Propriétaire Plateforme)
│   ├── Crée et gère tous les tenants School
│   ├── Gère facturation et abonnements
│   └── Peut usurper l'identité de tout admin école (support)

SCHOOL_ADMIN (Directeur / Secrétaire)
│   ├── Gère tout au sein de son école
│   ├── Crée comptes Enseignant, Parent, Élève
│   └── Plusieurs comptes admin possibles par école

GENERAL_SUPERVISOR (Superviseur Général)
│   ├── Vue globale sur toutes les sections
│   └── Rapports et statistiques multi-niveaux

FINANCE
│   ├── Gestion des frais de scolarité et salaires
│   └── Rapports financiers et fiches de paie

BIBLIOTHEQUAIRE
│   ├── Gestion du catalogue de la bibliothèque
│   └── Prêts, retours, alertes

SECTION_ADMIN (Optionnel — grandes écoles combinées)
│   ├── Admin limité à une section (ex. Primaire uniquement)
│   └── Ne peut pas voir les données des autres sections

TEACHER (Enseignant) → Application Mobile
PARENT (Parent/Tuteur) → Application Mobile
STUDENT (Élève) → Application Mobile
```

### Matrice de Permissions

| Action | Super Admin | School Admin | Supervisor | Finance | Biblio | Teacher | Parent | Student |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Créer tenant école | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer comptes enseignants | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer comptes élèves/parents | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Publier annonces | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Saisir les notes | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Publier les notes | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Poster devoirs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Gérer finances | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gérer bibliothèque | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Générer bulletins | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir notes (enfant) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Voir propres notes | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 6. Structure du Projet

```
ILMI/
├── backend/                        # Django 5.x REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── ilmi/
│   │   ├── settings/               # base / dev / prod
│   │   ├── urls.py
│   │   ├── asgi.py                 # WebSocket (Channels)
│   │   └── celery.py
│   ├── core/
│   │   ├── middleware/             # Tenant isolation
│   │   ├── permissions.py          # RBAC
│   │   ├── pagination.py
│   │   └── utils.py
│   └── apps/
│       ├── accounts/               # Utilisateurs, JWT, rôles
│       ├── schools/                # Tenants, années scolaires
│       ├── academics/              # Niveaux, classes, emplois du temps
│       ├── grades/                 # Notes, bulletins, workflow
│       ├── homework/               # Devoirs, soumissions
│       ├── attendance/             # Présences, absences, justifications
│       ├── announcements/          # Annonces, calendrier
│       ├── chat/                   # Messagerie temps réel (WebSocket)
│       ├── finance/                # Frais, salaires, paiements
│       ├── canteen/                # Cantine scolaire, menus
│       ├── transport/              # Lignes de bus, conducteurs
│       ├── library/                # Bibliothèque, emprunts
│       ├── extracurricular/        # Activités parascolaires
│       ├── discipline/             # Comportement, incidents
│       ├── fingerprint/            # Empreintes digitales
│       ├── notifications/          # Push (FCM), in-app
│       └── ai_chatbot/             # RAG chatbot (LangChain + Qdrant)
│
├── frontend/                       # React 18 + TypeScript (Admin Panel)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── api/
│   └── package.json
│
├── mobile/                         # Flutter 3.x (Teacher + Parent + Student)
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart
│       ├── core/                   # Thème, réseau, DI, stockage
│       ├── data/                   # Modèles, repositories, services API
│       └── features/
│           ├── auth/
│           ├── teacher/
│           ├── parent/
│           ├── student/
│           └── shared/             # Chat, notifications, annonces
│
├── docker-compose.yml
├── nginx/
├── .github/workflows/ci.yml
├── .env.example
└── README.md
```

---

## 7. Démarrage Rapide

### Prérequis

- Python 3.12+
- PostgreSQL 16+
- Redis 7+
- Flutter 3.29+
- Docker & Docker Compose (recommandé)
- Node.js 20+ (pour le panel admin React)

### Docker (Recommandé)

```bash
# 1. Cloner et configurer
cp .env.example .env
# Remplir .env avec vos valeurs

# 2. Démarrer tous les services
docker compose up -d

# 3. Migrations et superutilisateur
docker compose exec api python manage.py migrate
docker compose exec api python manage.py createsuperuser

# 4. API disponible sur http://localhost:8000/api/v1/
# 5. Docs API sur http://localhost:8000/api/docs/
```

### Développement Local

```bash
# --- Backend ---
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp ../.env.example ../.env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# --- Frontend Admin ---
cd frontend
npm install
npm run dev

# --- Mobile ---
cd mobile
flutter pub get
flutter run
```

### Tests

```bash
# Backend
cd backend
python manage.py test
# Avec couverture :
coverage run manage.py test && coverage report

# Mobile
cd mobile
flutter test
```

---

## 8. Stack Technologique

### Backend

| Technologie | Version | Usage |
|---|---|---|
| Python | 3.12+ | Langage |
| Django | 5.x | Framework principal |
| Django REST Framework | 3.15+ | API REST |
| Django Channels | 4.x | WebSocket / chat temps réel |
| Daphne | 4.x | Serveur ASGI |
| Celery | 5.x | Tâches asynchrones (PDF, SMS, push) |
| django-celery-beat | — | Planificateur de tâches périodiques |
| FastAPI | 0.115+ | Microservice chatbot IA |
| WeasyPrint | — | Génération PDF (bulletins, fiches de paie) |
| pyfcm | — | Firebase Cloud Messaging |
| django-storages | — | Stockage S3/R2 |
| Sentry SDK | — | Monitoring des erreurs |

### Bases de Données & Stockage

| Technologie | Usage |
|---|---|
| PostgreSQL 16 + pgvector | Base de données principale |
| Redis 7 | Cache, sessions, broker Celery, Channels |
| Qdrant | Base vectorielle pour le chatbot RAG |
| Elasticsearch | Recherche plein texte |
| AWS S3 / Cloudflare R2 | Stockage fichiers |

### IA / ML

| Technologie | Usage |
|---|---|
| Groq API (llama-3.3-70b) | LLM pour chatbot |
| paraphrase-multilingual-mpnet-base-v2 | Embeddings multilingues (Arabe, Français, Anglais) |
| LangChain | Orchestration pipeline RAG |

### Frontend Admin (React)

| Package | Usage |
|---|---|
| React 18 + TypeScript | Framework |
| Ant Design | Composants UI |
| Recharts | Graphiques académiques |
| React Query | Gestion état serveur |
| i18next | Multilingue (AR/FR/EN) + RTL |

### Mobile (Flutter)

| Package | Usage |
|---|---|
| flutter_bloc | Gestion d'état |
| dio | Client HTTP + intercepteur JWT |
| GoRouter | Navigation déclarative |
| hive + flutter_secure_storage | Stockage local sécurisé |
| firebase_messaging | Notifications push (FCM) |
| web_socket_channel | Chat temps réel |
| fl_chart | Graphiques de performance |
| easy_localization | AR / FR / EN + RTL |

### Infrastructure

| Technologie | Usage |
|---|---|
| Docker + Docker Compose | Conteneurisation |
| Nginx | Reverse proxy, SSL, fichiers statiques |
| GitHub Actions | Pipeline CI/CD |
| Firebase Cloud Messaging | Notifications push |
| Let's Encrypt | Certificats SSL gratuits |
| Hetzner / DigitalOcean | Hébergement cloud |

---

## 9. Modules & Fonctionnalités

---

### 9.1 Panneau Admin Web

#### Dashboard — Centre de Commande

- Statistiques en temps réel : total élèves par section, enseignants actifs, soumissions de notes en attente, messages non lus, événements à venir
- Panel d'alertes : élèves à risque (moyenne en dessous du seuil), absentéisme chronique
- Boutons d'action rapide : Poster annonce · Ajouter élève · Générer bulletins · Voir alertes présences
- Fil d'activité récente : 20 dernières actions avec piste d'audit complète (qui a fait quoi et quand)
- Widget calendrier académique : trimestre actuel, jours avant la prochaine période d'examen

#### Configuration École

- Modifier profil : nom, logo, adresse, contacts, devise
- Activer/désactiver sections (Primaire / CEM / Lycée)
- Configurer année scolaire : dates de début, fin, dates des trimestres
- Définir jours fériés et événements spéciaux
- Configurer pondérations de notes par section
- Configurer jours ouvrables et heures de cours

#### Gestion des Utilisateurs

**Enseignants :**
- Ajouter enseignant : nom, téléphone, email, section, matières et classes assignées
- Modifier profil et affectations
- Désactiver / réactiver le compte
- Voir notes soumises et journal d'activité
- Import en masse via Excel (CSV)

**Élèves & Parents :**
- Ajouter élève avec création automatique du compte parent
- Rechercher par nom, classe, section, ou identifiant élève
- Profil complet : informations personnelles, classe actuelle, historique complet des notes, présences, dossier disciplinaire
- Transférer élève vers une autre classe (avec raison et date enregistrées)
- Associer un second parent à un élève (père + mère avec comptes séparés)
- Désactiver élève en fin d'année → statut "diplômé" ou "transféré" dans les archives
- Import en masse via Excel (CSV)
- **Carte NFC virtuelle** : contient logo école, année d'inscription, classe, informations élève

#### Gestion des Classes & Matières

- Créer classes par section et année académique avec nom et niveau
- Assigner professeur principal à chaque classe
- Définir matières par classe avec coefficients
- Assigner un enseignant à chaque matière dans chaque classe
- Pour le Lycée : assigner filières de spécialisation aux classes 2AS et 3AS

#### Gestion des Notes (Workflow)

```
Enseignant saisit les notes (brouillon)
  → Enseignant soumet à l'admin
    → Admin révise
      → Admin publie
        → Visible instantanément pour l'élève et le parent
```

- Vue de toutes les soumissions en attente de tous les enseignants
- Filtrer par section, classe, matière, trimestre
- Notes soumises avec calcul automatique de la moyenne
- Ajouter commentaires ou notes de correction avant publication
- Publier en un clic (ou rejeter et renvoyer à l'enseignant avec note)
- Historique complet avec piste d'audit
- Publication en masse de toutes les notes d'un trimestre

#### Génération des Bulletins

- Bulletin PDF individuel en un clic
- Bulletins d'une classe entière (fichier ZIP)
- Bulletins de toute l'école (ZIP, traité par Celery en arrière-plan)
- Contenu : informations élève, photo, classe, toutes les matières avec notes et coefficients, moyenne trimestrielle, moyenne annuelle, rang de classe, commentaires enseignant, champ signature directeur
- Design personnalisable par école (logo, couleurs, texte de pied de page)
- **Envoi automatique aux parents** en option

#### Gestion des Présences

- Tableau de bord temps réel : résumé des absences quotidiennes par classe
- Marquage par les enseignants depuis leur appli ; admin voit en temps réel
- Workflow de justification : parent soumet excuse → admin approuve/rejette
- Rapports mensuels et annuels par élève
- Seuil d'alerte configurable (ex. : alerte si élève manque 3+ jours par semaine)
- Notification push automatique au parent quand l'enfant est marqué absent
- **Alerte d'entrée en école** : notification au parent dès que l'élève est marqué présent en première session de la journée

#### Système d'Annonces

- Éditeur de texte enrichi avec images, pièces jointes, liens
- Sélection du public cible : tous · parents · élèves · enseignants · section spécifique · classe spécifique · personnes spécifiques
- Planifier des annonces pour publication future
- Épingler les annonces importantes en haut du fil
- Suivi du nombre d'utilisateurs ayant vu chaque annonce (accusés de lecture)

#### Emplois du Temps

- Interface glisser-déposer
- Définir créneaux horaires (jours, heures)
- Assigner enseignant + matière + classe + salle à chaque créneau
- **Détection de conflits en temps réel** : alerte si un enseignant est double-réservé
- Détection de conflits de salle
- Configuration de disponibilité des enseignants
- Export PDF de tout emploi du temps (pour affichage en classe)
- Notification push aux élèves lors de modification d'emploi du temps
- Publication d'emploi du temps par classe (visible aux élèves et parents)
- Publication d'emploi du temps par enseignant

#### Analytics Avancées

- Moyenne par matière dans toutes les classes
- Taux de réussite/échec par classe et par section
- Comparaison de performance entre classes de même niveau
- Top 10 élèves par niveau et par section
- Analytics de performance des enseignants : moyennes de classe par enseignant (interne admin uniquement)
- Taux de soumission de présences par enseignant
- **Détection automatique des élèves à risque** : en dessous de 8/20 (ou 4/10 pour le Primaire)
- **Alertes prédictives** : prédiction de la moyenne fin d'année, alerte si trajectoire négative
- **Comparateur classes/périodes** : graphiques barres, camemberts, courbes
- Export Excel des rapports par trimestre

#### Chats Admin

- L'admin peut créer une conversation avec n'importe qui (autre admin, parent, élève, enseignant)
- Envoi de messages et fichiers
- Création de groupes

---

### 9.2 Gestion Pédagogique

#### Gestion Complète des Élèves

- Gestion des cycles : préscolaire, primaire, moyen, secondaire
- Inscriptions, mises à jour, transferts, changements de groupes, abandon
- Impression des cartes élèves (physiques et numériques)
- Gestion des parents : base de données et mise à jour des informations personnelles
- Gestion des classes et groupes : édition et impression des listes avec désignation des responsables et délégués

#### Suivi & Communication

- Suivi des présences : enregistrement et suivi précis des retards et absences
- Plateforme de communication : messagerie avancée avec accusés de lecture
- **Suivi comportemental** : gestion des comportements, système de récompenses
- Transferts internes : gestion des changements entre classes, filières et niveaux

#### Gestion des Examens

- Organisation des examens : planning, surveillance et répartition des groupes
- Gestion des notes : saisie, calcul automatique des moyennes, impression de bulletins variés
- Gestion des devoirs : planification et suivi des devoirs à domicile
- Système de notifications : rappels des devoirs, événements, communications importantes

#### Module Disciplinaire

```python
class DisciplineRecord(Model):
    SEVERITY = [('GOOD', 'Bon comportement'), ('WARNING', 'Avertissement'), ('SERIOUS', 'Grave')]
    student = ForeignKey(StudentProfile)
    filed_by = ForeignKey(User)        # Enseignant ou Admin
    date = DateField()
    severity = CharField(choices=SEVERITY)
    description = TextField()
    resolution_note = TextField(blank=True)
    parent_notified = BooleanField(default=False)
```

- Rapport d'incident par enseignant ou admin
- Notification parent pour tout avertissement ou incident grave
- Système d'avertissements cumulatifs : alerte automatique à X avertissements par trimestre
- Historique disciplinaire complet par élève (accessible admin uniquement)
- Dossier disciplinaire imprimable (PDF) pour réunions parents
- Note de conduite optionnelle dans le bulletin

#### Rapports Sanitaires & Sociaux

- Suivi des cas médicaux et sociaux des élèves
- Signalement et suivi d'élèves nécessitant une attention particulière
- Rapports périodiques sur la santé scolaire

---

### 9.3 Gestion Financière

#### Salaires du Personnel

- Détermination des salaires du personnel administratif
- Calcul des salaires en fonction des heures travaillées et des qualifications
- Gestion des retenues salariales
- Calcul des heures supplémentaires et des congés payés
- Création de fiches de paie détaillées pour chaque employé (PDF)
- Distribution mensuelle sécurisée des fiches de paie
- Accès enseignant : consulter détails salaires mensuels, recevoir fiches de paie

#### Frais de Scolarité

- Modalités de paiement flexibles
- Plans de paiement échelonnés (mensuel, trimestriel, annuel)
- Application de réductions sur les frais de scolarité
- **Envoi automatique de rappels** de paiement avant la date limite
- Gestion des pénalités pour paiements en retard
- Relevés de compte détaillés par élève
- Tableau de bord : payé / partiel / impayé / en retard
- Génération de reçus de paiement (PDF)

#### Comptabilité

- Catégories de dépenses et recettes configurables
- Suivi des dépenses par catégorie
- Enregistrement des recettes et sources de revenus
- Surveillance des flux de trésorerie
- Rapports financiers mensuels et annuels complets
- Export données financières vers Excel

**Méthodes de paiement supportées :** CCP · BaridiMob · CIB · Virement bancaire · Espèces

---

### 9.4 Cantine Scolaire

- Enregistrement des élèves concernés par la cantine
- Base de données élèves avec état nutritionnel
- Mise à jour des informations nutritionnelles ou de santé
- Préparation des menus alimentaires par semaine, mois ou trimestre
- **Options alimentaires spécifiques** pour cas médicaux ou nutritionnels (allergies, régimes)
- Révision et mise à jour régulières des menus
- **Envoi automatique des menus aux parents** (in-app + notification)
- Affichage du menu quotidien/hebdomadaire dans l'application parent et élève
- Rapports périodiques sur le nombre d'élèves inscrits
- Statistiques sur la consommation alimentaire

---

### 9.5 Transport Scolaire

- Création de lignes de transport en fonction de l'emplacement et de la répartition des quartiers
- Établir des horaires clairs pour chaque ligne
- Enregistrement des conducteurs de bus scolaires
- Émission de cartes d'identification pour les conducteurs
- Mise à jour des informations des conducteurs
- Suivi régulier des dossiers des conducteurs
- Base de données d'attribution des élèves aux lignes de transport
- **Cartes de transport personnalisées** pour les élèves
- Mise à jour des informations en cas de modifications de transport
- **Notifications** concernant les horaires et les ajustements
- Rapports périodiques sur la performance des lignes
- Collecte et analyse des données sur les horaires d'arrivée des bus et les retards
- Rapports sur le nombre d'élèves utilisant les services de transport
- Affichage dans l'application élève et parent : horaires des bus, arrêts, notifications

---

### 9.6 Activités Extrascolaires

- Création et gestion des activités parascolaires
- Mise à jour des détails (description, lieu, horaires)
- Personnalisation selon les niveaux et les intérêts des élèves
- Inscription des élèves dans les différentes activités
- Création et gestion des équipes d'élèves
- Désignation des leaders et membres des équipes
- **Planification sur le calendrier académique** pour éviter les conflits avec les cours
- Tableau de bord de gestion des activités
- Envoi de notifications aux élèves et enseignants (horaires, changements, mises à jour)
- Communication avec les parents
- Rapports détaillés : nombre de participants, niveau d'engagement, résultats
- Accès parent et élève aux informations sur les activités extrascolaires

---

### 9.7 Bibliothèque Scolaire

#### Gestion du Catalogue

- Enregistrement des nouveaux livres dans la base de données
- Mise à jour et suppression des informations
- Organisation et classification par catégorie, auteur, titre
- Enregistrement des copies multiples d'un même livre
- Ajout de labels d'identification

#### Prêts & Retours

- Enregistrement des livres empruntés, suivi des dates d'échéance
- Gestion efficace des prêts et retours
- **Recherche avancée** par titre, auteur, catégorie, disponibilité
- **Envoi de notifications et alertes** aux élèves pour dates d'échéance et rappels de retour
- Gestion des demandes spéciales d'élèves pour livres non disponibles
- Suivi de l'état des stocks et mise à jour

#### Rapports Bibliothèque

- Rapports complets sur l'utilisation de la bibliothèque
- Mouvement des livres (emprunts, retours, pertes)
- Ressources les plus demandées
- Statistiques par classe et par élève

---

### 9.8 Empreintes Digitales

- Enregistrement des empreintes digitales des élèves
- Lien des empreintes avec les dossiers des élèves
- **Intégration dans le système automatisé d'enregistrement des retards**
- Suivi des retards via les empreintes digitales
- Conservation sécurisée des données d'empreintes liées aux retards
- Élaboration de rapports sur les retards basés sur les empreintes

> ⚠️ Ce module nécessite un dispositif hardware compatible connecté au système.

---

### 9.9 Messagerie & Chat

#### Types de Salons

| Type | Participants | Usage |
|---|---|---|
| `TEACHER_PARENT` | 1 enseignant + 1–2 parents d'un élève spécifique | Communication privée formelle |
| `TEACHER_STUDENT` | 1 enseignant + 1 élève | Questions de cours |
| `CLASS_BROADCAST` | Enseignant → tous les élèves d'une classe | Annonces de classe |
| `ADMIN_PARENT` | Admin + parent spécifique | Affaires administratives |
| `ADMIN_BROADCAST` | Admin → tous utilisateurs / groupe spécifique | Annonces école |

#### Fonctionnalités Chat

- Interface simple et intuitive
- Messages privés et création de groupes
- Accès à l'historique complet des messages
- **Notifications instantanées** pour nouveaux messages
- Envoi et réception de multimédia : photos, vidéos, fichiers (PDF, Word, etc.)
- **Outil de recherche intégré** pour retrouver messages ou discussions
- Gestion des droits d'accès
- Réactions emoji aux messages
- Applications mobiles dédiées (enseignant, parent, élève)
- **Modèles de messages pré-rédigés** (préoccupation académique, feedback positif, suivi d'absence, comportement...)

#### Architecture Temps Réel

```
Client (Flutter/React)
  → WebSocket (Django Channels)
    → Channel Layer (Redis)
      → Message stocké en PostgreSQL
        → Push notification FCM (si destinataire hors ligne)
```

---

### 9.10 Application Enseignant

*(Application mobile Flutter — Non couvert par le panneau web)*

#### Écran d'Accueil

- Sessions du jour avec statut de marquage de présence
- Tâches en attente : notes non soumises, devoirs à venir
- Messages récents nécessitant une réponse
- Boutons d'action rapide : Poster devoir · Saisir notes · Upload ressource

#### Mes Classes

- Liste de toutes les classes assignées avec matière
- Accès à la liste complète des élèves avec photos
- Informations personnelles, notes et progrès académiques de chaque élève

#### Marquage des Présences

- **Par défaut : tous présents** — enseignant ne touche que les exceptions
- Options : Présent (vert) / Absent (rouge) / En retard (jaune)
- Confirmation en 5–15 secondes pour une classe complète
- Notification automatique aux parents des absents (délai 10 minutes)
- Bouton Annuler dans les 60 secondes suivant la confirmation
- Modification possible dans les 30 minutes

#### Gestion des Devoirs & Événements

- Créer post de devoir : titre, description, date d'échéance, fichiers joints (PDF, images, Word, liens vidéo)
- Rappels pour élèves et parents
- Suivi des devoirs lus par les élèves (accusés de lecture)
- Marquer devoir comme "corrigé et rendu"

#### Ressources Pédagogiques

- Upload de supports : PDF, PowerPoint, images, Word, liens vidéo
- Organisation par matière et chapitre/unité
- Disponibles instantanément pour tous les élèves assignés
- Statistiques de téléchargement

#### Saisie des Notes

- Sélectionner : classe → matière → trimestre → type d'évaluation
- Interface liste propre avec saisie numérique
- Supporte /10 (Primaire) et /20 (CEM/Lycée) automatiquement selon la section
- **Upload CSV** pour import de notes en masse (format : nom-prénom-note)
- Sauvegarde automatique toutes les 3 secondes
- Soumettre à l'admin pour validation et publication
- **Saisie vocale** (option) : "Ahmed Bouzid 15, Fatima Benali 18..."

#### Cahier de Texte Électronique

- Créer et mettre à jour le contenu du cahier de texte
- Répartitions mensuelles et annuelles des cours
- Modèles d'examens et d'évaluations sous divers formats

#### Communication

- Chat avec l'administration
- Chat privé parent-enseignant par élève avec modèles de messages
- Broadcast de classe pour tous les élèves
- Boîte de questions élèves par matière
- Création de groupes pour ses classes

#### Suivi & Rapports

- Suivi des retards et absences par classe
- Détails des salaires mensuels, réception des fiches de paie
- Rapports de performance académique, présences, gestion des classes

---

### 9.11 Application Élève

*(Application mobile Flutter)*

#### Interface Adaptée à l'Âge

| Section | Âge | Mode Interface |
|---|---|---|
| Primaire | 5–11 ans | Simplifié : grands boutons, icônes avec étiquettes, couleurs vives |
| CEM | 11–15 ans | Standard : layout normal, fonctionnalités complètes |
| Lycée | 15–18 ans | Complet : statistiques détaillées, vue calendrier, fonctions avancées |

#### Fonctionnalités Élève

- **Tableau de bord personnalisé** : devoirs du jour, notes récentes, prochain événement
- **Emploi du temps complet** : vue par jour ou par semaine
- **Ressources pédagogiques** : documents, supports de cours, exercices
- Consultation des devoirs et échéances
- **Suivi des absences et retards** (propres données uniquement)
- Accès aux horaires d'examens avec alertes et rappels
- Chat direct avec enseignants, réception de notifications importantes
- Consultation des résultats d'examens avec statistiques de performance
- Accès aux notes par matière, consultation des bulletins scolaires
- Affichage du menu quotidien/hebdomadaire de la cantine
- Informations transport scolaire : horaires des bus, arrêts, notifications
- Suivi des frais de scolarité : paiements effectués, soldes restants, échéances
- **Carte d'identité numérique** avec QR code (contient : photo, nom, classe, ID, QR code)
- Chatbot IA personnel (questions sur devoirs, notes, ressources, planning)

#### Gamification (Primaire)

- Système de points : devoirs complétés, quiz, exercices
- Badges : "Étoile de Math", "Champion de Lecture", "Assiduité Parfaite"
- Classement de classe amical (configurable — peut être désactivé)
- Certificats de récompense auto-générés imprimables
- Progression : Débutant → Explorateur → Champion → Maître
- Défi hebdomadaire avec points bonus

---

### 9.12 Application Parents

*(Application mobile Flutter)*

#### Sélecteur d'Enfants

Si un parent a plusieurs enfants à la même école, un sélecteur est affiché en haut de l'écran d'accueil. Toutes les données se mettent à jour immédiatement lors du changement d'enfant.

```
┌─────────────────────────────┐
│  [Photo] Amira ▼            │  ← appuyer pour changer d'enfant
│  3AP - Classe A             │
└─────────────────────────────┘
```

#### Tableau de Bord Parent

- Moyenne trimestrielle actuelle de l'enfant (affichée de manière proéminente)
- Notes récentes (3 dernières saisies)
- Statut de présence : présent / absent aujourd'hui
- Prochaines échéances de devoirs
- Messages non lus des enseignants
- Dernière annonce scolaire et prochain événement
- **Alerte de risque** : si la moyenne tombe en dessous du seuil de passage

#### Suivi Académique

- Toutes les notes publiées par matière, par trimestre
- Moyenne trimestrielle avec moyenne de classe pour comparaison
- Coefficients affichés
- Moyenne annuelle et rang de classe
- Graphique de progression : trimestre par trimestre par matière
- Code couleur : vert (au-dessus de la moyenne) · orange (à risque) · rouge (en dessous du seuil)
- Consultation des bulletins scolaires (view, download, share PDF)
- Notification push à la publication d'un nouveau bulletin

#### Présences

- Vue calendrier complet : codage couleur (présent=vert, absent=rouge, retard=orange)
- Comptage mensuel et annuel des absences
- **Soumettre une justification d'absence** directement depuis l'app (avec photo de certificat médical)
- Voir le statut des justifications soumises (en attente / approuvée / rejetée)
- Notification push immédiate quand l'enfant est marqué absent

#### Communication

- Chat privé avec professeur principal et enseignants par matière
- Annonces scolaires et calendrier d'événements
- Rappels de paiement (si module financier activé)
- Alertes d'urgence de l'administration

#### Autres Fonctionnalités Parent

- Suivi des devoirs de l'enfant avec dates limites
- Calendrier des examens
- Consultation des observations de comportement et suggestions d'amélioration
- Affichage du menu de la cantine (quotidien / hebdomadaire)
- Informations transport scolaire : horaires, arrêts, mises à jour
- Suivi des frais de scolarité, paiements, soldes, échéances
- Activités extrascolaires de l'enfant
- Informations bibliothèque scolaire
- Personnalisation des préférences de notification, langue, confidentialité
- **Chatbot IA** (questions en Arabe, Français ou Anglais sur l'école et l'enfant)

---

## 10. Schéma de Base de Données

### Modèles Principaux

```python
class School(Model):
    id = UUIDField(primary_key=True)
    name = CharField(max_length=200)
    logo = ImageField()
    address = TextField()
    phone = CharField()
    email = EmailField()
    subdomain = CharField(unique=True)
    subscription_plan = CharField()        # STARTER / PRO / PRO_AI
    subscription_active = BooleanField(default=True)

class Section(Model):
    SECTION_TYPES = [('PRIMARY', 'École Primaire'), ('MIDDLE', 'CEM'), ('HIGH', 'Lycée')]
    school = ForeignKey(School, on_delete=CASCADE)
    section_type = CharField(choices=SECTION_TYPES)
    name = CharField(max_length=100)
    director = ForeignKey(User, null=True)
    is_active = BooleanField(default=True)
    class Meta:
        unique_together = ['school', 'section_type']

class AcademicYear(Model):
    school = ForeignKey(School)
    section = ForeignKey(Section)
    name = CharField()              # "2025-2026"
    start_date = DateField()
    end_date = DateField()
    is_current = BooleanField(default=True)

class Class(Model):
    section = ForeignKey(Section)
    academic_year = ForeignKey(AcademicYear)
    name = CharField()              # "3AP-A", "1AM-B", "2AS-Sciences"
    level = CharField()             # "3AP", "1AM", "2AS"
    stream = CharField(null=True)   # "Sciences", "Math" (Lycée uniquement)
    homeroom_teacher = ForeignKey(User, null=True)
    max_students = IntegerField(default=35)

class User(AbstractBaseUser):
    id = UUIDField(primary_key=True, default=uuid4)
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    phone_number = CharField(max_length=20, unique=True)
    email = EmailField(blank=True, null=True)
    photo = ImageField(upload_to='avatars/', null=True)
    role = CharField(choices=ROLE_CHOICES)
    school = ForeignKey('School', null=True, on_delete=CASCADE)
    is_active = BooleanField(default=True)
    is_first_login = BooleanField(default=True)
    USERNAME_FIELD = 'phone_number'

class StudentProfile(Model):
    user = OneToOneField(User)
    current_class = ForeignKey(Class)
    student_id = CharField()
    date_of_birth = DateField()
    enrollment_date = DateField()

class ParentProfile(Model):
    user = OneToOneField(User)
    children = ManyToManyField(StudentProfile, related_name='parents')
    relationship = CharField()      # "Père", "Mère", "Tuteur"

class Grade(Model):
    EXAM_TYPES = [('CONTINUOUS','Continu'), ('TEST_1','Devoir 1'),
                  ('TEST_2','Devoir 2'), ('FINAL','Examen Final')]
    STATUS = [('DRAFT','Brouillon'), ('SUBMITTED','Soumis'),
              ('PUBLISHED','Publié'), ('RETURNED','Retourné')]
    student = ForeignKey(StudentProfile)
    subject = ForeignKey(Subject)
    trimester = IntegerField(choices=[1,2,3])
    academic_year = ForeignKey(AcademicYear)
    exam_type = CharField(choices=EXAM_TYPES)
    value = DecimalField(max_digits=4, decimal_places=2)
    max_value = DecimalField()      # 10.00 ou 20.00 selon la section
    status = CharField(choices=STATUS, default='DRAFT')
    submitted_by = ForeignKey(User)
    reviewed_by = ForeignKey(User, null=True)
    published_at = DateTimeField(null=True)
    admin_comment = TextField(blank=True)
```

### Décisions de Conception Clés

| Décision | Choix | Raison |
|---|---|---|
| Clés primaires | UUID partout | Prévient les attaques d'énumération |
| Suppressions | Soft delete uniquement (`is_deleted` + `deleted_at`) | Obligation légale d'archivage |
| Piste d'audit | `created_by`, `created_at`, `updated_by`, `updated_at` | Responsabilité légale |
| Historique des notes | Immuable une fois publié | Amendements créent un nouveau enregistrement |
| Isolation tenant | FK `school` sur chaque modèle, appliqué au niveau ViewSet | Jamais faire confiance au client |

---

## 11. API Reference

**URL de base :** `https://api.ilmi.dz/api/v1/`  
**Docs Swagger :** `GET /api/docs/`  
**ReDoc :** `GET /api/redoc/`

### Endpoints Principaux

```
# Authentification
POST   /api/v1/auth/login/
POST   /api/v1/auth/pin-login/
POST   /api/v1/auth/refresh/
POST   /api/v1/auth/change-password/
POST   /api/v1/auth/logout/

# Utilisateurs
GET    /api/v1/accounts/me/
POST   /api/v1/users/students/                # Crée aussi le compte parent
POST   /api/v1/users/students/bulk-import/
GET    /api/v1/users/teachers/
POST   /api/v1/users/teachers/
GET    /api/v1/users/parents/{id}/children/
PATCH  /api/v1/users/{id}/deactivate/

# Structure Scolaire
GET    /api/v1/school/profile/
PATCH  /api/v1/school/profile/
GET    /api/v1/schools/academic-years/
GET    /api/v1/sections/
POST   /api/v1/sections/
GET    /api/v1/sections/{id}/classes/

# Notes
POST   /api/v1/grades/                        # Soumission enseignant (batch)
GET    /api/v1/grades/pending/                # Admin : révision
PATCH  /api/v1/grades/{id}/publish/
PATCH  /api/v1/grades/{id}/return/
GET    /api/v1/students/{id}/grades/
GET    /api/v1/students/{id}/averages/

# Bulletins
POST   /api/v1/report-cards/generate/{student_id}/
POST   /api/v1/report-cards/generate-class/{class_id}/
GET    /api/v1/report-cards/{student_id}/download/

# Présences
POST   /api/v1/attendance/mark/
GET    /api/v1/attendance/records/
GET    /api/v1/students/{id}/attendance/
POST   /api/v1/attendance/justify/
PATCH  /api/v1/attendance/justify/{id}/approve/

# Devoirs
GET    /api/v1/homework/tasks/
POST   /api/v1/homework/
GET    /api/v1/classes/{id}/homework/

# Emplois du Temps
GET    /api/v1/timetable/class/{id}/
POST   /api/v1/timetable/slots/
GET    /api/v1/timetable/conflicts/
GET    /api/v1/timetable/export/{class_id}/

# Chat (WebSocket)
GET    /api/v1/chat/conversations/
POST   /api/v1/chat/rooms/
GET    /api/v1/chat/rooms/{id}/messages/
WS     /ws/chat/{room_id}/

# Finance
GET    /api/v1/finance/fee-structures/
GET    /api/v1/finance/payments/

# Bibliothèque
GET    /api/v1/library/books/
POST   /api/v1/library/books/
GET    /api/v1/library/loans/
POST   /api/v1/library/loans/

# Transport
GET    /api/v1/transport/lines/
GET    /api/v1/transport/drivers/

# Cantine
GET    /api/v1/canteen/menus/
POST   /api/v1/canteen/menus/

# Analytics
GET    /api/v1/analytics/class/{id}/
GET    /api/v1/analytics/section/{id}/risks/

# Archives
GET    /api/v1/archive/students/
GET    /api/v1/archive/students/{id}/
POST   /api/v1/archive/export/{academic_year_id}/
GET    /api/v1/archive/ministry-export/{class_id}/

# Chatbot IA
POST   /api/v1/chatbot/query/
GET    /api/v1/chatbot/history/
POST   /api/v1/chatbot/knowledge/
```

---

## 12. Authentification & Sécurité

### Principe Fondamental

> **Personne ne s'auto-inscrit.** Chaque compte est créé par une autorité supérieure dans la hiérarchie.

### Flux de Création des Comptes

```
Super Admin → crée comptes School Admin
  School Admin → crée comptes Enseignant
    School Admin → crée comptes Élève + Parent simultanément
      → Parent reçoit SMS avec identifiants
      → Élève reçoit carte imprimée à l'école
      → Tous forcés de changer le mot de passe à la première connexion
```

### Un Parent → Plusieurs Enfants

```
Admin crée Élève B avec numéro parent : 0555123456
  → Système vérifie : 0555123456 existe déjà ?
    OUI → Lier Élève B au compte Parent existant (pas de doublon)
    NON → Créer nouveau compte Parent, lier à Élève B
```

### Fonctionnalités d'Authentification

- **JWT** : tokens d'accès (15 min) + tokens de rafraîchissement (30 jours) avec rotation
- **`is_first_login`** → redirection vers écran de changement de mot de passe forcé
- **Connexion biométrique** (empreinte / Face ID) après configuration initiale
- **Connexion PIN** (4–6 chiffres) pour élèves du primaire (5–11 ans)
- **Verrouillage du compte** après 5 tentatives échouées → déverrouillage automatique après 30 minutes
- **Révocation de session à distance** par l'admin depuis le panneau

### Sécurité Infrastructure

- HTTPS obligatoire — HTTP redirigé via Nginx
- Mots de passe hachés avec **argon2**
- CORS : seules les origines enregistrées autorisées
- Ports PostgreSQL et Redis non exposés à internet
- Secrets dans les variables d'environnement — jamais dans le code
- Sauvegardes automatiques quotidiennes de la base de données

---

## 13. Notifications

### Déclencheurs de Notification

| Événement | Destinataires | Canal |
|---|---|---|
| Note publiée | Élève + Parent | Push + In-app |
| Nouveau devoir posté | Élèves de la classe | Push + In-app |
| Élève marqué absent | Parent | Push + In-app + SMS |
| Moyenne sous le seuil | Parent | Push + In-app |
| 3 absences consécutives | Parent + Admin | Push + In-app |
| Nouvelle annonce | Public cible | Push + In-app |
| Nouveau message reçu | Destinataire | Push + In-app |
| Bulletin disponible | Parent | Push + In-app |
| Incident disciplinaire | Parent | Push + In-app |
| Événement scolaire demain | Tous utilisateurs | Push + In-app |
| Rappel de paiement | Parent | Push + In-app |
| Notes soumises (enseignant) | Admin | In-app uniquement |
| 1ère présence du jour | Parent | Push (alerte d'entrée) |
| Rappel de retour livre | Élève | Push + In-app |

### Flux de Livraison

```
Événement dans Django
  → Signal Django → Tâche Celery en file d'attente
    → Tâche Celery :
      1. Créer enregistrement Notification en BDD (in-app)
      2. Envoyer notification push FCM aux tokens de l'appareil
      3. Envoyer SMS si événement haute priorité (absent)
```

### Fonctionnalités Intelligentes

- Catégories configurables : Académique · Présences · Comportement · Administratif · Messages
- Préférences personnalisables par utilisateur
- Mode silencieux : pas de push entre 22h et 7h
- Résumé hebdomadaire optionnel à la place des notifications individuelles

---

## 14. Chatbot IA (RAG)

### Architecture

```
Question utilisateur (Arabe / Français / Anglais)
  → Service FastAPI Chatbot
    → Classification d'intention
      → Statique : recherche sémantique dans Qdrant
          → Récupérer chunks pertinents de la base de connaissances école
      → Dynamique : requête API Django REST (données en temps réel)
          → Notes, devoirs, présences, planning (authentifié)
    → LLM (Groq / llama-3.3-70b)
  → Réponse en langage naturel
```

### Base de Connaissances (par Tenant)

**Statique (géré par admin) :** Nom école, adresse, contacts, horaires · Calendrier académique · Annuaire enseignants · Règlement scolaire · FAQ · Structure des frais

**Dynamique (requêté en direct) :** Notes de l'élève · Devoirs et affectations · Registre de présences · Événements à venir

### Exemples de Questions

**Parent :**
- "Quelle est la moyenne de mon fils ce trimestre ?"
- "كم مرة غاب ولدي هذا الشهر؟"
- "Does my daughter have any homework due this week?"
- "Quand commence la période des examens ?"

**Élève :**
- "Ai-je des devoirs à rendre demain ?"
- "Quelle est ma moyenne en mathématiques ce trimestre ?"
- "Quand est le prochain examen ?"

### Garde-fous

- Lecture seule — ne modifie jamais les données
- Un utilisateur ne peut consulter que ses propres données (ou celles de son enfant)
- Repli vers "Veuillez contacter l'administration" pour les questions sensibles
- Répond dans la langue d'écriture de l'utilisateur

### Isolation Multi-Tenant (Qdrant)

```python
# Chaque école a sa propre collection vectorielle isolée
collection_name = f"school_{school.id}_knowledge"
```

---

## 15. Génération de Rapports & PDF

### Rapports Disponibles

| Rapport | Destinataire | Format | Déclencheur |
|---|---|---|---|
| Bulletin individuel | Admin / Parent | PDF | À la demande |
| Bulletins d'une classe | Admin | ZIP de PDF | À la demande |
| Bulletins de toute l'école | Admin | ZIP de PDF (Celery) | À la demande |
| Rapport mensuel de présences | Admin | PDF / Excel | À la demande |
| Rapport financier mensuel/annuel | Admin / Finance | PDF / Excel | Automatique + à la demande |
| Fiche de paie mensuelle | Enseignant / Finance | PDF | Mensuel automatique |
| Rapport d'utilisation bibliothèque | Admin / Bibliothécaire | PDF | À la demande |
| Rapport transport | Admin | PDF | À la demande |
| Rapport activités extrascolaires | Admin | PDF | À la demande |
| Export Ministère (données élèves) | Admin | Excel (format officiel) | À la demande |
| Archive annuelle | Admin | ZIP | Fin d'année automatique |

### Contenu d'un Bulletin

Informations élève · Photo · Classe · Toutes matières avec notes et coefficients · Moyenne trimestrielle · Moyenne annuelle · Rang de classe · Commentaires enseignant · Champ signature directeur · Logo et couleurs de l'école

---

## 16. Mode Hors Ligne

| Fonctionnalité | Comportement Hors Ligne |
|---|---|
| Voir les notes | Mis en cache localement — toujours accessible |
| Voir les devoirs | Mis en cache localement |
| Voir les ressources | Fichiers précédemment téléchargés accessibles |
| Marquer présences (enseignant) | Sauvegardé localement, synchronisé au retour de connexion |
| Saisir notes (enseignant) | Brouillon sauvegardé localement, soumis quand en ligne |
| Envoyer messages chat | Mis en file d'attente localement, envoyé quand en ligne |
| Voir annonces | Mis en cache localement |

**Implémentation :** Hive (Flutter) pour stockage local · Service de synchronisation en arrière-plan · Indicateur hors ligne dans l'interface · Résolution de conflits : vérifier l'état du serveur avant synchronisation

---

## 17. Conformité Légale Algérienne

### Suivi des Examens Officiels

- Suivi de préparation aux examens officiels : BEP (5AP) · BEM (4AM) · BAC (3AS)
- Gestion des examens blancs (BEM blanc, BAC blanc)
- Suivi du statut de candidat au BAC et affectation de filière
- Export des données élèves au **format officiel du Ministère** (modèle Excel officiel)
- Rapport de performance pré-examen par élève

### Archivage Long Terme

- **Conservation des données académiques et de présences sur minimum 5–10 ans**
- Statut "Diplômé" : profil en lecture seule accessible après la diplomation — données jamais supprimées
- Statut "Transféré" : données verrouillées mais accessibles en référence
- Archives exportables sécurisées : ZIP de sauvegarde par année académique
- Visionneuse d'archives : recherche d'anciens élèves par nom, année, ou ID
- **Tâche Celery d'archivage automatique annuel** en fin d'année scolaire

### Spécificités Algériennes

- Semaine scolaire : Dimanche → Jeudi
- Fuseau horaire : Africa/Algiers
- Langue principale : Français, Arabe complet avec support RTL
- Support des 58 wilayas pour la localisation des écoles
- Système de notation : /10 (Primaire) et /20 (CEM & Lycée) avec coefficients
- Méthodes de paiement : CCP · BaridiMob · CIB · Virement bancaire · Espèces
- Système trimestriel : 3 trimestres par année académique

---

## 18. Plan de Développement & Prompts

> Ces prompts sont organisés par phase. Chaque prompt est conçu pour vérifier si une fonctionnalité existe déjà dans le projet, puis la réaliser complètement si ce n'est pas le cas.


### PHASE 3 — Présences & Emplois du Temps


PROMPT 3.4 — DÉTECTION ABSENTÉISME CHRONIQUE
Vérifie si une tâche Celery périodique quotidienne détecte les élèves
avec plus de N absences dans le mois et génère des alertes automatiques
pour l'admin et les parents.
Si non, implémente la tâche Celery, le seuil configurable par école,
et les notifications multi-destinataires.
```

---

### PHASE 4 — Communication & Chat

```
PROMPT 4.1 — CHAT TEMPS RÉEL (WEBSOCKET)
Vérifie si Django Channels est configuré avec les types de salons :
TEACHER_PARENT, TEACHER_STUDENT, CLASS_BROADCAST, ADMIN_PARENT,
ADMIN_BROADCAST, et si les messages sont persistés en PostgreSQL
avec notifications push FCM pour destinataires hors ligne.
Si non, implémente le consumer WebSocket, les modèles ChatRoom
et Message, et les endpoints REST pour l'historique.
```

```
PROMPT 4.2 — MODÈLES DE MESSAGES PRÉ-RÉDIGÉS
Vérifie si les MessageTemplate configurables par école existent en
Arabe et Français avec catégories : préoccupation académique,
feedback positif, suivi d'absence, comportement, résultats,
demande de réunion.
Si non, crée les modèles, les endpoints CRUD admin, et l'intégration
dans l'interface de chat de l'application enseignant.


### PHASE 5 — Finance & Ressources

```
PROMPT 5.1 — GESTION DES FRAIS DE SCOLARITÉ
Vérifie si le module de frais existe avec : configuration des montants
par section/année, tracking par élève (payé/partiel/impayé/retard),
enregistrement des paiements, génération de reçus PDF, et rappels
automatiques programmés.
Si non, implémente les modèles FeeStructure, Payment, Receipt,
les endpoints CRUD, la génération PDF des reçus, et la tâche
Celery de rappels.
```

```
PROMPT 5.2 — GESTION DES SALAIRES ET FICHES DE PAIE
Vérifie si le module paie existe avec : calcul des salaires selon
heures et qualifications, retenues, heures supplémentaires, congés,
génération de fiches de paie PDF, et accès enseignant à ses propres
fiches depuis l'application mobile.
Si non, implémente les modèles Salary, Deduction, PaySlip,
la logique de calcul, et les endpoints pour le rôle Finance.
```

```
PROMPT 5.3 — CANTINE SCOLAIRE COMPLÈTE
Vérifie si le module cantine existe avec : base de données élèves
inscrits avec état nutritionnel, création de menus par semaine/mois/trimestre,
options pour cas médicaux, envoi automatique des menus aux parents,
et rapports de consommation.
Si non, implémente les modèles CanteenStudent, Menu, MenuItem,
les endpoints CRUD, et la tâche Celery d'envoi des menus.
```

```
PROMPT 5.4 — TRANSPORT SCOLAIRE
Vérifie si le module transport existe avec : création de lignes par
quartier, horaires, info vehicule, enregistrement et cartes d'identification des
conducteurs, attribution des élèves aux lignes, notifications
d'horaires, et rapports de performance. gps pour les enfants pour que les parent peuvent voir la localisation des enfants (un ou plusieurs enfants)
Si non, implémente les modèles TransportLine, BusDriver,
StudentTransport, les endpoints, et les notifications.
```

---

### PHASE 6 — Bibliothèque & Activités

```
PROMPT 6.1 — BIBLIOTHÈQUE SCOLAIRE COMPLÈTE
Vérifie si le module bibliothèque existe avec : catalogue avec
classification, copies multiples, recherche avancée, gestion des
emprunts/retours avec dates d'échéance, alertes automatiques,
demandes spéciales, et rapports d'utilisation.
Si non, implémente les modèles Book, BookCopy, Loan, LibraryRequest,
les endpoints CRUD, et la tâche Celery d'alertes de retour.
```

```
PROMPT 6.2 — ACTIVITÉS EXTRASCOLAIRES
Vérifie si le module activités existe avec : création et gestion des
activités, inscription des élèves, création d'équipes avec leaders,
planification sur calendrier académique, notifications, et rapports
de participation.
Si non, implémente les modèles Activity, ActivityTeam, StudentActivity,
les endpoints, et l'intégration au calendrier.
```

```
PROMPT 6.3 — MODULE COMPORTEMENT & DISCIPLINE
Vérifie si le module discipline existe avec : incidents par enseignant
ou admin (niveaux : bon/avertissement/grave), notifications parent,
accumulation d'avertissements, dossier imprimable PDF, et note de
conduite optionnelle dans le bulletin.
Si non, implémente le modèle DisciplineRecord, les endpoints,
les signaux de notification, et l'intégration au bulletin.
```

---

### PHASE 7 — Analytics & Archivage

```
PROMPT 7.1 — ANALYTICS AVANCÉES TABLEAU DE BORD
Vérifie si le dashboard analytics existe avec : moyennes par matière
et classe, taux de réussite, comparaisons entre classes, détection
automatique d'élèves à risque, alertes prédictives basées sur trajectoire,
et graphiques (barres, camemberts, courbes).
Si non, implémente les endpoints analytics, les algorithmes de
détection de risque, les tâches Celery d'alertes prédictives.
```

```
PROMPT 7.2 — ARCHIVAGE LONG TERME & CONFORMITÉ LÉGALE
Vérifie si le système d'archivage existe avec : statuts Diplômé/Transféré
en lecture seule, conservation des données historiques indefiniment,
visionneuse d'archives avec recherche, export ZIP par année, et
export au format officiel du Ministère.
Si non, implémente le modèle AcademicArchive, la tâche Celery
d'archivage annuel automatique, et les endpoints d'export Ministère.
```

```
PROMPT 7.3 — EMPREINTES DIGITALES
Vérifie si le module empreintes existe avec : enregistrement et liaison
aux dossiers élèves, intégration au système de présences automatisé,
et rapports sur les retards.
Si non, implémente le modèle FingerprintData, les endpoints
d'enregistrement et de reconnaissance, et l'intégration à
l'attendance avec rapport dédié.
```

---

### PHASE 8 — Chatbot IA & Fonctionnalités Premium

```
PROMPT 8.1 — SERVICE CHATBOT RAG
Vérifie si le microservice FastAPI chatbot existe avec : pipeline LangChain,
indexation Qdrant par tenant, classification d'intention statique/dynamique,
support multilingue (Arabe, Français, Anglais), et garde-fous de sécurité.
Si non, implémente le service complet avec : embedding multilingue,
namespace Qdrant par school_id, intégration Groq API, et tests
de scénarios de questions typiques.
```

```
PROMPT 8.2 — GESTION BASE DE CONNAISSANCES (ADMIN)
Vérifie si l'admin peut gérer la base de connaissances du chatbot depuis
le panneau web : ajouter/modifier/supprimer des documents, avec
ré-indexation automatique via Celery à chaque modification.
Si non, implémente le modèle ChatbotKnowledge, le pipeline
d'embedding Celery, et l'interface de gestion dans le panneau admin.
```

```
PROMPT 8.3 — GAMIFICATION ÉLÈVES PRIMAIRE
Vérifie si le système de gamification existe avec : points, badges,
classement de classe configurable, certificats auto-générés, niveaux
de progression, et défi hebdomadaire.
Si non, implémente les modèles GamificationProfile, Badge, Challenge,
les endpoints de mise à jour des points, et les écrans Flutter
adaptés à l'âge des élèves du primaire.
```

---

### PHASE 9 — Applications Mobiles

```
PROMPT 9.1 — SÉLECTEUR D'ENFANTS (APPLICATION PARENT)
Vérifie si l'application parent affiche un sélecteur d'enfants en haut
de l'écran d'accueil permettant de switcher entre plusieurs enfants
avec mise à jour immédiate de toutes les données affichées.
Si non, implémente le widget ChildSwitcher en Flutter avec état BLoC,
chargement des données par enfant, et gestion des enfants dans
différentes sections.
```

```
PROMPT 9.2 — INTERFACE ADAPTÉE À L'ÂGE (APPLICATION ÉLÈVE)
Vérifie si l'application élève adapte son interface en fonction de la
section : Primaire (grands boutons, icônes, couleurs vives), CEM
(interface standard), Lycée (interface complète avec statistiques).
Si non, implémente le système de thèmes adaptatifs en Flutter avec
détection automatique de la section depuis le profil utilisateur.
```

```
PROMPT 9.3 — CARTE D'IDENTITÉ NUMÉRIQUE ÉLÈVE
Vérifie si l'application élève affiche une carte d'identité numérique
stylisée avec photo, nom, classe, ID, logo école, année scolaire,
et QR code encodant l'ID élève (renouvelable toutes les 30 secondes
pour la vérification).
Si non, implémente l'écran StudentIDCard en Flutter et l'endpoint
de génération de QR dynamique côté backend.
```

```
PROMPT 9.4 — MODE HORS LIGNE COMPLET
Vérifie si le mode hors ligne est implémenté avec Hive pour le stockage
local, synchronisation automatique au retour de connexion, indicateur
visuel de connectivité, et résolution de conflits.
Si non, implémente la couche de cache Hive, le service de synchronisation
en arrière-plan, et teste les scénarios de déconnexion/reconnexion.
```

---

### PHASE 10 — Déploiement & Production

```
PROMPT 10.1 — CI/CD GITHUB ACTIONS
Vérifie si le pipeline CI/CD existe dans .github/workflows/ avec :
exécution automatique des tests à chaque push, build Docker,
scan de vulnérabilités des dépendances.
Si non, crée le fichier ci.yml avec PostgreSQL de test en service,
exécution des tests Django, et notifications en cas d'échec.
```

```
PROMPT 10.2 — CONFIGURATION PRODUCTION COMPLÈTE
Vérifie si la configuration de production est prête avec : Nginx
comme reverse proxy avec SSL Let's Encrypt, Celery avec workers
multiples, monitoring Sentry, et sauvegardes automatiques PostgreSQL.
Si non, génère nginx.conf, docker-compose.prod.yml, les scripts
de sauvegarde Celery, et la configuration Sentry.
```

```
PROMPT 10.3 — SUPER ADMIN PANEL
Vérifie si le panneau Super Admin existe avec : gestion de tous les
tenants écoles, activation/désactivation, création de nouveaux
tenants avec compte admin initial, usurpation d'identité pour support
(avec audit trail), et dashboard de revenus de la plateforme.
Si non, implémente le panneau React Super Admin avec toutes les
fonctionnalités de gestion SaaS.
```

---

## 19. Tests & Qualité

### Principe Fondamental

> **Une fonctionnalité n'est PAS terminée tant qu'elle n'est pas testée.** Pour chaque feature : happy path · sad path · test de permissions · test d'isolation tenant.

### Quatre Scénarios Obligatoires

| Scénario | Description |
|---|---|
| **Happy Path** | Fonctionne correctement avec une utilisation normale |
| **Sad Path** | Échoue correctement avec des données invalides |
| **Test de Permission** | Le mauvais rôle est bloqué avec 403 |
| **Test Tenant** | Les données d'une autre école sont invisibles (404) |

### Exemple de Tests d'Isolation Tenant

```python
class TenantIsolationTest(APITestCase):
    def test_admin_cannot_see_other_schools_students(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get(f'/api/v1/students/{self.student_b.id}/')
        # 404 — ne jamais confirmer l'existence d'une ressource
        self.assertEqual(response.status_code, 404)

    def test_grade_list_only_returns_own_school_grades(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get('/api/v1/grades/')
        ids = [g['id'] for g in response.data]
        self.assertNotIn(str(self.student_b.id), str(ids))
```

> ⚠️ Toujours retourner **404 (Not Found)** plutôt que 403 (Forbidden) quand un utilisateur accède à une ressource d'un autre tenant.

### Une Feature est "Terminée" Quand :

1. Le happy path fonctionne et est testé
2. Les erreurs retournent les codes de statut corrects
3. Les mauvais rôles sont bloqués (testé)
4. Les autres écoles ne peuvent pas voir les données (testé)
5. Fonctionne sans internet si applicable (mobile)
6. Un utilisateur non-technique peut l'utiliser sans instructions

---

## 20. Déploiement & Infrastructure

### Architecture de Production

```
Internet → Cloudflare (CDN + DDoS) → Nginx (SSL + Reverse Proxy)
  → Django/Daphne (API + WebSocket)
  → FastAPI (Chatbot IA)
  → Celery Workers (4 workers)

Données :
  PostgreSQL 16 (primary) + Read Replica (à partir de 50 écoles)
  Redis 7 (cache + sessions + broker)
  Qdrant (vecteurs RAG)
  S3/R2 (fichiers)

Monitoring :
  Sentry (erreurs) · UptimeRobot (disponibilité) · Flower (Celery)
```

### Plan de Sauvegarde

| Type | Fréquence | Rétention | Localisation |
|---|---|---|---|
| PostgreSQL incrémental | Toutes les 6h | 7 jours | Même région |
| PostgreSQL dump complet | Quotidien | 30 jours | Même région |
| PostgreSQL dump complet | Hebdomadaire | 1 an | Région différente |
| Stockage fichiers (S3/R2) | Versioning continu | 90 jours | Intégré S3/R2 |

**RTO (Recovery Time Objective) :** 24 heures maximum  
**RPO (Recovery Point Objective) :** 6 heures maximum de perte de données

---

## 21. Modèle Commercial & Tarification

### Plans d'Abonnement

| Plan | Élèves | Mensuel (DZD) | Annuel (DZD) | Inclus |
|---|---|---|---|---|
| **Starter** | Jusqu'à 100 | 30 000 DZD | 300 000 DZD | Fonctionnalités de base, pas de chatbot, 5 Go |
| **Pro** | Jusqu'à 300 | 50 000 DZD | 485 000 DZD | Toutes les fonctionnalités + contenu premium, pas d'IA, 20 Go |
| **Pro + AI** | 300+ | 64 000 DZD | 620 000 DZD | Tout + chatbot IA + stockage illimité + support prioritaire |

- **Remise de 20%** pour paiement annuel anticipé
- **Multi-campus premium** : +50% du prix du plan par campus supplémentaire
- **Marketplace contenu premium** : école gagne 90%, plateforme prend 10%

### Projection de Revenus

| Jalon | Écoles | Revenu Mensuel |
|---|---|---|
| 6 mois (pilotes) | 3–5 | 0 DZD (pilotes gratuits) |
| 12 mois | 15–20 | 270 000–360 000 DZD |
| 24 mois | 120 | 2 400 000 DZD |
| 36 mois | 300 | 6 600 000 DZD |

---

## 22. Variables d'Environnement

Copiez `.env.example` vers `.env` et remplissez :

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=api.ilmi.dz,localhost

# Base de Données
DB_NAME=ilmi_db
DB_USER=ilmi_user
DB_PASSWORD=your-db-password
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Firebase (Push Notifications)
FCM_SERVER_KEY=your-fcm-server-key

# IA Chatbot
GROQ_API_KEY=your-groq-api-key
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=your-qdrant-key

# Stockage Fichiers
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=ilmi-storage
AWS_S3_REGION_NAME=eu-central-1

# Monitoring
SENTRY_DSN=your-sentry-dsn

# SMS (Algérie)
SMS_GATEWAY_API_KEY=your-sms-gateway-key
SMS_SENDER_ID=ILMI

# Timezone & Language
TIME_ZONE=Africa/Algiers
LANGUAGE_CODE=fr
```

---

## 23. Glossaire

| Terme | Définition |
|---|---|
| **Tenant** | Une école unique dans le système multi-tenant |
| **Section** | Division de niveau au sein d'une école (Primaire / CEM / Lycée) |
| **Trimestre** | Une des trois périodes académiques de l'année scolaire algérienne |
| **BEP** | Brevet d'Enseignement Primaire — examen national de fin de primaire (5AP) |
| **BEM** | Brevet d'Enseignement Moyen — examen national de fin de CEM (4AM) |
| **BAC** | Baccalauréat — examen national de fin de lycée (3AS) |
| **Coefficient** | Facteur de pondération appliqué à une matière dans le calcul des moyennes |
| **RAG** | Retrieval-Augmented Generation — technique IA pour le chatbot |
| **FCM** | Firebase Cloud Messaging — service pour notifications push mobiles |
| **JWT** | JSON Web Token — format de token d'authentification stateless |
| **DRF** | Django REST Framework — bibliothèque Django pour APIs REST |
| **RTL** | Right-to-Left — direction du texte pour la langue arabe |
| **SaaS** | Software as a Service — modèle commercial logiciel par abonnement |
| **RTO** | Recovery Time Objective — délai maximum de rétablissement de service |
| **RPO** | Recovery Point Objective — perte de données maximale acceptable |
| **Soft Delete** | Marquer un enregistrement comme supprimé sans le retirer de la BDD |
| **Audit Trail** | Journal de toutes les actions : qui a fait quoi, quand, sur quel enregistrement |
| **CDN** | Content Delivery Network — réseau de serveurs pour la livraison rapide de fichiers |
| **CCP** | Compte Courant Postal — méthode de paiement Algérie Poste |
| **BaridiMob** | Application de paiement mobile d'Algérie Poste |
| **CIB** | Carte Interbancaire — carte de paiement bancaire algérienne |

---

<div align="center">

**ILMI — Plateforme de Gestion Scolaire pour l'Algérie**

*Version 3.0 · 2026 · Confidentiel*

`Django` · `React` · `Flutter` · `PostgreSQL` · `Redis` · `Celery` · `WebSocket` · `RAG AI`

</div>
