# ILMI — Nouvelle Architecture & Fonctionnalités Détaillées
### Document de Spécification Complet · Version 5.0 · 2026

---

## Table des Matières

1. [Système de Vente par Modules (Core)](#1-système-de-vente-par-modules)
2. [Rôles & Permissions Révisés](#2-rôles--permissions-révisés)
3. [Super Admin Panel — Gestion SaaS](#3-super-admin-panel)
4. [MODULE 1 — Gestion Pédagogique](#4-module-1--gestion-pédagogique)
5. [MODULE 2 — Gestion Empreintes](#5-module-2--gestion-empreintes)
6. [MODULE 3 — Gestion Finance](#6-module-3--gestion-finance)
7. [MODULE 4 — Gestion Cantine](#7-module-4--gestion-cantine)
8. [MODULE 5 — Gestion Transport](#8-module-5--gestion-transport)
9. [MODULE 6 — Auto-Éducation (E-Learning)](#9-module-6--auto-éducation)
10. [MODULE 7 — Messagerie SMS](#10-module-7--messagerie-sms)
11. [MODULE 8 — Gestion Bibliothèque](#11-module-8--gestion-bibliothèque)
12. [MODULE 9 — Infirmerie Scolaire](#12-module-9--infirmerie-scolaire)
13. [MODULE 10 — Application Mobile Unifiée (1 seule app)](#13-module-10--application-mobile-unifiée)
14. [Fonctionnalités Transversales](#14-fonctionnalités-transversales)
15. [Schéma Base de Données — Feature Flags](#15-schéma-base-de-données)
16. [API — Endpoints par Module](#16-api-endpoints-par-module)
17. [Plan de Tarification par Module](#17-plan-de-tarification)
18. [CATÉGORIE 2 — Écoles de Formation](#18-catégorie-2--écoles-de-formation)

---

## 1. Système de Vente par Modules

### Concept Fondamental

ILMI passe d'un modèle de plans fixes (Starter/Pro/Pro+AI) à un **modèle modulaire à la carte** où chaque école achète exactement les modules dont elle a besoin. Le Super Admin active/désactive les modules depuis son panneau, et les changements sont **instantanément reflétés** dans l'interface de l'école sans redémarrage ni redéploiement.

### Architecture des Feature Flags

```
School (tenant)
  └── SchoolSubscription
        ├── is_active: bool
        ├── subscription_end_date: date
        ├── max_students: int
        └── modules_enabled: JSONField
              {
                "pedagogique": true,
                "empreintes": false,
                "finance": true,
                "cantine": false,
                "transport": true,
                "auto_education": false,
                "sms": true,
                "bibliotheque": true,
                "infirmerie": false,
                "mobile_apps": true
              }
```

### Fonctionnement Technique

**Backend — Décorateur de permission par module :**
```python
@require_module('cantine')
def canteen_menu_list(request):
    ...
```

**Frontend React — Guard de route par module :**
```
Si school.modules.cantine === false
  → Composant "Module non activé" avec bouton "Contacter pour activer"
  → Ne pas afficher le lien dans le menu latéral
```

**Mobile Flutter — Masquage conditionnel :**
```
Au login, le backend retourne les modules actifs dans le JWT payload.
L'app masque automatiquement les sections non activées.
```

### Catalogue des Modules Disponibles

| ID Module | Nom Commercial | Prix Mensuel (DZD) | Prix Annuel (DZD) |
|---|---|---|---|
| `pedagogique` | Gestion Pédagogique | Inclus (base) | Inclus (base) |
| `empreintes` | Gestion Empreintes Digitales | 8 000 | 80 000 |
| `finance` | Gestion Financière | 12 000 | 115 000 |
| `cantine` | Gestion Cantine Scolaire | 6 000 | 58 000 |
| `transport` | Gestion Transport Scolaire | 7 000 | 67 000 |
| `auto_education` | Auto-Éducation & E-Learning | 15 000 | 145 000 |
| `sms` | Messagerie SMS | 5 000 | 48 000 |
| `bibliotheque` | Gestion Bibliothèque | 6 000 | 58 000 |
| `infirmerie` | Infirmerie Scolaire | 7 000 | 67 000 |
| `mobile_apps` | Applications Mobiles (3 apps) | 10 000 | 96 000 |
| `ai_chatbot` | Chatbot IA (RAG) | 18 000 | 170 000 |

> Le module `pedagogique` est toujours inclus dans tout abonnement de base. C'est le socle minimal sans lequel rien d'autre ne fonctionne.

### Packs Recommandés (Bundles)

| Pack | Modules Inclus | Réduction |
|---|---|---|
| **Pack Essentiel** | pédagogique + mobile_apps + sms | -10% |
| **Pack Complet** | Tous les modules sauf IA | -20% |
| **Pack Premium** | Tous les modules | -25% |
| **Pack Startup** | pédagogique + finance + mobile_apps | -15% |

### Gestion des Upgrades

Quand une école veut ajouter un module en cours d'année :
- Le Super Admin active le module depuis son panneau
- Le module est **actif immédiatement**, pas besoin d'attendre le renouvellement
- La facturation est calculée au **prorata** du nombre de mois restants
- Un email de confirmation est envoyé automatiquement à l'administrateur de l'école
- Un log d'activation est enregistré (qui a activé, quand, quel module)

---

## 2. Rôles & Permissions Révisés

### Hiérarchie Complète des Rôles

```
SUPER_ADMIN (Propriétaire Plateforme ILMI)
│
├── SCHOOL_ADMIN (Directeur / Secrétaire Général)
│     ├── GENERAL_SUPERVISOR (Superviseur Général de l'école)
│     ├── SECTION_ADMIN (Admin d'une section uniquement — optionnel)
│     ├── FINANCE_MANAGER (Comptable / Gestionnaire Financier)
│     ├── LIBRARIAN (Bibliothécaire)
│     ├── CANTEEN_MANAGER (Responsable Cantine)
│     ├── TRANSPORT_MANAGER (Responsable Transport)
│     ├── HR_MANAGER (Responsable RH / Personnel)
│     └── NURSE (Infirmier / Infirmière Scolaire)
│
├── TEACHER (Enseignant) → Application Mobile
├── PARENT (Parent / Tuteur) → Application Mobile
└── STUDENT (Élève) → Application Mobile
```

### Description Détaillée de Chaque Rôle

#### SUPER_ADMIN
- Accès total à toutes les écoles de la plateforme
- Peut créer, suspendre, ou supprimer des tenants école
- Gère les abonnements et les modules de chaque école
- Peut "usurper" l'identité d'un admin école pour support technique (avec audit trail)
- Voit les analytics globales de la plateforme (revenus, nombre d'utilisateurs actifs, etc.)
- Peut envoyer des messages broadcast à tous les admins d'écoles
- Gère les versions et déploiements de la plateforme

#### SCHOOL_ADMIN (Directeur / Secrétaire)
- Accès complet à TOUS les modules activés pour son école
- Crée et gère tous les comptes utilisateurs de son école
- Configure les paramètres académiques (années scolaires, coefficients, pondérations)
- Génère tous les rapports et bulletins
- Peut déléguer des accès spécifiques à des sous-rôles
- Reçoit toutes les alertes et notifications importantes
- Peut accéder aux logs d'audit de toutes les actions dans son école
- peut attribuer des examens dans ses matieres dans un trimestre , par exemple (examen1,examen2,controle continu) et attribuer un pourcentage pour calcul de moyenne de la matiere dans le trimestre par exemple (30% examen1 , 30% examen2 , 40% controle continu)
#### GENERAL_SUPERVISOR
- Accès en **lecture** à tous les modules activés de l'école
- Voit les dashboards académiques, financiers, de présences
- Peut générer des rapports (mais ne peut pas modifier les données)
- Reçoit les alertes automatiques (élèves à risque, absences, etc.)
- Peut publier les notes (mais ne peut pas les saisir)
- Ne peut pas créer de comptes utilisateurs
- Peut envoyer des annonces

#### FINANCE_MANAGER
- Accès exclusif au module Finance (si activé)
- Gère les frais de scolarité, les paiements, les reçus
- Gère les salaires et fiches de paie du personnel
- Génère les rapports financiers mensuels et annuels
- Peut voir les informations de base des élèves (nom, classe) mais pas les notes
- Ne peut pas accéder aux modules pédagogiques, bibliothèque, etc.

#### LIBRARIAN
- Accès exclusif au module Bibliothèque (si activé)
- Gère le catalogue, les emprunts, les retours
- Peut rechercher des élèves pour gérer leurs prêts
- Génère les rapports de la bibliothèque
- Envoie des rappels de retour (via le système de notifications)

#### CANTEEN_MANAGER
- Accès exclusif au module Cantine (si activé)
- Gère les inscriptions, les menus, les options alimentaires
- Génère les rapports de consommation
- Envoie les menus aux parents

#### TRANSPORT_MANAGER
- Accès exclusif au module Transport (si activé)
- Gère les lignes, les chauffeurs, les affectations
- Envoie les notifications de retard/modification

#### NURSE (Infirmier / Infirmière Scolaire)
- Accès exclusif au module Infirmerie (si activé)
- Gère les dossiers médicaux complets de tous les élèves
- Enregistre et suit les consultations quotidiennes
- Peut envoyer des messages et notifications aux parents concernant la santé de leur enfant
- Peut soumettre une justification d'absence médicale directement depuis l'interface infirmerie
- Gère les urgences médicales avec protocoles configurables
- Génère les rapports sanitaires mensuels et annuels
- Ne peut voir aucune information académique (notes, présences scolaires, devoirs)
- Ne peut voir aucune donnée financière
- Plusieurs comptes NURSE peuvent être créés par école (infirmier principal + assistant)

#### TEACHER (Enseignant)
- Accède via l'Application Mobile Enseignant (si module mobile activé)
- Marque les présences de ses classes
- Saisit et soumet les notes des examen
- Publie des devoirs et ressources pédagogiques
- Chatte avec les parents et l'administration
- Consulte ses fiches de paie (si module finance activé)
- Accède au cahier de texte électronique
- peut attribuer des devoirs maison a une classe avec une date de soumission
- peut attribuer des examens dans ses matieres dans un trimestre , par exemple (examen1,examen2,controle continu) et attribuer un pourcentage pour calcul de moyenne de la matiere dans le trimestre par exemple (30% examen1 , 30% examen2 , 40% controle continu)

#### PARENT
- Accède via l'Application Mobile Parent (si module mobile activé)
- Voit les informations de tous ses enfants (meme si plusieurs ecoles)
- Consulte notes, présences, devoirs, bulletins, emploi du temps
- Communique avec les enseignants ou l'administration
- Consulte les menus cantine(si son enfant est inscrit), horaires transport(si son enfant est inscrit), statut payement , prochain payement ...

#### STUDENT (Élève)
- Accède via l'Application Mobile Élève
- Consulte ses notes, devoirs, emploi du temps
- Accède aux ressources pédagogiques
- Accède au contenu e-learning (si module auto-éducation activé)
- Consulte sa carte d'identité numérique
- Système de gamification (si Primaire)
- chat avec admin ou enseignant 
- constulte menu cantine (si inscrit)



## 3. Super Admin Panel

### Dashboard Plateforme

Le Super Admin dispose d'un tableau de bord global donnant une vue d'ensemble de toute la plateforme ILMI.

**KPIs en temps réel :**
- Nombre total d'écoles actives / suspendues / en période d'essai
- Nombre total d'utilisateurs actifs (par rôle) sur les 30 derniers jours
- Revenu mensuel récurrent (MRR) avec courbe de croissance
- Revenu annuel récurrent (ARR)
- Modules les plus utilisés (classement)
- Écoles dont l'abonnement expire dans les 30 prochains jours (avec bouton de relance)
- Alertes système : erreurs critiques, taux d'utilisation des serveurs

**Graphiques :**
- Courbe d'acquisition d'écoles (par mois, 12 mois glissants)
- Répartition des modules activés (camembert)
- Revenu par module (barres)
- Carte géographique des écoles par wilaya (carte d'Algérie interactive)

### Gestion des Écoles (Tenants)

#### Liste des Écoles
- Tableau paginé avec filtres : par wilaya, par plan, par statut, par module activé
- Colonnes : nom école, wilaya, admin principal, nombre élèves, modules actifs, date d'expiration, statut
- Recherche rapide par nom ou email
- Actions rapides : voir détails, modifier abonnement, suspendre, supprimer
- Export Excel de toute la liste

#### Créer une Nouvelle École
Formulaire en plusieurs étapes :

**Étape 1 — Informations École :**
- Nom officiel de l'école
- Type (Privé / Public / Mixte)
- Adresse complète + Wilaya + Commune
- Téléphone principal + Téléphone secondaire
- Email officiel
- Logo (upload image)
- Site web (optionnel)
- Directeur / Contact principal

**Étape 2 — Configuration Abonnement :**
- Plan de base (choix du nombre max d'élèves)
- Date de début d'abonnement
- Date de fin d'abonnement
- Activation des modules (checkboxes par module avec prix affiché)
- Réduction manuelle (pourcentage ou montant fixe)
- Note interne (visible super admin uniquement)

**Étape 3 — Création Compte Admin École :**
- Prénom + Nom de l'admin
- Numéro de téléphone (sera l'identifiant de connexion)
- Email (pour réception des identifiants)
- Envoi automatique des identifiants par SMS + Email
- Mot de passe temporaire généré automatiquement (changement forcé à la première connexion)

**Étape 4 — Configuration Initiale (optionnel depuis super admin) :**
- Sections à activer (Primaire / CEM / Lycée)
- Année scolaire initiale
- Fuseau horaire (Africa/Algiers par défaut)
- Langue par défaut (Français / Arabe)

#### Fiche Détaillée d'une École

Une fois l'école créée, le Super Admin peut accéder à sa fiche complète :

**Onglet Informations :** Toutes les infos de l'école + historique des modifications + possibilité d'édition

**Onglet Abonnement :**
- Statut actuel (actif / suspendu / expiré / période d'essai)
- Date de début et fin
- Modules activés avec dates d'activation
- Historique complet des paiements et factures
- Bouton "Renouveler abonnement" (génère une facture)
- Bouton "Ajouter un module" (activation instantanée + facturation prorata)
- Bouton "Suspendre" (avec message de raison envoyé à l'admin école)
- Historique des changements d'abonnement (qui a modifié, quand)

**Onglet Utilisateurs :**
- Nombre d'utilisateurs par rôle (admins, enseignants, parents, élèves)
- Liste des admins de l'école avec possibilité de réinitialisation de mot de passe
- Dernière connexion par utilisateur

**Onglet Analytics :**
- Activité de l'école (connexions, notes saisies, messages envoyés) sur les 30 derniers jours
- Taux d'utilisation de chaque module activé
- Comparaison avec d'autres écoles de même taille (anonymisé)

**Onglet Support (Usurpation d'Identité) :**
- Bouton "Se connecter en tant qu'admin de cette école" (pour support technique)
- Chaque usurpation est **obligatoirement loguée** : timestamp, raison (champ obligatoire), durée
- Notification automatique à l'admin école : "Un administrateur ILMI a accédé à votre compte à [heure] pour [raison]"
- Session d'usurpation limitée à 2 heures maximum
- Log immuable consultable par l'admin école

### Gestion des Abonnements et Factures

**Tableau de bord financier :**
- MRR actuel avec projection du mois
- Revenu par module (pour identifier les plus rentables)
- Écoles en retard de paiement avec montants
- Taux de renouvellement (churn rate)

**Génération de factures :**
- Facture PDF auto-générée à chaque activation ou renouvellement
- Numéro de facture séquentiel
- Détail ligne par ligne des modules activés avec prix
- RIB bancaire ILMI sur la facture
- Envoi automatique par email à l'admin école

**Relances automatiques :**
- J-30 : email de rappel d'expiration
- J-15 : email + SMS de rappel
- J-7 : email + SMS urgent
- J0 (expiration) : suspension automatique avec message d'alerte dans l'app
- J+7 : si toujours impayé → suppression de l'accès (données conservées 90 jours)

### Dashboard Analytics Globales

- **Carte des écoles** : carte interactive de l'Algérie avec point par école, couleur selon statut
- **Croissance** : courbes d'acquisition mensuelle
- **Rétention** : taux de renouvellement par plan
- **Module popularity** : quels modules sont le plus souvent activés
- **Performance** : temps de réponse API moyen, taux d'erreurs, uptime
- **Stockage** : utilisation totale du stockage S3, par école

### Gestion du Contenu Plateforme (Auto-Éducation)

Le Super Admin peut gérer le contenu global (non spécifique à une école) pour le module Auto-Éducation :
- Upload de ressources génériques (manuels scolaires officiels algériens)
- Exemples d'examens officiels (BEP, BEM, BAC) des années précédentes
- Ce contenu est disponible pour toutes les écoles qui ont activé le module auto-éducation

---

## 4. MODULE 1 — Gestion Pédagogique

> Module de base, toujours inclus. Sans ce module, rien d'autre ne fonctionne.

### 4.1 Gestion Complète des Élèves

**Inscription d'un Élève :**
- Numéro d'identification unique auto-généré (format : [ANNÉE][SECTION][SÉQUENTIEL])
- Informations personnelles : prénom, nom, date et lieu de naissance, sexe
- Photo de profil (upload ou prise directe depuis la caméra)
- Adresse complète : wilaya, commune, quartier
- Classe affectée (avec historique de toutes les classes précédentes)
- Statut de scolarité : actif / diplômé / transféré / abandonné / archivé

**Informations Parents associées :**
- Père : prénom, nom, téléphone, profession, email
- Mère : prénom, nom, téléphone, profession, email
- Tuteur légal (si applicable)
- Contact d'urgence (personne différente des parents)
- Chaque parent ou tuteur obtient automatiquement son compte mobile dès la création de l'élève

**Informations Médicales :**
- Maladies chroniques
- Allergies connues (utilisé aussi par le module cantine)
- Médicaments prescrits
- Groupe sanguin
- Médecin traitant + téléphone
- Ces informations sont visibles UNIQUEMENT par l'admin (jamais les enseignants ou autres)

**Gestion du Dossier Scolaire Complet :**
- Historique complet de toutes les années scolaires dans l'établissement
- Notes par trimestre, par matière, par année
- Historique des présences et absences (toutes années)
- Historique disciplinaire
- Bulletins de toutes les années (PDF téléchargeables)
- Livres empruntés à la bibliothèque (si module activé)
- Activités extrascolaires auxquelles l'élève a participé

**Transfert d'Élève :**
- Transfert vers une autre classe (interne)
- Transfert vers un autre niveau (promotion ou redoublement)
- Chaque transfert enregistre : date, raison, classe source, classe destination, décidé par
- En cas de redoublement : copie du profil dans la nouvelle année scolaire, accès à l'ancien dossier en lecture seule

**Impression & Export :**
- Carte d'élève physique (PDF avec photo, nom, classe, code-barres, logo école)
- Attestation de scolarité (PDF officiel avec signature et tampon)
- Certificat de transfert
- Fiche de renseignements complète (pour réunions parents)
- Liste de classe (avec ou sans photos)

### 4.2 Gestion des Enseignants

**Profil Enseignant :**
- Informations personnelles complètes + photo
- Numéro de carte professionnelle
- Matière(s) principale(s) enseignée(s)
- Niveau d'expérience + diplômes
- Classes et matières assignées (par année scolaire)
- Professeur principal de quelle(s) classe(s)
- Disponibilités (jours et heures) — utilisé pour la détection de conflits d'emploi du temps
- Type de contrat : permanent / contractuel / vacataire
- Informations bancaires (pour le module finance — salaires)

**Gestion des Assignations :**
- Assigner un enseignant à une matière dans une classe spécifique
- Assigner un enseignant comme professeur principal d'une classe
- Historique de toutes les assignations passées
- Charge horaire hebdomadaire calculée automatiquement
- Alerte si un enseignant dépasse la charge horaire maximale réglementaire

**Suivi de l'Enseignant :**
- Notes saisies par trimestre (suivi du respect des délais)
- Taux de soumission de présences (pourcentage de marquage à l'heure)
- Dernière connexion sur l'application mobile
- Absences enseignant (déclarées par l'admin)
- Remplaçant désigné en cas d'absence

### 4.3 Gestion et Suivi des Absences & Retards

**Marquage des Présences (depuis l'admin panel) :**
- Vue quotidienne par classe avec statut de marquage
- Indicateur : "Présences marquées" ✅ / "Non marquées" ⏳ par enseignant et par session
- Possibilité pour l'admin de marquer les présences si l'enseignant ne l'a pas fait
- Vue globale de l'école : toutes les classes, taux de marquage du jour

**Gestion des Absences :**
- Enregistrement de l'absence : date, session (matin/après-midi), motif (si connu)
- Statut de justification : non justifiée / justification soumise / justifiée / refusée
- Upload du justificatif (certificat médical, etc.)
- Notification automatique au parent à la détection de l'absence
- Notification à l'admin si l'élève est absent depuis 3 jours consécutifs sans justification

**Workflow de Justification des Absences :**
```
Parent soumet justification depuis l'app mobile (texte + photo du justificatif)
  → Admin reçoit notification dans le panneau
    → Admin révise le justificatif
      → Admin approuve : absence marquée "justifiée" dans le dossier
      → Admin rejette : parent notifié avec raison du rejet
```

**Gestion des Retards :**
- Enregistrement du retard : heure d'arrivée, durée de retard, motif
- Cumul mensuel et annuel par élève
- Seuil configurable : alerte après N retards dans le mois
- Intégration avec le module empreintes (si activé) pour marquage automatique des retards

**Rapports d'Assiduité :**
- Rapport mensuel par classe : tableau avec tous les élèves, absences par jour
- Rapport par élève : calendrier visuel (présent=vert, absent=rouge, retard=orange, férié=gris)
- Rapport annuel récapitulatif par élève
- Classement par assiduité dans la classe
- Rapport pour l'admin : enseignants avec taux de marquage faible
- Export Excel de tous les rapports

**Alertes Automatiques (Tâches Celery) :**
- Chaque matin à 8h : résumé des absences de la veille envoyé à l'admin
- Si un élève dépasse le seuil d'absentéisme : alerte parent + admin + superviseur
- Si un enseignant n'a pas marqué les présences avant 10h : rappel automatique

### 4.4 Gestion du Personnel Administratif

**Profil du Personnel Administratif :**
- Informations personnelles complètes
- Poste occupé (secrétaire, comptable, bibliothécaire, surveillant, etc.)
- Date d'embauche + type de contrat
- Rôle d'accès dans l'application (quel rôle leur est assigné)
- Présences et absences (suivi horaire)
- Documents RH (contrat, justificatifs, diplômes) — upload PDF

**Gestion des Présences du Personnel :**
- Pointage d'arrivée et de départ (manuel ou via empreintes)
- Calcul automatique des heures travaillées
- Gestion des congés : type (annuel, maladie, exceptionnel), dates, statut d'approbation
- Solde de congés restants affiché
- Calcul des heures supplémentaires

### 4.5 Matières et Emploi du Temps

**Gestion des Matières :**
- Création des matières par section et niveau
- Coefficient de chaque matière (configurable par niveau)
- Matières obligatoires vs optionnelles
- Couleur associée à chaque matière (affichée dans l'emploi du temps)
- Matières officielles algériennes pré-configurées par niveau (avec possibilité d'ajout)

**Emploi du Temps — Fonctionnalités Avancées :**
- Interface drag-and-drop intuitive
- Définition des créneaux horaires (par exemple : 8h-9h, 9h-10h, etc.)
- Définition des salles disponibles et leur capacité
- Affectation : enseignant + matière + classe + salle + créneau
- Détection automatique de conflits en temps réel :
  - Même enseignant dans deux classes au même créneau
  - Même classe avec deux cours au même créneau
  - Même salle avec deux groupes au même créneau
  - Enseignant indisponible à ce créneau (selon ses disponibilités)
- Validation de l'emploi du temps avant publication
- Publication avec notification push aux élèves et parents
- Gestion des modifications ponctuelles (cours annulé, salle changée)
- Export PDF de l'emploi du temps (pour affichage en classe ou envoi aux familles)
- Vue par enseignant, par classe, par salle, par jour

### 4.6 Gestion des Notes & Bulletins

**Workflow de Saisie et Publication des Notes :**
```
Enseignant saisit les notes (brouillon, non visible)
  → Enseignant soumet à l'admin
    → Admin reçoit notification et révise
      → Admin publie (notes visibles élève + parent instantanément)
      → OU Admin retourne avec commentaire (enseignant renotifié)
```

**Saisie des Notes (Admin Panel) :**
- Vue de toutes les soumissions en attente (classées par urgence / date de soumission)
- Révision note par note ou validation en masse
- Ajout de commentaires de correction avant publication
- Historique immuable : une fois publiée, une note ne peut plus être modifiée (amendement = nouveau record)
- Gestion des cas spéciaux : absence à l'examen (ABS), dispensé (DISP), en cours (EC)

**Calculs Automatiques :**
- Moyenne trimestrielle = Σ(note × coefficient) ÷ Σ(coefficients)
- Moyenne annuelle = (T1 + T2 + T3) ÷ 3
- Rang dans la classe (calculé au moment de la publication de chaque trimestre)
- Mention (si applicable selon les règles configurées)
- Indicateur de passage / redoublement basé sur les seuils

**Bulletins :**
- Template de bulletin personnalisable par école (logo, couleurs, texte de pied de page, signature)
- Contenu du bulletin : infos élève, photo, classe, trimestre, toutes matières avec notes et coefficients, moyennes, rang, commentaires enseignant, appréciation générale, signature directeur
- Génération individuelle (immédiate)
- Génération par classe (ZIP de PDF, traité en background)
- Génération école entière (ZIP de PDF, traité par Celery avec barre de progression)
- Envoi automatique aux parents (notification + PDF dans l'app)
- Téléchargement, partage, impression depuis l'app mobile parent

### 4.7 Gestion des Devoirs & Ressources Pédagogiques

**Création d'un Devoir (Admin Panel ou App Enseignant) :**
- Titre, description détaillée (éditeur texte enrichi)
- Matière + Classe concernée
- Date d'échéance (avec heure)
- Pièces jointes : PDF, Word, images, liens vidéo YouTube
- Visibilité : tous les élèves de la classe / groupes spécifiques
- Rappel automatique : J-3, J-1 avant l'échéance (notification push)
- Suivi des accusés de lecture (qui a vu le devoir)
- Marquage "corrigé et rendu" par l'enseignant

**Ressources Pédagogiques :**
- Upload de supports de cours : PDF, PowerPoint, images, vidéos, liens
- Organisation par matière et chapitre/unité/thème
- Tags de recherche
- Disponibilité immédiate pour les élèves assignés
- Statistiques de téléchargement (combien d'élèves ont téléchargé chaque ressource)
- Version historique : conserver les anciennes versions d'un document

### 4.8 Module Disciplinaire

**Saisie d'un Incident :**
- Déclenché par un enseignant (via l'app mobile) ou un admin
- Informations de l'incident : date, heure, lieu, description détaillée
- Niveau de sévérité : Bon comportement / Avertissement / Incident grave
- Témoins (autres enseignants ou élèves)
- Action prise immédiatement

**Workflow de Traitement :**
```
Enseignant rapporte incident
  → Notification à l'admin
    → Admin révise et valide
      → Notification parent (automatique pour avertissement et grave)
      → Note disciplinaire ajoutée au dossier de l'élève
      → Résolution documentée (action corrective prise)
```

**Suivi et Rapports :**
- Compteur d'avertissements par trimestre par élève
- Alerte automatique si l'élève atteint N avertissements dans le trimestre (configurable)
- Historique disciplinaire complet (jamais effacé, accessible par l'admin uniquement)
- Dossier disciplinaire imprimable (PDF) pour réunions parents
- Note de conduite optionnelle dans le bulletin (sur 5 ou appréciation textuelle)
- Comparatif disciplinaire entre classes (pour l'admin)

### 4.9 Rapports et Statistiques Pédagogiques

**Analytics Académiques :**
- Moyenne par matière dans toutes les classes
- Taux de réussite/échec par classe, par niveau, par section
- Comparaison de performance entre classes de même niveau
- Classement top 10 élèves par niveau
- Évolution des moyennes par trimestre (courbes)
- Détection automatique des élèves à risque (en dessous du seuil de passage)
- Alertes prédictives : si la trajectoire de T1 à T2 est négative, alerte préventive

**Analytics Enseignants (Admin uniquement) :**
- Moyenne de classe par enseignant (comparaison interne)
- Taux de soumission des présences dans les délais
- Respect des délais de saisie des notes
- Ces données sont strictement confidentielles, jamais partagées

**Exports Disponibles :**
- Export Excel par classe et par trimestre
- Export au format officiel du Ministère de l'Éducation (modèle officiel)
- Préparation aux examens officiels : BEP (5AP), BEM (4AM), BAC (3AS)
- Rapport de candidature aux examens nationaux

---

## 5. MODULE 2 — Gestion Empreintes

> Nécessite un dispositif hardware compatible (lecteur d'empreintes USB ou réseau).

### 5.1 Enregistrement des Empreintes

**Processus d'Enregistrement :**
- Enregistrement depuis l'interface admin web (connecté au lecteur hardware)
- Capture de 2 doigts minimum par élève (index gauche + index droit recommandés)
- 3 captures par doigt pour assurer la qualité de la lecture
- Lien automatique avec le dossier de l'élève (via student_id)
- Statut d'enregistrement : enregistré / non enregistré / à renouveler
- Photo de l'élève affichée pendant l'enregistrement pour confirmation

**Stockage Sécurisé :**
- Les templates biométriques sont stockés chiffrés (AES-256)
- Jamais stockés en clair dans la base de données
- Conformité avec la réglementation algérienne sur les données biométriques
- Les templates ne peuvent pas être extraits (one-way hashing)
- Droit d'accès aux données biométriques : admin uniquement

### 5.2 Système de Pointage Automatique

**Marquage des Présences par Empreinte :**
- L'élève pose le doigt sur le lecteur à l'entrée de l'établissement
- La présence est marquée automatiquement (pas besoin d'intervention de l'enseignant)
- Heure exacte enregistrée
- Si l'heure dépasse l'heure de début de cours : marqué automatiquement en retard
- Notification parent immédiate : "Votre enfant est arrivé à l'école à [heure]"

**Gestion des Retards via Empreintes :**
- Seuil de retard configurable (ex. : après 8h15, considéré en retard)
- Calcul automatique de la durée du retard
- Enregistrement avec timestamp exact
- Rapport mensuel automatique des retards par élève

**Synchronisation avec le Module Pédagogique :**
- Les présences enregistrées par empreinte alimentent automatiquement le système de présences
- L'enseignant voit les présences pré-remplies pour les élèves qui ont pointé
- Il peut encore marquer absent un élève qui a pointé (cas de départ anticipé)

### 5.3 Rapports Empreintes

- Rapport quotidien : arrivées par heure (graphique courbe)
- Rapport mensuel par élève : absences et retards enregistrés
- Rapport de performance du système : taux de reconnaissance réussi
- Alertes : élèves dont l'empreinte est difficile à lire (vieillissement du template)
- Rapport comparatif : présence pointée vs présence marquée par l'enseignant (pour détecter les anomalies)

### 5.4 Intégration Hardware

- Support des principaux lecteurs du marché : ZKTeco, Suprema, DigitalPersona
- Communication via API REST locale ou connexion directe au PC admin
- Mode fallback : si le lecteur est hors service, retour au marquage manuel sans perte de données
- Diagnostic du lecteur depuis l'interface admin (test de connexion, qualité du capteur)

---

## 6. MODULE 3 — Gestion Finance

### 6.1 Frais de Scolarité

**Configuration des Frais :**
- Montant par section (Primaire / CEM / Lycée) et par année scolaire
- Modalités de paiement : annuel (en une fois) / trimestriel (3 fois) / mensuel (10 fois)
- Réductions configurables : fratrie (2ème enfant -10%, 3ème -20%), boursier, exceptionnel
- Pénalités de retard : pourcentage ou montant fixe par semaine de retard
- Dépôt d'inscription (versement initial non remboursable)
- Frais supplémentaires optionnels : activités extrascolaires, cantine, transport (si ces modules sont activés)

**Suivi des Paiements par Élève :**
- Tableau de bord par élève : montant total dû, déjà payé, solde restant, prochaine échéance
- Historique détaillé de tous les paiements effectués
- Statut de paiement : Payé ✅ / Paiement Partiel 🟡 / Impayé 🔴 / En Retard ⏰
- Enregistrement d'un paiement : montant, date, mode de paiement, référence, enregistré par qui

**Modes de Paiement Supportés :**
- Espèces (avec numéro de reçu obligatoire)
- CCP (numéro de virement CCP)
- BaridiMob (référence transaction)
- CIB / Virement Bancaire (référence virement)
- Paiement partiel (acompte)

**Génération des Reçus :**
- Reçu PDF auto-généré à chaque enregistrement de paiement
- Numéro de reçu séquentiel unique par école
- Contenu : nom école + logo, nom élève, classe, montant, date, mode de paiement, référence, nom du caissier
- Envoi automatique au parent par notification push (PDF dans l'app)
- Impression directe depuis l'interface admin

**Rappels Automatiques :**
- Celery Beat déclenche des rappels selon un calendrier configurable
- J-7 avant l'échéance : notification push au parent
- J0 (jour d'échéance) : rappel final
- J+3 (retard) : notification de retard avec montant de pénalité
- Possibilité de désactiver les rappels par élève (cas de convention spéciale)

### 6.2 Salaires du Personnel

**Configuration des Salaires :**
- Grille salariale configurable par poste et par qualification
- Salaire de base mensuel ou taux horaire
- Primes : ancienneté, performance, heures supplémentaires
- Retenues : assurance, impôts, avances sur salaire, absences injustifiées
- Barème d'heures supplémentaires (taux normal, taux majoré)
- Calcul automatique des congés payés

**Calcul Mensuel Automatique :**
- Celery tâche mensuelle automatique le dernier jour du mois
- Récupération des heures travaillées depuis le système de présences
- Application de la grille salariale
- Calcul des déductions et primes
- Génération du brut et du net
- Statut de paie : calculé / vérifié / payé

**Fiches de Paie :**
- Fiche de paie PDF conforme aux standards algériens
- Contenu : informations employé, période, salaire brut, détail des primes, détail des retenues, salaire net, mode de virement
- Distribution sécurisée : accessible dans l'application mobile enseignant (section "Salaire")
- Historique des 24 derniers mois accessible en permanence
- Impressions depuis l'interface admin

**Gestion des Avances :**
- Enregistrement d'une avance sur salaire (montant, date, motif)
- Déduction automatique sur le prochain salaire
- Historique des avances par employé

### 6.3 Dépenses et Recettes

**Gestion des Dépenses :**
- Catégories de dépenses personnalisables : fournitures scolaires, entretien, électricité, salaires, etc.
- Saisie d'une dépense : montant, date, catégorie, description, justificatif (scan de facture upload)
- Approbation des dépenses (workflow : saisie par secrétaire → validation par directeur)
- Budget annuel par catégorie avec suivi de consommation (graphique)
- Alerte si dépassement de budget d'une catégorie

**Gestion des Recettes :**
- Sources de revenus : frais de scolarité, subventions, activités, dons
- Enregistrement manuel des recettes exceptionnelles
- Réconciliation automatique avec les paiements de frais

**Comptabilité :**
- Tableau de bord financier : recettes vs dépenses du mois
- Flux de trésorerie (cash flow) sur les 12 derniers mois
- Solde de trésorerie estimé
- Graphiques : camembert des dépenses par catégorie, courbe des recettes

### 6.4 Rapports Financiers

- Rapport mensuel complet (recettes, dépenses, balance)
- Rapport annuel de synthèse (bilan de l'année scolaire)
- Rapport d'impayés : liste de tous les élèves avec montants dus
- Rapport de recouvrement : évolution des paiements mois par mois
- Rapport de masse salariale mensuelle et annuelle
- Rapport dépenses par catégorie avec comparatif N vs N-1
- Export Excel de tous les rapports
- Export PDF pour présentation au conseil d'administration

---

## 7. MODULE 4 — Gestion Cantine

### 7.1 Gestion des Inscriptions

**Inscription à la Cantine :**
- Inscription par élève (pas toute la classe obligatoirement)
- Dates de validité de l'inscription (peut être temporaire)
- Fréquence : tous les jours / jours spécifiques de la semaine
- Tarif cantine (lien avec module finance si activé)

**Profil Nutritionnel de l'Élève :**
- Allergies alimentaires : arachides, gluten, lactose, fruits de mer, etc.
- Régimes spéciaux : végétarien, halal strict, régime médical
- Restrictions médicales (importées depuis les informations médicales du profil si renseignées)
- Badge visuel sur le profil cantine : "ALLERGIE" avec détail

**Tableau de Bord Cantine :**
- Nombre d'élèves inscrits par jour
- Résumé des restrictions alimentaires (pour la cuisine)
- Présences cantine du jour
- Alertes : élèves avec allergies non prises en compte dans le menu du jour

### 7.2 Gestion des Menus

**Planification des Menus :**
- Création de menus sur des périodes : journée, semaine, mois, trimestre
- Chaque journée : entrée, plat principal, dessert, boisson
- Option : plat alternatif (pour les régimes spéciaux)
- Calcul nutritionnel approximatif (calories, protéines, glucides)
- Marquage des allergènes sur chaque plat
- Alerte automatique si un plat contient un allergène présent chez un élève inscrit

**Diffusion des Menus :**
- Envoi automatique du menu de la semaine chaque dimanche soir (via notification push)
- Visible dans l'application parent et élève
- Vue jour par jour avec détail des plats
- Option parents : commenter ou signaler un plat

**Gestion des Stocks (Simple) :**
- Estimation des quantités à préparer selon le nombre d'inscrits
- Rapport de besoin hebdomadaire (pour les achats)

### 7.3 Rapports Cantine

- Nombre d'élèves par jour sur le mois (graphique)
- Rapport mensuel de fréquentation
- Liste des élèves avec restrictions alimentaires
- Rapport des menus servis sur la période
- Export Excel pour la comptabilité des dépenses cantine

---

## 8. MODULE 5 — Gestion Transport

### 8.1 Gestion des Lignes

**Création d'une Ligne de Transport :**
- Nom de la ligne (ex. : "Ligne 3 — Bab Ezzouar")
- Description de l'itinéraire
- Communes et quartiers desservis
- Points d'arrêt avec noms et coordonnées GPS (optionnel)
- Heure de départ le matin (domicile → école)
- Heure de départ le soir (école → domicile)
- Numéro de plaque du bus
- Capacité maximum d'élèves
- Statut : actif / suspendu / maintenance

**Horaires et Arrêts :**
- Liste ordonnée des arrêts avec horaire de passage à chaque arrêt
- Heure estimée d'arrivée à l'école
- Variantes selon les jours (ex. : horaire différent le mercredi)

### 8.2 Gestion des Chauffeurs

**Profil Chauffeur :**
- Informations personnelles complètes + photo
- Numéro de permis de conduire (catégorie D obligatoire)
- Date d'expiration du permis (alerte avant expiration)
- Numéro de CIN et assurance professionnelle
- Ligne(s) assignée(s)
- Téléphone direct (partagé avec les parents via l'app mobile)
- Historique des incidents signalés

**Carte d'Identification Chauffeur :**
- Génération d'une carte PDF officielle
- Photo, nom, permis, lignes assignées, contact école
- Obligatoire à afficher dans le bus

### 8.3 Affectation des Élèves

**Affectation d'un Élève à une Ligne :**
- Adresse domicile de l'élève (importée du profil élève)
- Suggestion automatique de la ligne la plus proche (si coordonnées GPS disponibles)
- Arrêt de montée + arrêt de descente
- Heure estimée de passage à l'arrêt de l'élève
- Abonnement transport (lien avec module finance)

**Vue d'Ensemble :**
- Nombre d'élèves par ligne (avec capacité restante)
- Carte des lignes avec arrêts (si GPS activé)
- Liste d'attente si une ligne est pleine
- Alerte si une ligne dépasse sa capacité

### 8.4 Notifications Transport

**Notifications Automatiques :**
- Rappel hebdomadaire des horaires aux parents
- Notification en cas de retard du bus (saisie par l'admin ou le responsable transport)
- Notification en cas d'annulation d'une ligne
- Notification de modification permanente d'horaire

**Suivi GPS (Optionnel — Extension Premium) :**
- Intégration d'un tracker GPS sur le bus
- Les parents peuvent voir en temps réel la position du bus dans l'application
- Notification automatique quand le bus est à 5 minutes de l'arrêt de l'élève
- Historique des trajets

### 8.5 Rapports Transport

- Rapport mensuel d'utilisation par ligne
- Rapport de ponctualité (retards enregistrés)
- Rapport de fréquentation (élèves utilisant le transport par mois)
- Rapport de revenus transport (si module finance activé et frais transport configurés)

---

## 9. MODULE 6 — Auto-Éducation (E-Learning)

### 9.1 Bibliothèque Numérique

**Contenu Disponible :**
- Contenu ILMI global (fourni par l'équipe ILMI) :
  - Manuels scolaires officiels algériens numérisés (tous niveaux)
  - Cours vidéo alignés sur le programme algérien
  - Résumés de cours par matière et par niveau
- Contenu école (uploadé par les enseignants ou l'admin) :
  - Supports de cours spécifiques à l'école
  - Documents créés par les enseignants

**Organisation du Contenu :**
- Navigation par : Section → Niveau → Matière → Chapitre
- Tags de recherche (mots-clés)
- Recherche plein texte dans les titres et descriptions
- Favoris : l'élève peut "bookmarker" des ressources
- Historique de navigation

**Accès Offline :**
- Téléchargement des ressources pour accès sans connexion
- Lecture dans l'app mobile (PDF viewer intégré, lecteur vidéo)

### 9.2 Exemples d'Examens et Devoirs

**Banque d'Examens :**
- Banque d'examens passés (BEP, BEM, BAC) des 5 dernières années
- Exercices de pratique par matière et par niveau
- Sujets d'examen blancs créés par les enseignants de l'école
- Solutions corrigées (visibles après tentative ou selon paramétrage)

**Recherche dans la Banque :**
- Filtres : niveau, matière, année, type (examen officiel / exercice / devoir maison)
- Téléchargement PDF
- Impression directe

### 9.3 Évaluations Continues (Quiz en ligne)

**Création de Quiz (Enseignant via App ou Admin via Web) :**
- Titre et description du quiz
- Matière, niveau, chapitre concerné
- Durée limitée (compte à rebours)
- Types de questions : QCM, vrai/faux, texte libre
- Notation automatique des QCM et vrai/faux
- Option : afficher les corrections immédiatement après ou après la clôture

**Passage d'un Quiz (Élève) :**
- Quiz disponible dans l'application élève (section Auto-Éducation)
- Compte à rebours visible pendant le quiz
- Soumission automatique à la fin du temps imparti
- Résultat affiché immédiatement (si paramétré ainsi)
- Possibilité de repassage si l'enseignant l'autorise

**Analytics des Quiz :**
- Taux de réussite par question (pour identifier les points difficiles)
- Moyenne de la classe sur chaque quiz
- Comparaison performance quiz vs examen officiel
- Rapport par élève : quiz passés, scores, évolution

### 9.4 Analyse des Résultats et Suivi des Progrès

**Pour l'Élève :**
- Dashboard de progression : pourcentage du programme "vu" par matière
- Graphiques d'évolution des scores dans les quiz
- Points forts et points faibles détectés automatiquement
- Recommandations de ressources à revoir (basées sur les erreurs répétées)

**Pour l'Enseignant :**
- Vue d'ensemble de l'utilisation de l'Auto-Éducation par sa classe
- Élèves les plus actifs vs les plus passifs
- Corrélation entre activité e-learning et notes aux examens
- Recommandation : ressource à travailler en classe (basée sur les erreurs collectives)

---

## 10. MODULE 7 — Messagerie SMS

### 10.1 Configuration SMS

**Paramètres :**
- Intégration avec les principales passerelles SMS algériennes
- Nom d'expéditeur configurable (ex. : "EcolePrivée")
- Quota SMS mensuel (acheté séparément ou inclus selon le plan)
- Solde SMS affiché dans le panneau admin
- Alerte quand le solde tombe sous un seuil configurable

**Types de Messages SMS :**
- Messages automatiques (déclenchés par des événements système)
- Messages manuels (envoyés par l'admin)
- Messages groupés (à une classe, une section, tous les parents)

### 10.2 Messages Automatiques

**Événements déclenchant un SMS :**
- Absence d'un élève (priorité haute — SMS envoyé en 10 minutes)
- Premier arrivée du jour de l'élève à l'école
- Note en dessous du seuil de passage publiée
- Rappel de paiement de frais de scolarité (J-7, J0, J+3)
- Annonce urgente de l'école (directeur)
- Rappel d'un événement scolaire la veille

**Gabarit des Messages SMS :**
- Templates pré-rédigés en Français et Arabe
- Variables dynamiques : [NOM_ELEVE], [CLASSE], [DATE], [MONTANT], etc.
- Longueur optimisée pour tenir en 1 SMS (160 caractères)
- Preview avant envoi

### 10.3 Campagnes SMS Manuelles

**Envoi Manuel :**
- Sélection des destinataires : tous les parents / parents d'une classe / parents d'une section / individus spécifiques
- Rédaction du message (avec compteur de caractères)
- Preview du message final avec variables remplacées
- Envoi immédiat ou programmé (date/heure)
- Confirmation avant envoi avec affichage du coût en SMS units

**Rapports SMS :**
- Nombre de SMS envoyés par jour, semaine, mois
- Taux de livraison (delivered vs failed)
- Coût mensuel des SMS
- Historique de tous les SMS envoyés avec statut de livraison

---

## 11. MODULE 8 — Gestion Bibliothèque

### 11.1 Catalogue des Livres

**Enregistrement d'un Livre :**
- ISBN (scan de code-barres si scanner connecté)
- Titre, auteur(s), éditeur
- Année d'édition + Edition
- Catégorie : manuel scolaire / roman / science / religion / encyclopédie / magazine
- Sous-catégorie + matière associée (si manuel scolaire)
- Niveaux scolaires concernés
- Description / résumé
- Langue (Arabe / Français / Anglais)
- Nombre d'exemplaires possédés
- Localisation dans la bibliothèque (étagère, rayon)
- Photo de couverture (upload)
- Exemplaires disponibles vs empruntés (en temps réel)

**Gestion des Exemplaires :**
- Chaque exemplaire a son propre ID (ex. : ISBN-001, ISBN-002)
- État de l'exemplaire : bon état / usage normal / à remplacer / perdu
- Si exemplaire perdu ou très abîmé : fiche de responsabilité générée automatiquement

### 11.2 Gestion des Prêts

**Processus d'Emprunt :**
- Recherche de l'élève (par nom ou ID)
- Recherche du livre (par titre, auteur, ISBN, catégorie)
- Enregistrement de l'emprunt : élève, exemplaire, date d'emprunt, date de retour prévue
- Durée de prêt configurable (par défaut : 2 semaines)
- Limite du nombre de livres empruntés simultanément (configurable)
- Impression du bon de prêt (optionnel)

**Processus de Retour :**
- Scan de l'ID de l'exemplaire ou recherche manuelle
- Vérification de l'état à la remise
- Si retard : calcul automatique du nombre de jours de retard
- Si livre endommagé : signalement et fiche de dommages

**Rappels et Alertes :**
- Rappel automatique J-3 avant la date de retour prévue (notification push à l'élève)
- Rappel J0 (date limite atteinte)
- Alerte au bibliothécaire si un élève est en retard de plus de 7 jours
- Notification parent si l'élève est en retard (escalade)
- Blocage automatique des nouveaux emprunts si retard non résolu

**Demandes de Livres :**
- L'élève peut faire une demande de réservation pour un livre actuellement emprunté
- File d'attente : premier arrivé, premier servi
- Notification quand le livre est disponible
- Annulation si l'élève ne vient pas chercher dans les 3 jours

### 11.3 Recherche et Navigation

**Interface de Recherche :**
- Recherche multi-critères : titre, auteur, catégorie, matière, niveau, langue
- Filtre de disponibilité : disponible maintenant / disponible sous N jours
- Tri par : pertinence, popularité (nombre d'emprunts), date d'ajout, alphabétique
- Résultats avec couverture, disponibilité, résumé
- Vue grille et vue liste

**Accessible aux Élèves (via App Mobile) :**
- Catalogue complet consultable
- Voir si un livre est disponible avant de venir
- Faire une demande de réservation directement depuis l'app
- Voir l'historique de ses emprunts et retours

### 11.4 Rapports Bibliothèque

- Livres les plus empruntés (par mois, par trimestre)
- Taux d'utilisation de la bibliothèque par classe
- Liste des emprunts en retard (avec coordonnées des élèves)
- Rapport de stock : exemplaires disponibles vs manquants vs perdus
- Rapport annuel de la bibliothèque pour le directeur
- Suggestions d'acquisition (livres souvent demandés mais non disponibles)

---

## 12. MODULE 9 — Infirmerie Scolaire

> Module dédié à la gestion médicale des élèves. Accessible uniquement par le rôle NURSE et le SCHOOL_ADMIN. Les données médicales sont chiffrées séparément (clé AES-256 dédiée) et jamais exposées aux autres rôles.

### 12.1 Profil du Rôle Infirmier

L'infirmier scolaire dispose d'un espace totalement isolé des autres modules. Il ne voit aucune note, aucune donnée financière, aucun emploi du temps. Son interface est entièrement centrée sur la santé des élèves. Plusieurs comptes peuvent être créés par école (infirmier principal + assistant) avec des niveaux d'accès différenciés si nécessaire.

**Ce que l'infirmier PEUT faire :**
- Consulter et modifier les dossiers médicaux de tous les élèves
- Créer des fiches de consultation
- Envoyer des messages et notifications aux parents
- Soumettre des justifications d'absence pour raison médicale
- Déclencher des protocoles d'urgence
- Générer des rapports sanitaires

**Ce que l'infirmier NE PEUT PAS faire :**
- Voir les notes, bulletins, devoirs d'un élève
- Accéder aux données financières
- Modifier les présences scolaires (il soumet une justification, c'est l'admin qui valide)
- Voir les dossiers d'élèves d'une autre école

---

### 12.2 Dossier Médical de l'Élève

Chaque élève possède un dossier médical complet et confidentiel, distinct de son dossier scolaire.

#### Informations de Base
- Groupe sanguin (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Poids et taille avec historique horodaté (courbe de croissance consultable sur graphique)
- IMC calculé automatiquement avec indicateur (sous-poids / normal / surpoids / obèse) selon les seuils pédiatriques par âge
- Médecin traitant : nom, spécialité, numéro de téléphone, adresse cabinet
- Mutuelle / assurance santé : compagnie, numéro de police, date d'expiration
- Numéro de carte CNAS / CASNOS (si applicable)
- Médecin scolaire référent (si l'école en dispose un)

#### Antécédents Médicaux
- Maladies chroniques déclarées : diabète de type 1, asthme, épilepsie, hypertension, cardiopathie congénitale, drépanocytose, troubles thyroïdiens, etc.
- Pour chaque maladie chronique : date de diagnostic, traitement en cours, médecin spécialiste suivi, fréquence des crises si applicable
- Maladies infantiles passées avec dates approximatives : varicelle, rougeole, oreillons, rubéole, scarlatine
- Interventions chirurgicales : type d'opération, date, établissement, complications éventuelles
- Hospitalisations passées : raison, durée, établissement, année
- Antécédents familiaux pertinents (déclarés par les parents) : diabète, épilepsie, maladies cardiaques, troubles psychiatriques

#### Allergies — Section Critique
- **Allergies médicamenteuses** : pénicilline, amoxicilline, aspirine, ibuprofène, sulfamides, anesthésiques locaux, produits de contraste, etc.
  - Pour chaque allergie : niveau de sévérité (légère / modérée / anaphylactique), symptômes déclenchés (urticaire, œdème, choc), conduite à tenir
- **Allergies alimentaires** : arachides, fruits à coque, gluten, lactose, œufs, crustacés, poissons, soja, sésame
  - Niveau de sévérité, symptômes, présence d'un auto-injecteur d'adrénaline (EpiPen) à l'infirmerie
- **Allergies environnementales** : pollen, acariens, poils d'animaux, latex, insectes (abeilles, guêpes), moisissures
- **Badge d'alerte rouge** affiché en haut du profil infirmerie de l'élève si allergie anaphylactique déclarée
- **Intégration avec le module Cantine** : si une allergie alimentaire est déclarée, le responsable cantine est automatiquement alerté lors de la création ou modification du menu si un plat contient l'allergène concerné

#### Médicaments en Cours
- Nom du médicament (DCI + nom commercial), dosage exact, voie d'administration (orale, inhalée, injectable)
- Fréquence et horaire de prise (ex. : 1 comprimé le matin avant le repas)
- Médicaments physiquement stockés à l'infirmerie pour l'élève : ventoline, insuline, antiépileptiques d'urgence, EpiPen
- Quantité en stock avec alerte automatique si le stock tombe à zéro ou sous un seuil configurable (notification push à l'infirmier + au parent)
- Date de début et date de fin du traitement
- Médecin prescripteur
- Upload de l'ordonnance médicale (PDF ou photo — stocké chiffré)
- Historique complet de tous les médicaments passés avec dates

#### Vaccinations
- Calendrier vaccinal algérien officiel pré-configuré : BCG, DTP-Hib-Hep B, Polio, ROR (Rougeole-Oreillons-Rubéole), Hépatite B, Varicelle, Méningite, etc.
- Pour chaque vaccin : statut (fait / non fait / en retard / non applicable), date d'administration, établissement, numéro de lot
- Rappels à faire avec dates prévues affichées dans un calendrier dédié
- Notification automatique au parent J-30 et J-7 avant un rappel vaccinal prévu
- Upload du carnet de vaccination scanné (PDF ou photo, stocké dans le dossier)
- Taux de couverture vaccinale global de l'école (stat pour le directeur et pour les rapports à la DSP)

#### Handicaps et Besoins Spéciaux
- Type de handicap : moteur (fauteuil roulant, béquilles), visuel (malvoyant, aveugle), auditif (malentendant, sourd), cognitif (dyslexie, dyscalculie, TDAH), troubles du spectre autistique (TSA), troubles du langage
- Niveau d'autonomie : totalement autonome / partiellement autonome / dépendant
- Aménagements scolaires nécessaires : place spécifique en classe (premier rang, proche de la fenêtre), temps supplémentaire aux examens (tiers-temps), accès rampe/ascenseur, support pédagogique adapté, accompagnateur
- Ces informations d'aménagement sont **partagées en lecture seule avec l'enseignant de la classe** — uniquement les aménagements requis, sans aucun détail médical. L'enseignant voit par exemple "cet élève bénéficie d'un tiers-temps aux examens" sans voir le diagnostic.
- Plan d'Accompagnement Personnalisé (PAP) : document uploadable et consultable

#### Suivi Psychologique et Social (Confidentiel)
- Signalement de situations de vulnérabilité sociale (déclaré par l'infirmier ou l'enseignant avec accord du directeur)
- Suivi psychologique en cours : oui / non, thérapeute référent
- Situations familiales particulières déclarées pouvant impacter la santé scolaire
- Ces informations sont accessibles uniquement par le SCHOOL_ADMIN et le NURSE — jamais par les enseignants

---

### 12.3 Consultations & Visites à l'Infirmerie

Chaque visite génère une fiche de consultation horodatée et immuable.

#### Création d'une Fiche de Consultation
- Recherche de l'élève par nom, classe ou ID
- Date et heure de la visite (auto-remplie, modifiable)
- Motif de la visite — liste déroulante + champ libre :
  - Douleur abdominale / Nausées / Vomissements
  - Fièvre / Malaise général
  - Blessure / Traumatisme (chute, coupure, contusion)
  - Céphalée / Migraine
  - Crise d'asthme / Difficultés respiratoires
  - Problème dermatologique (rash, allergie cutanée)
  - Douleur dentaire
  - Stress / Anxiété / Trouble du comportement
  - Problème ophtalmologique (yeux rouges, irritation)
  - Autre (champ texte libre)
- Description des symptômes observés par l'infirmier
- Constantes mesurées et enregistrées :
  - Température (°C) avec indicateur fièvre si > 38°C
  - Tension artérielle (systolique / diastolique)
  - Saturation en oxygène (SpO2 %)
  - Pouls (bpm)
  - Glycémie capillaire (mmol/L) — affiché uniquement si l'élève est diabétique
  - Poids et taille (mis à jour dans le dossier si mesurés)
- Soins prodigués : pansement simple, désinfection, compresse froide/chaude, médicament administré (lequel, quelle dose, à quelle heure)
- Résultat / Suite donnée :
  - Retour en classe (avec ou sans recommandation)
  - Repos à l'infirmerie (durée estimée)
  - Contact parent nécessaire
  - Envoi aux urgences / hôpital
  - Renvoi à domicile avec les parents
- Durée totale de présence à l'infirmerie
- Observations libres et recommandations de l'infirmier
- Pièce jointe optionnelle (photo de la blessure, ordonnance du médecin)

#### Notifications Automatiques depuis l'Infirmerie
- Si "Contact parent" sélectionné : notification push + SMS envoyés simultanément avec résumé non-médical ("Votre enfant se trouve à l'infirmerie, veuillez contacter l'école")
- Si "Envoi aux urgences" : notification urgente push + SMS avec message complet + appel automatique au premier contact d'urgence déclaré
- Si "Repos à l'infirmerie" > 30 minutes : notification automatique au parent ("Votre enfant se repose à l'infirmerie depuis [heure], tout va bien")
- L'enseignant de la classe est notifié automatiquement (message neutre uniquement) : "L'élève [Prénom Nom] est absent(e) de votre cours pour raison médicale" — sans aucun détail de santé
- Toutes les notifications sont loguées avec timestamp et statut de livraison

#### Messagerie Infirmier → Parent
L'infirmier peut envoyer des messages directement aux parents d'un élève depuis l'interface infirmerie, indépendamment du système de chat général :
- Message texte libre (ton professionnel médical)
- Modèles de messages pré-rédigés :
  - "Votre enfant a reçu des soins ce jour pour [motif générique], il/elle se porte bien"
  - "Nous vous recommandons une consultation médicale dans les prochains jours"
  - "Votre enfant doit apporter son médicament [nom] dont le stock est épuisé à l'infirmerie"
  - "Rappel : le rappel vaccinal [vaccin] de votre enfant est prévu le [date]"
  - "Un incident médical s'est produit aujourd'hui, veuillez contacter l'infirmerie dès que possible"
- Pièce jointe possible (document PDF, résultat d'examen si confié à l'école)
- Le parent peut répondre depuis son application mobile
- Historique des échanges conservé dans le dossier médical de l'élève

---

### 12.4 Justification d'Absence Médicale

L'infirmerie dispose d'un canal direct pour soumettre des justifications d'absence, distinct du canal parent classique.

**Workflow de justification depuis l'infirmerie :**
```
Élève consulte l'infirmerie (ou présente un certificat médical)
  → Infirmier crée une fiche de consultation
    → Infirmier soumet une justification d'absence liée à cette consultation
      → Justification transmise automatiquement à l'admin
        → Admin valide (absence justifiée dans le dossier scolaire)
        → Parent notifié : "L'absence de votre enfant du [date] a été justifiée par l'infirmerie"
```

**Contenu de la justification soumise :**
- Date(s) d'absence concernée(s)
- Raison générique (raison médicale — sans détail de diagnostic)
- Référence à la fiche de consultation (lien interne, non visible par le parent)
- Upload du certificat médical si fourni par les parents (PDF ou photo)
- Recommandation de l'infirmier : retour autorisé / retour sous conditions (ex. : éviction pour maladie contagieuse)

**Règles :**
- La justification infirmerie a un statut prioritaire (pré-approuvée, l'admin valide en 1 clic)
- Le certificat médical uploadé est stocké dans le dossier médical chiffré, pas dans le dossier scolaire
- L'admin voit uniquement "justification médicale — infirmerie" sans accès au contenu médical

---

### 12.5 Accès Parent au Dossier Médical (Application Mobile)

Les parents peuvent consulter le dossier médical de leur enfant depuis l'application mobile parent, dans une section dédiée et sécurisée.

**Ce que le parent peut VOIR :**
- Informations de base : groupe sanguin, poids/taille actuels, médecin traitant
- Liste des allergies déclarées (avec niveaux de sévérité)
- Médicaments en cours avec posologie
- Vaccinations : statut de chaque vaccin, prochains rappels
- Historique des consultations à l'infirmerie : date, motif générique, suite donnée — sans détails cliniques rédigés par l'infirmier
- Handicaps et aménagements déclarés
- Messages envoyés par l'infirmier (historique de la messagerie)

**Ce que le parent NE PEUT PAS faire depuis l'app :**
- Modifier directement le dossier médical (il doit contacter l'infirmier ou l'admin)
- Voir les notes cliniques détaillées rédigées par l'infirmier (observations internes)
- Voir les informations de suivi psychologique/social

**Ce que le parent PEUT faire depuis l'app :**
- Répondre aux messages de l'infirmier
- Soumettre une mise à jour d'information médicale (ex. : nouveau médicament prescrit) — soumis comme demande, validée par l'infirmier avant intégration au dossier
- Uploader un nouveau certificat médical ou une nouvelle ordonnance
- Déclarer une allergie ou une maladie nouvellement diagnostiquée (en attente de validation infirmier)
- Consulter et télécharger le carnet de vaccination de son enfant

---

### 12.6 Suivi des Épidémies et Cas Collectifs

#### Tableau de Bord Épidémiologique
- Vue par classe et par section : nombre de visites sur les 7 derniers jours, classées par motif
- Graphique en barres : évolution quotidienne des consultations par motif (semaine courante vs semaine précédente)
- Détection automatique des cas groupés : si N élèves de la même classe consultent pour un même motif dans la même journée, une alerte est générée (N configurable, par défaut 3)
- Carte thermique de l'école : quelles classes ont les plus fortes concentrations de consultations

#### Maladies Contagieuses
- Signalement d'un cas confirmé : maladie, élève concerné (anonymisé dans les alertes collectives), date de début
- Durée d'éviction recommandée par maladie (pré-configurée selon les recommandations algériennes, modifiable) :
  - Varicelle : éviction jusqu'à dessèchement des lésions (minimum 5 jours)
  - Grippe : éviction 5 jours
  - Gastroentérite : éviction 48h après dernier symptôme
  - Conjonctivite bactérienne : éviction jusqu'à 24h de traitement
  - Gale : éviction jusqu'au lendemain du traitement
- Suivi des élèves évincés : liste, date d'éviction, date de retour autorisée, statut (en cours / retour autorisé)
- Notification au directeur pour décision d'information collective des parents de la classe (sans divulguer l'identité de l'élève)
- Rapport transmissible à la Direction de la Santé et de la Population (DSP) de la Wilaya, au format exportable Excel/PDF

---

### 12.7 Gestion des Urgences

#### Fiche d'Urgence Rapide
Accessible en 1 tap depuis n'importe quel écran de l'interface infirmerie, en cherchant l'élève :
- Contacts d'urgence : parent 1 (téléphone), parent 2 (téléphone), contact secondaire
- Groupe sanguin
- Allergies critiques (anaphylactiques uniquement — affichées en rouge gras)
- Médicaments vitaux disponibles à l'infirmerie
- Protocoles d'urgence personnalisés (ex. : conduite à tenir en cas de crise épileptique pour cet élève spécifique)

#### Déclenchement d'un Protocole d'Urgence
- Bouton **"URGENCE"** prominent dans l'interface (rouge, toujours visible)
- Sélection du type d'urgence :
  - Crise d'épilepsie
  - Choc anaphylactique
  - Malaise cardiaque
  - Traumatisme crânien
  - Fracture suspectée
  - Perte de connaissance
  - Détresse respiratoire sévère
  - Crise d'asthme sévère
  - Hypoglycémie sévère (élève diabétique)
  - Autre urgence
- Affichage immédiat du protocole pas-à-pas pour ce type d'urgence
- Déclenchement simultané automatique :
  - Appel téléphonique automatique au parent 1 (via intégration VoIP ou instruction d'appel)
  - SMS d'urgence au parent 1 et parent 2
  - Notification push urgente aux parents
  - Notification au SCHOOL_ADMIN avec alerte sonore
- Génération en 1 clic d'une **fiche de liaison médicale** pour le SAMU ou l'hôpital : identité de l'élève, groupe sanguin, allergies, médicaments en cours, antécédents pertinents, constantes mesurées, soins prodigués, heure de l'incident — format A4 imprimable
- Chronomètre d'urgence déclenché automatiquement (temps écoulé depuis le début de l'urgence)
- Log horodaté de toutes les actions prises (qui a fait quoi, à quelle heure — pour le rapport post-urgence)

#### Rapport Post-Urgence
- Généré automatiquement à la clôture de l'urgence
- Chronologie complète des événements
- Actions prises et soins prodigués
- Suites données (hospitalisation, retour à domicile, observation)
- Signataires : infirmier + directeur
- Archivé dans le dossier médical de l'élève
- Copie envoyée au parent par notification

---

### 12.8 Statistiques et Rapports Médicaux

#### Rapports Mensuels
- Nombre total de consultations du mois
- Répartition par motif (camembert)
- Répartition par classe et par section (barres)
- Durée moyenne des consultations
- Suites données : % retour en classe / % repos / % contact parent / % urgences
- Médicaments les plus administrés
- Absences justifiées par l'infirmerie du mois

#### Rapport Annuel de Santé Scolaire
- Synthèse de toutes les consultations de l'année
- Évolution mensuelle des visites (courbe)
- Cas groupés détectés et maladies contagieuses traitées
- Taux de couverture vaccinale de l'école
- Synthèse des handicaps et besoins spéciaux (anonymisée)
- Urgences gérées et leurs issues

#### Rapports Spécialisés
- **Rapport vaccinal complet** : liste élève par élève avec statut de chaque vaccin, taux de couverture global par vaccin, liste des élèves en retard
- **Rapport allergies** : synthèse des allergies déclarées par type (alimentaire, médicamenteuse, environnementale), nombre d'élèves concernés par allergène — utile pour la cantine
- **Rapport handicaps et aménagements** : liste des élèves avec besoins spéciaux et leurs aménagements requis, partageable avec le personnel pédagogique (version anonymisée ou nominative selon le choix du directeur)
- **Rapport médicaments en stock** : inventaire des médicaments stockés à l'infirmerie pour les élèves, dates de péremption, stocks à renouveler
- **Export DSP (Direction de Santé et Population)** : rapport au format attendu par les autorités sanitaires de la Wilaya

---

### 12.9 Confidentialité, Sécurité et Accès

#### Règles d'Accès Strictes

| Information | NURSE | SCHOOL_ADMIN | Supervisor | Teacher | Parent | Student |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Dossier médical complet | ✅ | ✅ | ❌ | ❌ | 👁️ (enfant uniquement) | ❌ |
| Consultations (détail clinique) | ✅ | ✅ | ❌ | ❌ | 👁️ (résumé) | ❌ |
| Allergies | ✅ | ✅ | ❌ | 👁️ (aménagements seuls) | ✅ | ❌ |
| Médicaments en cours | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Vaccinations | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Handicaps/besoins spéciaux | ✅ | ✅ | ❌ | 👁️ (aménagements) | ✅ | ❌ |
| Suivi psycho/social | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Messagerie infirmier-parent | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

> 👁️ = Accès lecture partiel uniquement

#### Chiffrement des Données Médicales
- Les données médicales sont chiffrées avec une clé AES-256 **séparée** de la clé principale de la base de données
- Même un accès direct à la base de données ne permet pas de lire les données médicales sans la clé dédiée
- La clé de chiffrement médicale est stockée séparément dans un vault sécurisé (ex. : HashiCorp Vault ou AWS Secrets Manager)

#### Audit Trail Médical
- Chaque lecture, création, modification ou suppression d'une donnée médicale est loguée
- Log contient : utilisateur, action, timestamp, IP, champ modifié (ancienne valeur → nouvelle valeur)
- Ces logs sont immuables et ne peuvent être supprimés par personne, y compris le SCHOOL_ADMIN
- Consultable par le SCHOOL_ADMIN pour audits internes

#### Conformité
- Consentement parental requis à l'inscription : les parents doivent accepter explicitement la collecte et le traitement des données médicales de leur enfant
- Droit de rectification : les parents peuvent demander la correction d'une information médicale incorrecte (via l'app ou en contactant l'infirmier)
- Durée de conservation : données médicales conservées pendant la durée de scolarité + 5 ans après la sortie de l'élève
- À la désactivation d'un compte élève : les données médicales passent en statut "archivé chiffré" — jamais supprimées physiquement

---

## 13. MODULE 10 — Application Mobile Unifiée (1 seule app)

> **Décision architecturale clé — Version 5.0**
> ILMI publie **une seule application Flutter** sur le Play Store et l'App Store.
> Elle détecte dynamiquement le ou les rôles de l'utilisateur à la connexion
> et affiche l'interface correspondante. Les concepts de "3 apps séparées"
> ou "4 apps séparées" sont abandonnés.

---

### 13.0 Pourquoi une Seule App — Décision et Justification

#### Coût de Publication Stores

| Approche | Google Play | App Store (annuel) | Total annuel |
|---|---|---|---|
| 4 apps séparées | 100 USD (4×25, une fois) | 396 USD (4×99) | ~496 USD/an |
| **1 seule app (choix ILMI)** | **25 USD (une fois)** | **99 USD/an** | **124 USD/an** |

**Économie : ~372 USD/an, à vie.**

#### Avantages Techniques

- **1 seule codebase Flutter** — un bug corrigé l'est pour tous les rôles simultanément
- **Mises à jour déployées en une seule opération** — pas de coordination entre 4 apps
- **Utilisateurs multi-rôles** n'installent qu'une seule app — 0 friction
- **Design system unifié** — mêmes composants, même charte graphique, même expérience

#### La Réalité des Utilisateurs Multi-Rôles

Un utilisateur ILMI peut cumuler **plusieurs rôles dans des contextes différents**. C'est la norme, pas l'exception.

| Profil réel | Rôles cumulés dans ILMI |
|---|---|
| Professeur de maths avec un enfant à la même école | TEACHER + PARENT |
| Chauffeur de bus dont l'enfant est scolarisé dans l'école | DRIVER + PARENT |
| Enseignant qui donne aussi des cours dans un centre de formation | TEACHER + TRAINER |
| Lycéen inscrit à l'école privée + cours d'anglais dans un centre | STUDENT + TRAINEE |
| Élève inscrit dans 2 centres de formation différents | TRAINEE (contexte A) + TRAINEE (contexte B) |
| Formateur qui travaille dans 2 centres de formation | TRAINER (centre A) + TRAINER (centre B) |
| Parent avec enfants dans 2 écoles différentes | PARENT (école A) + PARENT (école B) |

Avec des apps séparées, ces utilisateurs auraient besoin de jongler entre plusieurs apps. Avec l'app unifiée ILMI, tout est dans un seul endroit, dans un seul contexte à la fois.

---

### 13.1 Flux de Connexion et Détection des Rôles

```
L'utilisateur ouvre l'app ILMI
  → Écran de connexion unique : numéro de téléphone + mot de passe
    → Le backend authentifie
      → Retourne un JWT contenant TOUS les rôles et contextes

Exemples de navigation post-login :

Utilisateur avec 1 seul rôle
  → Navigation directe vers son interface, sans écran intermédiaire

Utilisateur avec plusieurs rôles
  → Écran "Sélecteur de Contexte"
    → Tap sur une carte → chargement immédiat du contexte
    → Bouton de switch rapide toujours disponible depuis n'importe quel écran
```

#### Structure du JWT Retourné par le Backend

```json
{
  "user_id": "uuid",
  "phone": "0555123456",
  "full_name": "Ahmed Bouzid",
  "photo_url": "https://...",
  "contexts": [
    {
      "context_id": "ctx-1",
      "type": "SCHOOL",
      "role": "TEACHER",
      "school_id": "uuid-école-A",
      "school_name": "École Ibn Khaldoun",
      "school_logo": "https://...",
      "modules_active": {
        "finance": true, "transport": true, "cantine": false,
        "bibliotheque": true, "infirmerie": false, "sms": true
      }
    },
    {
      "context_id": "ctx-2",
      "type": "SCHOOL",
      "role": "PARENT",
      "school_id": "uuid-école-A",
      "school_name": "École Ibn Khaldoun",
      "school_logo": "https://...",
      "children": [
        {"student_id": "uuid-s1", "name": "Amira Bouzid", "class": "3AP-A", "photo": "..."},
        {"student_id": "uuid-s2", "name": "Karim Bouzid", "class": "1AM-B", "photo": "..."}
      ]
    },
    {
      "context_id": "ctx-3",
      "type": "FORMATION",
      "role": "TRAINER",
      "center_id": "uuid-centre-B",
      "center_name": "Excellence Formation — Blida",
      "center_logo": "https://...",
      "modules_active": {"sms": true, "mobile_apps": true}
    }
  ]
}
```

#### Routage Flutter selon le Rôle Actif

```dart
void navigateAfterLogin(List<UserContext> contexts) {
  if (contexts.length == 1) {
    // Cas simple : 1 seul contexte → navigation directe
    _navigateToHome(contexts.first);
  } else {
    // Cas multi-rôles → sélecteur de contexte
    Navigator.pushReplacement(context,
      MaterialPageRoute(builder: (_) => ContextSelectorScreen(contexts: contexts))
    );
  }
}

void _navigateToHome(UserContext ctx) {
  Widget home;
  switch (ctx.role) {
    case 'TEACHER':  home = TeacherHome(context: ctx);  break;
    case 'PARENT':   home = ParentHome(context: ctx);   break;
    case 'STUDENT':  home = StudentHome(context: ctx);  break;
    case 'TRAINER':  home = TrainerHome(context: ctx);  break;
    case 'TRAINEE':  home = TraineeHome(context: ctx);  break;
    case 'DRIVER':   home = DriverHome(context: ctx);   break;
    default:         home = ContextSelectorScreen();
  }
  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => home));
}
```

---

### 13.2 Sélecteur de Contexte (Écran Multi-Rôles)

Affiché uniquement quand l'utilisateur a plusieurs rôles ou contextes.

```
┌──────────────────────────────────────────────┐
│           Bonjour, Ahmed 👋                  │
│     Choisissez votre espace de travail        │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  [Logo]  👨‍🏫 Enseignant                  │  │
│  │          École Ibn Khaldoun             │  │
│  │          3 classes · 2 cours aujourd'hui│  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  [Logo]  👨‍👧 Parent                      │  │
│  │          École Ibn Khaldoun             │  │
│  │          Amira (3AP-A) · Karim (1AM-B)  │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  [Logo]  🎓 Formateur                   │  │
│  │          Excellence Formation — Blida   │  │
│  │          2 groupes actifs               │  │
│  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Comportements clés :**
- **Mémorisation du dernier contexte** : à la prochaine ouverture de l'app, l'utilisateur arrive directement dans son dernier contexte actif — pas besoin de re-sélectionner à chaque fois
- **Switch rapide depuis n'importe où** : un bouton permanent dans la barre de navigation supérieure permet de switcher de contexte sans se déconnecter
- **Badges de notifications par contexte** : chaque carte affiche le nombre de notifications en attente dans ce contexte

#### Bandeau de Contexte Actif

Visible en permanence en haut de tous les écrans :

```
┌──────────────────────────────────────────────┐
│ 👨‍🏫 Enseignant · École Ibn Khaldoun      ⇄  │
└──────────────────────────────────────────────┘
  ↑ Tap sur ⇄ pour switcher de contexte instantanément
```

---

### 13.3 Interface TEACHER — Enseignant

**Dashboard :**
- Sessions du jour avec statut des présences (✅ marqué / ⏳ en attente)
- Tâches urgentes : notes à soumettre, devoirs en retard de correction
- Messages non lus parents + administration + eleves
- Prochaine séance dans la journée avec compte à rebours
- Boutons rapides : Marquer présences · Saisir notes · Poster devoir - Upload ressource

**Présences :**
- Sélection classe → session
- Liste élèves avec photo — par défaut tous présents
- Tap = absent 🔴 / Tap long = retard 🟠
- Confirmation en 5-15 secondes pour une classe entière
- Annulation dans les 60 secondes / Modification dans les 30 minutes
- Notification automatique aux parents des absents (délai 10 min)

**Notes :**
- Sélection classe → matière → trimestre → type d'évaluation
- /10 ou /20 selon le niveau (automatique)
- Import CSV en masse.
- Sauvegarde auto toutes les 3 secondes (draft local)
- Soumission admin pour validation et publication

**Devoirs & Ressources :**
- Créer devoir : titre, description, date limite, fichiers joints (PDF, Word, images, liens vidéo)
- Upload ressources pédagogiques par matière et chapitre
- Statistiques de lecture/téléchargement par ressource

**Cahier de Texte Électronique :**
- Contenu de chaque séance avec modèles prédéfinis
- Répartition mensuelle et annuelle
- Export PDF

**Finances (si module activé) :**
- Fiche de paie du mois en cours avec détail
- Historique 24 mois avec téléchargement PDF

**Communication :**
- Chat avec l'administration
- Chat privé par élève avec les parents
- Broadcast classe (tous les élèves d'une classe)
- Modèles de messages pré-rédigés

---

### 13.4 Interface PARENT — Parent

**Sélecteur d'Enfants Multi-Établissements :**

Un parent peut avoir des enfants dans **plusieurs établissements différents** (école privée A, école privée B, centre de formation C). Tout est accessible depuis la même interface parent.

```
┌─────────────────────────────────────────┐
│ Mes Enfants                   [+ Ajouter]│
│                                          │
│  École Ibn Khaldoun                      │
│  ┌──────────────────────────────────┐    │
│  │ [📷] Amira Bouzid  · 3AP-A   ›  │ 🔔2│
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │ [📷] Karim Bouzid  · 1AM-B   ›  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Excellence Formation — Blida            │
│  ┌──────────────────────────────────┐    │
│  │ [📷] Amira Bouzid  · Anglais B1 ›│    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- Tap sur un enfant → toutes ses données dans cet établissement
- Badge 🔔 par enfant pour les notifications non lues
- Les données de l'école privée et du centre de formation sont **complètement séparées** même pour le même enfant

**Tableau de Bord (par enfant sélectionné) :**
- Moyenne trimestrielle actuelle (prominent, avec code couleur)
- Statut présence du jour : présent ✅ / absent ❌ / retard 🟠
- Prochain devoir à rendre
- Messages non lus des enseignants
- Prochaine échéance de paiement (si finance activé)
- Alerte de risque si moyenne sous le seuil

**Suivi Académique :**
- Notes par matière et par trimestre avec comparaison moyenne de classe
- Graphique d'évolution trimestre par trimestre, par matière
- Code couleur : vert / orange / rouge
- Bulletins PDF : voir, télécharger, partager
- Rang de classe

**Présences :**
- Calendrier mensuel visuel (vert / rouge / orange)
- Soumettre justification d'absence (texte + photo du certificat médical)
- Suivi du statut de la justification

**Communication :**
- Chat avec professeur principal et enseignants par matière
- Annonces scolaires
- Alertes urgentes de l'administration

**Modules Additionnels (selon activation école) :**
- Menu cantine quotidien/hebdomadaire (si enfant inscrit)
- Position GPS bus en temps réel, horaires arrêts, notifications retard chauffeur
- Frais de scolarité : solde, paiements, reçus PDF téléchargeables
- Dossier médical de l'enfant en lecture seule (si infirmerie activée)
- Livres empruntés à la bibliothèque avec dates de retour
- Activités extrascolaires de l'enfant

**Préférences :**
- Notifications configurables par catégorie et par enfant
- Mode silencieux (plage horaire)
- Langue : Français / Arabe
- Mode nuit

---

### 13.5 Interface STUDENT — Élève

**Interface Adaptée à l'Âge :**
- Primaire (5-11 ans) : grands boutons colorés, icônes avec étiquettes, police grande, gamification au premier plan
- CEM (11-15 ans) : interface standard, toutes les fonctionnalités, design moderne
- Lycée (15-18 ans) : interface complète avec statistiques détaillées, graphiques analytiques, vue calendrier avancée

**Dashboard :**
- Cours du jour avec emploi du temps
- Prochains devoirs avec compte à rebours et code couleur d'urgence
- Notes récentes publiées
- Annonces récentes
- Messages non lus

**Fonctionnalités :**
- Emploi du temps (vue jour / semaine) — fusionné avec les séances des centres de formation si inscrit
- Notes par matière et par trimestre, bulletins PDF
- Devoirs : liste avec urgences, téléchargement des fichiers joints
- Ressources pédagogiques
- Présences : propres absences et retards
- Chat avec enseignants et administration
- Menu cantine et horaires transport (si modules activés)
- Carte d'identité numérique avec QR code dynamique (renouvelé toutes les 30 secondes)

**Si inscrit dans un ou plusieurs centres de formation ILMI :**
- Section "Mes Formations" dans le menu principal
- Emploi du temps unifié (scolaire + tous les centres) pour éviter les conflits
- Devoirs, résultats et certificats du ou des centres

**Gamification (Primaire uniquement) :**
- Points, badges (Étoile de Math, Champion de Lecture, Assiduité Parfaite...)
- Niveaux : Débutant → Explorateur → Champion → Maître → Légende
- Classement de classe (désactivable par l'admin)
- Défi hebdomadaire, certificats de récompense imprimables

---

### 13.6 Interface TRAINER — Formateur (Centre de Formation)

Identique à l'interface TEACHER avec les adaptations suivantes :

- "Classes" → "Groupes" (groupes de formation)
- "Trimestre" → "Session" (session de formation)
- Notes : notation libre et configurable par formation (pas contrainte /10 ou /20)
- Devoirs : associés aux groupes de la session active
- Section supplémentaire "Mes Séances" :
  - Bouton "Signaler annulation" (avec raison) → notification automatique aux inscrits
  - Bouton "Créer séance de rattrapage" (système vérifie la disponibilité salle + formateur)
- Finances : fiche de paie basée sur les heures effectuées (tarif horaire) ou salaire fixe mensuel
- Pas de cahier de texte officiel → "Journal de Formation" (avancement du programme de la session)

---

### 13.7 Interface TRAINEE — Inscrit (Centre de Formation)

**Dashboard :**
- Prochaine séance (date, heure, salle ou lien de visioconférence si cours en ligne)
- Devoirs en attente pour toutes les formations
- Taux de présence global et par formation
- Annonces récentes du centre
- Prochaine échéance de paiement

**Mes Formations :**
- Liste de toutes les formations actives
- Pour chaque formation : avancement (séances réalisées / total), taux de présence, prochaine séance
- Historique des formations terminées avec certificats

**Emploi du Temps :**
- Toutes les séances, de tous les centres, dans une vue semaine unifiée
- Indication salle physique ou lien visio si cours en ligne
- Alerte push si séance annulée ou déplacée

**Résultats & Certificats :**
- Notes par évaluation et par formation
- Certificats et attestations téléchargeables en PDF

**Paiements :**
- Solde dû par formation
- Historique des paiements avec reçus PDF

---

### 13.8 Interface DRIVER — Chauffeur de Bus

Interface ultra-minimaliste, pensée pour être utilisable en quelques secondes, avec de gros boutons lisibles.

**Écran Principal — Ma Ligne du Jour :**
```
┌──────────────────────────────────────────┐
│ 🚌  Ligne 3 — Direction Bab Ezzouar     │
│     Trajet Matin · Départ prévu 7h00     │
│                                          │
│  Arrêts du trajet :                      │
│  ● Cité des Martyrs      7h05  (3 élèves)│
│  ● Stade Municipal       7h15  (2 élèves)│
│  ● École (arrivée)       7h30            │
│                                          │
│     [  🚀  DÉMARRER LE TRAJET  ]         │
└──────────────────────────────────────────┘
```

**Écran Pointage par Arrêt (pendant le trajet) :**
- À chaque arrêt : liste des élèves à embarquer avec photo
- Tap = monté ✅ / Tap long = absent ❌
- Si un élève ne monte pas : notification automatique immédiate au parent
  ("Votre enfant [Prénom] n'a pas pris le bus à l'arrêt [Nom] à [Heure]")
- Le chauffeur ne voit que le prénom, nom et photo de l'élève — aucune donnée académique, financière ou médicale

**Boutons de Signalement (grands, toujours visibles) :**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  ⏰ RETARD  │  │ ⚠️ INCIDENT │  │ 🏫 ARRIVÉ   │
└─────────────┘  └─────────────┘  └─────────────┘

RETARD   → Popup : durée estimée du retard
           → Notification push auto à TOUS les parents de la ligne
             "Le bus de la Ligne 3 a environ 15 min de retard"

INCIDENT → Popup : type (panne mécanique / accident / route bloquée / autre)
           + champ description libre
           → Alerte push admin + tous les parents de la ligne

ARRIVÉ   → Notification push à tous les parents :
           "Le bus Ligne 3 est arrivé à l'école à [heure]"
           → Clôture automatique du trajet
```

**Annonces :**
- Le chauffeur reçoit les annonces de l'école (ex. : "Pas de cours demain", "Sortie scolaire")
- Il ne peut pas poster d'annonces, uniquement les recevoir et les lire

**Ce que le chauffeur NE VOIT JAMAIS :**
- Notes, bulletins ou données académiques des élèves
- Informations financières
- Dossiers médicaux
- Coordonnées complètes des parents (uniquement le nom de l'élève)

---

### 13.9 Gestion des Multi-Rôles — Cas Concrets

#### Cas 1 : Enseignant ET Parent dans la même école

Ahmed est professeur de Maths à l'École Ibn Khaldoun ET père d'Amira qui y est scolarisée.

- Sélecteur de contexte affiche 2 cartes : **Enseignant** / **Parent**
- Dans le contexte **Enseignant** : il voit ses classes, saisit les notes, marque les présences
- Dans le contexte **Parent** : il voit uniquement les informations d'Amira publiées, comme n'importe quel parent
- **Isolation garantie** : même si Ahmed est l'enseignant d'Amira, il ne peut pas voir les notes non encore publiées d'Amira via son contexte Parent — il ne les voit que via l'interface admin dédiée à la saisie

#### Cas 2 : Enseignant dans une école privée ET Formateur dans un centre

Fatima enseigne l'Anglais à l'École Ibn Khaldoun ET donne des cours au Centre Excellence.

- Sélecteur affiche 2 cartes : **Enseignant Ibn Khaldoun** / **Formateur Excellence Formation**
- **Isolation totale** : l'école privée ne sait pas qu'elle travaille au centre, le centre ne voit pas son salaire de l'école
- Switch de contexte en 1 tap depuis n'importe quel écran

#### Cas 3 : Élève dans une école privée + inscrit dans 2 centres de formation

Karim est en 3AS Sciences à l'École Ibn Khaldoun. Il suit l'Anglais B2 au Centre Alpha ET la Prépa BAC Physique au Centre Beta.

- Sélecteur affiche 3 cartes : **Élève Ibn Khaldoun** / **Inscrit Centre Alpha** / **Inscrit Centre Beta**
- **Vue emploi du temps unifiée** optionnelle : affiche TOUS ses cours (école + 2 centres) dans un seul calendrier pour éviter les conflits d'horaires
- Les données (notes, paiements, présences) restent isolées par contexte

#### Cas 4 : Chauffeur ET Parent

Le chauffeur Mourad est aussi le père d'un élève de l'école.

- Sélecteur affiche 2 cartes : **Chauffeur** / **Parent**
- Contexte Chauffeur : interface minimaliste pour gérer son trajet
- Contexte Parent : toutes les fonctionnalités parent pour suivre son enfant
- Il peut recevoir deux types de notifications simultanément (sans confusion car chaque notification identifie son contexte)

#### Cas 5 : Parent avec enfants dans plusieurs établissements

Karima a Amira à l'École Ibn Khaldoun et Karim inscrit au Centre Excellence Formation.

- Elle n'a qu'**un seul rôle PARENT** — pas de sélecteur de contexte
- Le sélecteur d'enfants dans l'interface Parent affiche tous ses enfants regroupés par établissement
- Elle bascule entre les deux enfants (et établissements) depuis la même interface sans quitter le contexte Parent

#### Cas 6 : Formateur dans 2 centres de formation différents

Said donne des cours de développement web au Centre TechBlida ET au Centre NumAlger.

- Sélecteur affiche 2 cartes : **Formateur TechBlida** / **Formateur NumAlger**
- Chaque contexte est totalement isolé (groupes, inscrits, paiements, fiches de paie)
- Switch de contexte en 1 tap

---

### 13.10 Architecture Technique Flutter

#### Structure du Projet

```
mobile/lib/
├── main.dart
├── core/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── auth_bloc.dart
│   │   └── jwt_service.dart            ← Parse tous les contextes du JWT
│   ├── context/
│   │   ├── context_selector_screen.dart ← Sélecteur multi-rôles
│   │   ├── context_bloc.dart            ← Gestion du contexte actif
│   │   └── context_model.dart           ← UserContext (role, type, ids, modules)
│   ├── router/
│   │   └── app_router.dart             ← Routage dynamique selon rôle actif
│   ├── theme/                          ← Design system unifié
│   ├── network/
│   │   └── api_client.dart             ← Dio + intercepteur JWT auto-refresh
│   ├── storage/
│   │   └── cache_service.dart          ← Hive pour cache offline
│   └── notifications/
│       └── fcm_handler.dart            ← FCM avec routing par contexte
│
├── features/
│   ├── teacher/                        ← Interface TEACHER
│   │   ├── home/
│   │   ├── attendance/
│   │   ├── grades/
│   │   ├── homework/
│   │   ├── resources/
│   │   └── payroll/
│   │
│   ├── parent/                         ← Interface PARENT
│   │   ├── home/
│   │   ├── child_selector/
│   │   ├── academics/
│   │   ├── attendance/
│   │   ├── finance/
│   │   ├── medical/
│   │   └── formation_child/            ← Suivi enfant dans un centre de formation
│   │
│   ├── student/                        ← Interface STUDENT
│   │   ├── home/
│   │   ├── timetable/                  ← Vue unifiée école + centres de formation
│   │   ├── grades/
│   │   ├── homework/
│   │   ├── id_card/
│   │   └── gamification/
│   │
│   ├── trainer/                        ← Interface TRAINER (formation)
│   │   ├── home/
│   │   ├── groups/
│   │   ├── sessions/
│   │   ├── homework/
│   │   └── payroll/
│   │
│   ├── trainee/                        ← Interface TRAINEE (formation)
│   │   ├── home/
│   │   ├── formations/
│   │   ├── timetable/
│   │   ├── results/
│   │   ├── payments/
│   │   └── certificates/
│   │
│   ├── driver/                         ← Interface DRIVER (chauffeur)
│   │   ├── home/
│   │   ├── route/
│   │   ├── boarding/
│   │   └── alerts/
│   │
│   └── shared/                         ← Partagé entre tous les rôles
│       ├── chat/
│       ├── announcements/
│       ├── notifications/
│       └── profile/
```

#### Gestion des Notifications Multi-Contextes

```dart
// À la réception d'une notification FCM
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final targetContextId = message.data['context_id'];
  final activeContextId = ContextBloc.activeContext.contextId;

  if (targetContextId == activeContextId) {
    // L'utilisateur est déjà dans le bon contexte → afficher la notification
    NotificationService.showInApp(message);
  } else {
    // L'utilisateur est dans un autre contexte
    // → Afficher un badge sur la carte du contexte concerné dans le sélecteur
    ContextBloc.addBadge(targetContextId);
    // → Afficher une notification système discrète
    NotificationService.showSystem(message, contextHint: targetContextId);
  }
});
```

---

### 13.11 Mode Hors Ligne

| Fonctionnalité | Comportement Hors Ligne |
|---|---|
| Notes et bulletins | Cache Hive — toujours accessibles |
| Devoirs et ressources téléchargées | Cache Hive — toujours accessibles |
| Emploi du temps (tous contextes) | Cache Hive — toujours accessible |
| Présences (enseignant / formateur) | Sauvegarde locale → sync au retour en ligne |
| Saisie notes (enseignant) | Draft local → soumission quand en ligne |
| Messages chat | File d'attente locale → envoi quand en ligne |
| Annonces | Cache Hive |
| Carte d'identité élève | QR statique en cache (valide 24h) |
| Interface chauffeur | Données de la ligne du jour en cache |

Indicateur visuel permanent : bandeau "📵 Mode hors ligne" en haut de l'écran quand la connexion est perdue.

---

### 13.12 Publication Stores

| | Détail | Coût |
|---|---|---|
| Google Play Store | 1 publication unique, à vie | 25 USD (une fois) |
| Apple App Store | 1 compte développeur | 99 USD/an |
| **Total année 1** | | **124 USD** |
| **Total années suivantes** | | **99 USD/an** |

- **Nom de l'app :** ILMI — Gestion Scolaire
- **Catégorie :** Éducation
- **Compatibilité :** Android 8.0+ / iOS 14+
- **Taille estimée :** ~45 MB

---

## 14. Fonctionnalités Transversales

### 13.1 Système de Notifications Intelligent

**Hiérarchie des Notifications :**
1. Urgente (push + SMS) : absence, incident grave, alerte sécurité
2. Importante (push) : note publiée, bulletin disponible, devoir deadline
3. Information (in-app seulement) : note soumise à l'admin, mise à jour emploi du temps

**Préférences Utilisateur :**
- Par catégorie : académique, présences, finances, bibliothèque, transport, cantine, messages
- Mode silencieux configurable (ex. : pas de push entre 22h et 7h)
- Résumé hebdomadaire (en option, pour remplacer les notifications individuelles)

**Centre de Notifications In-App :**
- Badge de comptage sur l'icône de l'app
- Historique complet des 30 derniers jours
- Marquer comme lu individuellement ou tout marquer
- Filtrage par type

### 13.2 Messagerie et Chat en Temps Réel

**Types de Salons :**
- Enseignant ↔ Parent (pour un élève spécifique) : communication formelle privée
- Enseignant ↔ Élève : questions sur le cours
- Enseignant → Classe (broadcast) : annonces de classe
- Admin ↔ Enseignant : communication interne
- Admin ↔ Parent : affaires administratives
- Admin → Tous (broadcast) : annonces école entière

**Fonctionnalités du Chat :**
- Messages texte
- Envoi de fichiers : PDF, Word, Excel, images, vidéos
- Réactions emoji
- Accusés de réception (envoyé ✓, reçu ✓✓, lu 🔵)
- Recherche dans l'historique des messages
- Suppression de son propre message (dans les 60 secondes)
- Modèles de messages pré-rédigés (ex. : "Votre enfant a bien participé aujourd'hui")
- Épingler un message dans un salon

**Architecture Temps Réel :**
- WebSocket via Django Channels
- Redis comme Channel Layer pour la scalabilité
- Tous les messages stockés en PostgreSQL (persistance)
- Si le destinataire est hors ligne : notification push FCM envoyée

### 13.3 Système d'Annonces

**Création d'une Annonce :**
- Titre + corps (éditeur texte enrichi)
- Images et fichiers joints
- Public cible : tous / enseignants / parents / élèves / section spécifique / classe spécifique
- Importance : normale / importante (bandeau rouge)
- Planification future (date/heure de publication)
- Épingler en haut du fil d'annonces

**Suivi des Annonces :**
- Compteur de vues (combien d'utilisateurs cibles ont vu l'annonce)
- Accusés de lecture (optionnel pour les annonces importantes)

### 13.4 Chatbot IA (Module Optionnel Premium)

**Capacités :**
- Répondre en Arabe, Français, Anglais (détection automatique de la langue)
- Questions sur les données personnelles : notes, présences, devoirs, planning
- Questions sur l'école : règlement, calendrier, contacts
- Lecture seule : jamais de modification des données
- Chaque utilisateur ne voit que ses propres données (ou celles de son enfant)

**Base de Connaissances par École :**
- Gérée par l'admin via le panneau web
- Upload de documents : règlement intérieur, calendrier, FAQ
- Ré-indexation automatique à chaque modification
- Isolation par tenant : chaque école a son propre espace vectoriel

### 13.5 Analytics Globales de l'École

**Pour le Directeur (SCHOOL_ADMIN) :**
- Vue globale de toutes les sections
- Alertes en temps réel : élèves à risque, taux d'absentéisme élevé
- Comparaison de performance entre classes
- Activité des enseignants (taux de marquage, soumission des notes)

**Pour le Superviseur (GENERAL_SUPERVISOR) :**
- Mêmes analytics mais en lecture seule
- Accès à tous les modules activés en lecture
- Peut générer des rapports

### 13.6 Sécurité et Conformité

**Authentification :**
- JWT avec access token (15 min) + refresh token (30 jours) avec rotation
- Connexion biométrique (empreinte / Face ID) après configuration initiale
- PIN code 4-6 chiffres pour élèves du primaire
- Verrouillage après 5 tentatives échouées (déverrouillage automatique après 30 minutes)
- Révocation de session à distance par l'admin
- Changement de mot de passe forcé à la première connexion

**Sécurité des Données :**
- HTTPS obligatoire (HTTP redirigé)
- Mots de passe hachés avec argon2
- Chiffrement des données biométriques (AES-256)
- Isolation complète des données par tenant (school_id sur chaque table)
- Soft delete uniquement (données jamais supprimées physiquement)
- Audit trail complet : qui a fait quoi, quand, sur quel enregistrement
- Sauvegardes automatiques quotidiennes

**Conformité Légale Algérienne :**
- Conservation des données académiques sur minimum 5-10 ans
- Export au format officiel du Ministère de l'Éducation
- Semaine scolaire : Dimanche → Jeudi
- Fuseau horaire : Africa/Algiers
- Support RTL complet pour l'arabe
- Méthodes de paiement algériennes : CCP, BaridiMob, CIB

---

## 15. Schéma Base de Données

### Nouveaux Modèles pour la Gestion Modulaire

```python
class SchoolSubscription(Model):
    school = OneToOneField(School, on_delete=CASCADE)
    is_active = BooleanField(default=True)
    plan_name = CharField()                    # "Pack Complet", "Sur Mesure", etc.
    max_students = IntegerField()
    subscription_start = DateField()
    subscription_end = DateField()

    # Modules activés (Feature Flags)
    module_pedagogique = BooleanField(default=True)    # Toujours True
    module_empreintes = BooleanField(default=False)
    module_finance = BooleanField(default=False)
    module_cantine = BooleanField(default=False)
    module_transport = BooleanField(default=False)
    module_auto_education = BooleanField(default=False)
    module_sms = BooleanField(default=False)
    module_bibliotheque = BooleanField(default=False)
    module_infirmerie = BooleanField(default=False)
    module_mobile_apps = BooleanField(default=False)
    module_ai_chatbot = BooleanField(default=False)

    # Métadonnées
    activated_by = ForeignKey(User)            # Super Admin qui a configuré
    activation_log = JSONField(default=list)   # Historique des activations/désactivations

class ModuleActivationLog(Model):
    """Log immuable de chaque changement de module"""
    school = ForeignKey(School)
    module_name = CharField()
    action = CharField()                        # 'ACTIVATED' ou 'DEACTIVATED'
    performed_by = ForeignKey(User)             # Super Admin
    timestamp = DateTimeField(auto_now_add=True)
    reason = TextField(blank=True)
    prorated_amount = DecimalField(null=True)   # Montant facturé au prorata

class SubscriptionInvoice(Model):
    """Factures générées pour chaque changement d'abonnement"""
    school = ForeignKey(School)
    invoice_number = CharField(unique=True)
    amount = DecimalField()
    currency = CharField(default='DZD')
    description = TextField()
    generated_at = DateTimeField(auto_now_add=True)
    due_date = DateField()
    is_paid = BooleanField(default=False)
    paid_at = DateTimeField(null=True)
    pdf_url = CharField(null=True)

class SuperAdminImpersonationLog(Model):
    """Audit trail de chaque accès super admin en usurpation"""
    super_admin = ForeignKey(User, related_name='impersonations')
    target_school = ForeignKey(School)
    target_admin = ForeignKey(User, related_name='was_impersonated')
    reason = TextField()
    started_at = DateTimeField(auto_now_add=True)
    ended_at = DateTimeField(null=True)
    actions_taken = JSONField(default=list)    # Log des actions pendant l'usurpation
```

### Décorateur de Protection par Module

```python
def require_module(module_name):
    """
    Décorateur qui bloque l'accès si le module n'est pas activé pour l'école.
    Utilisé sur tous les ViewSets liés à un module spécifique.
    """
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if request.user.role == 'SUPER_ADMIN':
                return view_func(request, *args, **kwargs)  # Super admin bypass
            school = request.user.school
            subscription = school.subscription
            if not getattr(subscription, f'module_{module_name}', False):
                return Response(
                    {"error": f"Module '{module_name}' non activé pour votre école.",
                     "contact": "Contactez votre administrateur ILMI pour activer ce module."},
                    status=status.HTTP_403_FORBIDDEN
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
```

### Payload JWT avec Modules Actifs

```json
{
  "user_id": "uuid",
  "school_id": "uuid",
  "role": "TEACHER",
  "modules": {
    "pedagogique": true,
    "empreintes": false,
    "finance": true,
    "cantine": true,
    "transport": false,
    "auto_education": true,
    "sms": false,
    "bibliotheque": true,
    "mobile_apps": true,
    "ai_chatbot": false
  }
}
```

> Ce payload permet à l'application mobile de masquer/afficher les sections sans faire un appel API supplémentaire.

---

## 16. API Endpoints par Module

### Super Admin Endpoints

```
# Gestion des Tenants
GET    /super/schools/                          # Liste toutes les écoles
POST   /super/schools/                          # Créer nouvelle école + admin initial
GET    /super/schools/{id}/
PATCH  /super/schools/{id}/
DELETE /super/schools/{id}/

# Gestion des Abonnements
GET    /super/schools/{id}/subscription/
PATCH  /super/schools/{id}/subscription/        # Modifier dates, plan, max_students
POST   /super/schools/{id}/modules/{module}/activate/
POST   /super/schools/{id}/modules/{module}/deactivate/

# Facturation
GET    /super/schools/{id}/invoices/
POST   /super/schools/{id}/invoices/generate/
PATCH  /super/schools/{id}/invoices/{inv_id}/mark-paid/

# Usurpation
POST   /super/schools/{id}/impersonate/         # Démarre une session d'usurpation
POST   /super/impersonation/{log_id}/end/       # Termine la session
GET    /super/schools/{id}/impersonation-logs/

# Analytics Globales
GET    /super/analytics/overview/
GET    /super/analytics/revenue/
GET    /super/analytics/modules-usage/
GET    /super/analytics/schools-map/

# Gestion Contenu (Auto-Éducation)
GET    /super/content/resources/
POST   /super/content/resources/
DELETE /super/content/resources/{id}/
```

### Endpoints par Module (protégés par @require_module)

```
# Module Empreintes
POST   /api/v1/fingerprint/enroll/
POST   /api/v1/fingerprint/verify/
GET    /api/v1/fingerprint/students/enrolled/
GET    /api/v1/fingerprint/reports/tardiness/

# Module Finance
GET    /api/v1/finance/fee-structures/
POST   /api/v1/finance/fee-structures/
GET    /api/v1/finance/students/{id}/account/
POST   /api/v1/finance/payments/
GET    /api/v1/finance/payments/{id}/receipt/
GET    /api/v1/finance/salaries/
POST   /api/v1/finance/salaries/calculate-monthly/
GET    /api/v1/finance/payslips/{employee_id}/
GET    /api/v1/finance/expenses/
POST   /api/v1/finance/expenses/
GET    /api/v1/finance/reports/monthly/
GET    /api/v1/finance/reports/annual/

# Module Cantine
GET    /api/v1/canteen/students/enrolled/
POST   /api/v1/canteen/students/enroll/
GET    /api/v1/canteen/menus/
POST   /api/v1/canteen/menus/
GET    /api/v1/canteen/menus/today/
GET    /api/v1/canteen/menus/week/
GET    /api/v1/canteen/reports/

# Module Transport
GET    /api/v1/transport/lines/
POST   /api/v1/transport/lines/
GET    /api/v1/transport/drivers/
POST   /api/v1/transport/drivers/
GET    /api/v1/transport/drivers/{id}/card/
POST   /api/v1/transport/assign/
GET    /api/v1/transport/student/{id}/line/
POST   /api/v1/transport/notify-delay/{line_id}/
GET    /api/v1/transport/reports/

# Module Auto-Éducation
GET    /api/v1/education/resources/
POST   /api/v1/education/resources/
GET    /api/v1/education/exams/
POST   /api/v1/education/quizzes/
POST   /api/v1/education/quizzes/{id}/submit/
GET    /api/v1/education/students/{id}/progress/

# Module SMS
POST   /api/v1/sms/send/
POST   /api/v1/sms/campaigns/
GET    /api/v1/sms/history/
GET    /api/v1/sms/balance/

# Module Bibliothèque
GET    /api/v1/library/books/
POST   /api/v1/library/books/
GET    /api/v1/library/books/search/
GET    /api/v1/library/loans/active/
POST   /api/v1/library/loans/checkout/
POST   /api/v1/library/loans/{id}/return/
GET    /api/v1/library/requests/
POST   /api/v1/library/requests/
GET    /api/v1/library/reports/

# Module Infirmerie
GET    /api/v1/infirmerie/students/{id}/medical-record/
PATCH  /api/v1/infirmerie/students/{id}/medical-record/
GET    /api/v1/infirmerie/students/{id}/consultations/
POST   /api/v1/infirmerie/consultations/
GET    /api/v1/infirmerie/consultations/{id}/
PATCH  /api/v1/infirmerie/consultations/{id}/
GET    /api/v1/infirmerie/students/{id}/allergies/
POST   /api/v1/infirmerie/students/{id}/allergies/
DELETE /api/v1/infirmerie/allergies/{id}/
GET    /api/v1/infirmerie/students/{id}/medications/
POST   /api/v1/infirmerie/students/{id}/medications/
PATCH  /api/v1/infirmerie/medications/{id}/
GET    /api/v1/infirmerie/students/{id}/vaccinations/
POST   /api/v1/infirmerie/students/{id}/vaccinations/
GET    /api/v1/infirmerie/students/{id}/emergency-card/
POST   /api/v1/infirmerie/absences/justify/
POST   /api/v1/infirmerie/messages/send-parent/
GET    /api/v1/infirmerie/messages/thread/{student_id}/
POST   /api/v1/infirmerie/emergency/trigger/
POST   /api/v1/infirmerie/emergency/{id}/close/
GET    /api/v1/infirmerie/emergency/{id}/liaison-sheet/
GET    /api/v1/infirmerie/reports/monthly/
GET    /api/v1/infirmerie/reports/annual/
GET    /api/v1/infirmerie/reports/vaccination-coverage/
GET    /api/v1/infirmerie/reports/allergies-summary/
GET    /api/v1/infirmerie/reports/epidemic-dashboard/
GET    /api/v1/infirmerie/reports/dsp-export/
# Parent — accès lecture dossier médical enfant (via app mobile)
GET    /api/v1/parent/children/{id}/medical-summary/
GET    /api/v1/parent/children/{id}/vaccinations/
GET    /api/v1/parent/children/{id}/infirmerie-messages/
POST   /api/v1/parent/children/{id}/medical-update-request/
```

---

## 17. Plan de Tarification

### Abonnement de Base (Module Pédagogique)

| Capacité | Mensuel (DZD) | Annuel (DZD) | Économie |
|---|---|---|---|
| Jusqu'à 100 élèves | 25 000 | 240 000 | -20 000 |
| 101 à 300 élèves | 40 000 | 384 000 | -96 000 |
| 301 à 600 élèves | 60 000 | 576 000 | -144 000 |
| 601+ élèves | 80 000 | 768 000 | -192 000 |

> Le module pédagogique de base inclut : gestion élèves/enseignants, notes, bulletins, présences, emploi du temps, devoirs, annonces, analytics.

### Modules Additionnels

| Module | Mensuel (DZD) | Annuel (DZD) |
|---|---|---|
| Empreintes Digitales | 8 000 | 76 800 |
| Gestion Financière | 12 000 | 115 200 |
| Cantine Scolaire | 6 000 | 57 600 |
| Transport Scolaire | 7 000 | 67 200 |
| Auto-Éducation | 15 000 | 144 000 |
| Messagerie SMS | 5 000 + coût SMS | 48 000 + coût SMS |
| Bibliothèque | 6 000 | 57 600 |
| Infirmerie Scolaire | 7 000 | 67 200 |
| Applications Mobiles (3 apps) | 10 000 | 96 000 |
| Chatbot IA | 18 000 | 172 800 |

### Packs Bundle (Réduction automatique)

| Pack | Modules | Économie vs. séparé |
|---|---|---|
| **Pack Essentiel** | Base + Mobile + SMS | -10% |
| **Pack Éducatif** | Base + Mobile + Bibliothèque + Auto-Éducation | -15% |
| **Pack Gestion** | Base + Finance + Cantine + Transport | -20% |
| **Pack Complet** | Tous sauf IA | -25% |
| **Pack Premium** | Tous les modules | -30% |

### Modèle de Facturation

- **Paiement annuel anticipé** : réduction de 20% sur le total
- **Paiement mensuel** : pas de réduction
- **Activation en cours d'année** : facturation au prorata (mois complet facturé)
- **Période d'essai** : 30 jours gratuits, tous les modules activés, sur demande auprès du Super Admin
- **Multi-campus** : chaque campus supplémentaire = 50% du prix des modules activés
- **Révision annuelle des prix** : notification 60 jours avant renouvellement

---

## 18. CATÉGORIE 2 — Écoles de Formation

> Cette section décrit la deuxième grande catégorie d'établissements supportés par ILMI. Les centres de formation partagent le même backend multi-tenant que les écoles privées mais disposent d'une **configuration, d'une terminologie et d'un ensemble de modules entièrement distincts**.

---

### 18.1 Vue d'ensemble & Analyse du Marché Algérien

#### Contexte du Marché

Les centres de formation privés en Algérie constituent un secteur massif et en forte croissance, structuré autour de plusieurs réalités :

- **Pression scolaire intense** : le système éducatif algérien génère une demande constante de cours de soutien, particulièrement autour des examens nationaux (5AP/BEP, 4AM/BEM, 3AS/BAC). Les familles investissent significativement dans ces cours.
- **Demande de langues étrangères** : l'anglais, le français, l'espagnol, l'allemand, l'arabe littéraire, le turc et le chinois sont enseignés dans des centaines de centres à travers les 58 wilayas. Les certifications internationales (IELTS, TOEFL, DELF, TCF, DELE) sont très recherchées pour l'immigration, l'université et l'emploi.
- **Boom des formations numériques** : informatique bureautique, développement web, réseaux & cybersécurité, infographie, montage vidéo, marketing digital, robotique, impression 3D — segments en très forte croissance depuis 2020.
- **Absence de digitalisation** : la quasi-totalité des centres gèrent encore leurs inscrits sur Excel, cahiers, WhatsApp. C'est un marché quasi-vierge pour une solution SaaS.

#### Caractéristiques Spécifiques au Contexte Algérien

- Les cours de soutien se concentrent fortement autour de septembre-octobre (début d'année) et mars-avril (pré-examens)
- Les centres de langues ont des cycles continus (pas calés sur l'année scolaire officielle) avec des sessions qui démarrent n'importe quand
- Beaucoup de formateurs en informatique/langues sont aussi enseignants dans des établissements publics ou privés (double activité)
- Les élèves de cours de soutien ont déjà un profil scolaire principal dans une école primaire, CEM ou lycée
- Les tarifs sont très variables : de 2 000 DZD/mois pour un cours de soutien en groupe à 15 000+ DZD pour une préparation IELTS individuelle
- Les centres mixtes (multi-domaines) sont très courants : un même local propose cours de soutien + anglais + informatique

#### Ce qui Distingue Fondamentalement un Centre de Formation d'une École Privée

| Dimension | École Privée | Centre de Formation |
|---|---|---|
| Cycle | Année scolaire fixe (sep → juin) | Sessions / cycles flexibles (toute l'année) |
| Inscription | Un élève = une classe = une année | Un apprenant peut s'inscrire dans plusieurs formations simultanément |
| Bulletins officiels | Oui (format Ministère) | Non — attestations et relevés internes |
| Programmes | Programme national officiel | Programmes propres au centre |
| Groupes | Classes fixes par niveau/filière | Groupes constitués par niveau d'évaluation initiale |
| Public | Enfants 5–18 ans scolarisés | Tous âges : enfants, lycéens, étudiants, adultes, professionnels |
| Enseignants | Professeurs titulaires à plein temps | Formateurs souvent à temps partiel, multi-établissements |
| Transport/Cantine | Fréquent | Quasi inexistant |
| Bibliothèque | Oui | Non (ou très rare) |
| Infirmerie | Oui | Non |
| Paiement | Frais annuels/trimestriels | Par mois, par session, par module, à l'inscription |

---

### 18.2 Types d'Établissements de Formation

Le système ILMI reconnaît les catégories de formation suivantes. Un centre peut combiner plusieurs catégories (centre mixte).

#### COURS DE SOUTIEN SCOLAIRE
Renforcement du programme national pour les élèves du primaire, CEM et lycée.

**Sous-types :**
- Cours de soutien général (toutes matières, tous niveaux)
- Préparation examen BEP (5ème primaire)
- Préparation examen BEM (4ème AM)
- Préparation BAC (2AS/3AS par filière : sciences, maths, lettres, langues, gestion)
- Cours de rattrapage post-exam
- Cours par matière isolée (maths uniquement, physique uniquement, etc.)

**Matières typiques par niveau :** (l'admin d'ecole peut ajouter des matieres comme il veut)
- Primaire : Maths, Français, Arabe, Éveil scientifique, Éducation islamique
- CEM : Maths, Physique, Français, Arabe, Anglais, Histoire-Géo, Sciences naturelles
- Lycée (selon filière) : Maths, Physique, Sciences naturelles, Philosophie, Littérature arabe ,français, Anglais, Économie, Gestion , HIS/GEO

#### ÉCOLES DE LANGUES ÉTRANGÈRES
Enseignement de langues avec progression par niveaux.

**Langues enseignées :**
- Anglais (général, business, académique)
- Français (general,FLE, FOS, préparation DELF/DALF/TCF)
- Espagnol (général, préparation DELE)
- Allemand (général, préparation Goethe-Zertifikat)
- Turc (en forte croissance depuis 2018)
- Chinois mandarin (émergent)
- Arabe littéraire (pour non-arabophones ou remise à niveau)
- Italien

**Certifications internationales préparées :**
- IELTS (Academic & General Training)
- TOEFL iBT
- TOEIC (pour l'emploi)
- Cambridge (KET, PET, FCE, CAE, CPE)
- DELF A1→B2 / DALF C1→C2
- TCF (pour immigration Canada/France)
- DELE (espagnol)
- Goethe-Zertifikat (allemand)

**Niveaux selon CECRL :** A1 → A2 → B1 → B2 → C1 → C2

#### FORMATIONS NUMÉRIQUES & TECHNOLOGIQUES

- **Informatique bureautique** : Windows, Word, Excel, PowerPoint, Outlook
- **Développement web** : HTML/CSS, JavaScript, PHP, Python, React, WordPress
- **Développement mobile** : Flutter, Android natif, React Native
- **Réseaux & Infrastructure** : Cisco (CCNA), Linux administration, virtualisation
- **Cybersécurité** : bases, ethical hacking, certifications CompTIA
- **Infographie & Design** : Photoshop, Illustrator, InDesign, Canva, UI/UX
- **Montage vidéo & audiovisuel** : Premiere Pro, After Effects, DaVinci Resolve
- **Marketing digital** : SEO, réseaux sociaux, Google Ads, Facebook Ads, email marketing
- **Bureautique avancée** : Excel avancé, VBA, Power BI, Access
- **Robotique & électronique** : Arduino, Raspberry Pi, impression 3D (en forte croissance pour enfants et ados)
- **DAO/CAO** : AutoCAD, SolidWorks (pour lycéens techniques et adultes)
- **Comptabilité informatisée** : logiciels algériens (Sage, etc.)

#### FORMATIONS PROFESSIONNELLES & MÉTIERS

- Coiffure & esthétique
- Couture & stylisme
- Cuisine & pâtisserie
- Électricité bâtiment
- Plomberie & sanitaire
- Soudure
- Gestion & comptabilité
- Secrétariat & bureautique
- Commerce & vente
- Logistique & supply chain

#### CENTRES MIXTES

Un centre mixte combine plusieurs catégories. Exemples courants en Algérie :
- Cours de soutien + Langues (la combinaison la plus fréquente)
- Langues + Préparation certifications + Formations numériques
- Soutien scolaire + Robotique pour enfants
- Formations professionnelles + Informatique bureautique

---

### 18.3 Architecture & Différences vs École Privée

#### Modèle de Données : Deux Modes, Un Seul Système

```
InstitutionType (Enum)
  ├── PRIVATE_SCHOOL     → Logique existante (sections/niveaux officiels)
  └── TRAINING_CENTER    → Nouvelle logique (départements/programmes/groupes)
```

Chaque tenant dans le Super Admin Panel est créé avec un `institution_type`. Ce champ détermine :
- Quelle interface est affichée dans le panneau admin web
- Quels modules sont disponibles à l'activation
- Quelle terminologie est utilisée (élève vs apprenant, classe vs groupe, enseignant vs formateur, bulletin vs attestation)
- Quel workflow de configuration (setup) est proposé

#### Terminologie Centre de Formation vs École Privée

| École Privée | Centre de Formation |
|---|---|
| Élève | Apprenant |
| Enseignant | Formateur |
| Classe | Groupe |
| Section (Primaire/CEM/Lycée) | Département (Langues / Soutien / Numérique / ...) |
| Matière | Module / Formation |
| Bulletin trimestriel | Attestation de formation / Relevé de progression |
| Année scolaire | Session / Cycle |
| Inscription annuelle | Inscription par formation |
| Coefficient | Poids de l'évaluation |
| Rang de classe | Score de progression |

#### Modules Disponibles pour un Centre de Formation

| Module | Disponible ? | Notes |
|---|---|---|
| Gestion des apprenants | ✅ Toujours inclus | Adapté au profil formation |
| Gestion des formateurs | ✅ Toujours inclus | Gestion temps partiel, multi-centres |
| Emploi du temps | ✅ Toujours inclus | Priorité maximale |
| Présences | ✅ Toujours inclus | Par séance |
| Devoirs & Ressources | ✅ Toujours inclus | — |
| Évaluations & Niveaux | ✅ Toujours inclus | Test de placement, progression |
| Gestion Financière | ✅ Optionnel | Très fortement recommandé |
| Messagerie SMS | ✅ Optionnel | Rappels séances, annonces |
| Applications Mobiles | ✅ Optionnel | Formateur + Apprenant + Parent |
| Annonces & Communication | ✅ Inclus | — |
| Chatbot IA | ✅ Optionnel | ✅ Optionnel |
| E-learning | ✅ Optionnel | ✅ Optionnel |
| Empreintes Digitales | ✅ Optionnel | Présences automatiques |
| Cantine | ❌ Non disponible | Non applicable |
| Transport | ❌ Non disponible | Non applicable |
| Bibliothèque | ❌ Non disponible | Non applicable |
| Infirmerie | ❌ Non disponible | Non applicable |

---

### 18.4 Configuration (Setup) d'un Centre de Formation

La configuration d'un centre de formation est différente du setup d'une école privée. Le Super Admin crée le centre, et lors du premier accès, l'admin du centre est guidé par un **wizard de configuration en 6 étapes**.

#### Étape 1 — Informations Générales du Centre

- Nom officiel du centre
- Adresse complète + wilaya + commune
- Téléphone(s) + email + site web
- Logo et couleurs du centre
- Capacité d'accueil (nombre max d'apprenants simultanés)
- Nombre de salles disponibles avec noms et capacités (ex. : Salle A — 12 places, Salle Informatique — 20 postes, etc.)
- Horaires d'ouverture : jours de la semaine + plages horaires (ex. : Sam-Jeu 8h→21h, Ven fermé)

#### Étape 2 — Définition des Départements

Le centre crée ses départements (qui correspondent aux grandes catégories de ce qu'il propose).

Exemples :
- Département Cours de Soutien
- Département Langues Étrangères
- Département Formations Numériques
- Département Formations Professionnelles

Chaque département a : nom, couleur d'identification (pour l'emploi du temps), responsable désigné.

Un département peut être désactivé sans supprimer les données.

#### Étape 3 — Définition des Formations / Programmes

Dans chaque département, l'admin crée les formations proposées.

**Formulaire de création d'une formation :**
- Nom de la formation (ex. : "Anglais B1→B2", "Préparation BAC Sciences", "CCNA Cisco", "Photoshop initiation")
- Département parent
- Type de public : enfants (6–12) / adolescents (13–17) / adultes (18+) / mixte
- Durée totale de la formation (en heures ou en mois)
- Prérequis (niveau minimum requis, ex. : "avoir le niveau A2" ou "avoir validé la 4ème AM")
- Mode d'évaluation du niveau à l'entrée : test de placement / entretien / aucun
- Système de niveaux interne (si applicable) :
  - Pour les langues : A1, A2, B1, B2, C1, C2 (standard CECRL)
  - Pour l'informatique : Débutant / Intermédiaire / Avancé
  - Pour les cours de soutien : par classe scolaire (1AM, 2AM... 3AS)
  - Pour les formations professionnelles : Module 1, Module 2...
- Tarif de la formation (utilisé par le module financier)
- Durée d'un groupe (ex. : 3 mois, 6 mois, renouvelable)
- Nombre max d'apprenants par groupe
- Matériaux fournis (support de cours, livres) et si inclus dans le tarif

#### Étape 4 — Configuration des Créneaux Horaires

- Définition des tranches horaires standard du centre (ex. : 8h-10h, 10h-12h, 14h-16h, 16h-18h, 18h-20h, 20h-22h)
- Ces créneaux sont la base de construction de l'emploi du temps
- Jours ouvrables configurables (dimanche à jeudi + samedi = standard algérien, mais certains centres ouvrent le vendredi)
- Durée minimale d'une séance (ex. : 1h30, 2h)

#### Étape 5 — Paramètres Financiers (si module Finance activé)

- Devise : DZD (par défaut)
- Modes de paiement acceptés : espèces, CCP, BaridiMob, CIB, virement
- Politique d'inscription : acompte à l'inscription (montant fixe ou %) + solde à payer avant la 1ère séance
- Politique de remboursement (configurée comme texte légal affiché aux apprenants)
- Rappels automatiques de paiement (J-7, J0, J+3)
- TVA applicable (selon statut juridique du centre)
- Numéros de compte (CCP, RIB) pour les reçus

#### Étape 6 — Import Initial des Données (optionnel)

- Import des formateurs via Excel (nom, prénom, téléphone, email, département, formation(s) enseignée(s))
- Import des apprenants existants via Excel
- Les apprenants déjà dans le système ILMI (école privée) sont liés automatiquement si leur numéro de téléphone parent correspond — mais avec les restrictions de confidentialité (voir section 18.14)

---

### 18.5 Gestion des Apprenants

#### Profil Apprenant — Spécificités Formation

Un apprenant dans un centre de formation a un profil plus léger que dans une école privée, car le centre n'a pas vocation à gérer tous les aspects de sa vie scolaire.

**Informations collectées à l'inscription :**
- Prénom, nom, date de naissance
- Sexe
- Numéro de téléphone (identifiant principal)
- Email (optionnel)
- Photo (optionnel)
- Wilaya et commune de résidence
- Contact parent/tuteur (obligatoire si mineur) : prénom, nom, téléphone
- Niveau scolaire actuel (si cours de soutien) : indiqué par l'apprenant, non importé de l'école privée
- École fréquentée (si cours de soutien) : nom uniquement, informatif
- Objectif : pourquoi il s'inscrit (préparation exam, amélioration générale, certification, emploi, etc.)

> ⚠️ **Règle de confidentialité fondamentale** : si cet apprenant existe déjà dans le système en tant qu'élève d'une école privée ILMI, le centre de formation **ne peut pas accéder** à ses notes, bulletins, dossier disciplinaire, ou toute autre donnée de l'école privée. Seul le nom et le numéro de téléphone servent à la reconnaissance. Voir section 18.14.

#### Inscriptions Multiples Simultanées

Un apprenant peut s'inscrire à **plusieurs formations en même temps** dans le même centre (ex. : anglais B1 le matin + préparation BAC maths le soir). Chaque inscription est indépendante avec :
- Son propre tarif et suivi de paiement
- Son propre groupe et emploi du temps
- Son propre suivi de présences
- Son propre carnet d'évaluations

#### Statuts d'un Apprenant

- **Actif** : en cours de formation, paiement à jour
- **Suspendu** : arrêt temporaire (maladie, voyage) — place conservée dans le groupe
- **En attente de paiement** : inscrit mais paiement en retard — accès limité
- **Terminé** : a complété la formation avec succès
- **Abandonné** : a arrêté avant la fin (avec date et raison)
- **En liste d'attente** : groupe complet, sera notifié à l'ouverture d'une place

#### Fiche Apprenant — Vue Admin

- Informations personnelles
- Toutes les formations auxquelles il est inscrit (passées et présentes)
- Pour chaque formation : groupe, dates, paiements, présences, résultats d'évaluations
- Historique des paiements global
- Communications reçues (annonces, messages)
- Attestations générées

#### Test de Placement (Évaluation Initiale de Niveau)

Pour les formations avec niveaux (langues, informatique) :
- Le centre peut configurer un test de placement pour chaque formation
- L'admin saisit les résultats du test → le système suggère automatiquement le groupe approprié
- Le formateur peut réviser la suggestion après la 1ère séance
- Le résultat du test de placement est conservé dans le dossier de l'apprenant

---

### 18.6 Gestion des Formateurs

#### Profil Formateur — Spécificités Formation

Les formateurs dans les centres de formation algériens ont des profils très spécifiques qui diffèrent des enseignants d'école privée :

**Cas 1 — Formateur pur (uniquement dans ce centre) :**
- Profil complet créé dans le centre
- Toutes ses disponibilités sont gérées dans le centre

**Cas 2 — Formateur également enseignant dans une école privée ILMI :**
- Le système détecte la correspondance (numéro de téléphone)
- Le formateur a **un seul compte mobile** pour les deux établissements
- Dans son app, il switche entre "École Privée [nom]" et "Centre [nom]" avec un sélecteur
- Ses disponibilités dans l'école privée sont **importées en lecture seule** dans l'emploi du temps du centre pour éviter les conflits — sans exposer les détails pédagogiques de l'école

**Cas 3 — Formateur dans plusieurs centres de formation :**
- Même logique : un seul compte, sélecteur de centre dans l'app mobile
- Les disponibilités de chaque centre sont visibles pour la détection de conflits

**Informations du profil formateur :**
- Données personnelles complètes + photo
- Spécialité(s) : langues enseignées, certifications obtenues (ex. : "certifié CELTA", "CCNA certifié"), formations assurées
- Type de contrat : vacataire (payé à l'heure) / CDI / CDD
- Taux horaire ou salaire mensuel (lié au module Finance)
- Disponibilités hebdomadaires déclarées (jours et créneaux) — celles-ci alimentent directement la détection de conflits de l'emploi du temps
- Formations assignées (quels groupes il encadre)
- Charge horaire actuelle et maximale configurée
- RIB/CCP pour le virement de salaire

**Suivi des formateurs :**
- Heures effectuées ce mois (calculées depuis les présences marquées)
- Taux de présence des apprenants dans ses groupes (indicateur d'engagement)
- Évaluations réalisées
- Fiches de paie consultables depuis l'app mobile

---

### 18.7 Gestion des Groupes & Niveaux

C'est le cœur opérationnel d'un centre de formation. Un groupe est l'équivalent de la "classe" dans une école privée, mais avec une logique beaucoup plus flexible.

#### Création d'un Groupe

- Nom du groupe (ex. : "Anglais B1 - Groupe Matin", "Prépa BAC Sciences - G3", "CCNA 2025 - S1")
- Formation parent (détermine le département, le programme, les tarifs)
- Formateur assigné
- Niveau (si la formation a des niveaux : A1/A2/B1... ou Débutant/Inter/Avancé)
- Salle assignée (principale)
- Capacité maximale (ex. : 10 pour un cours de langue, 20 pour informatique, 6 pour cours particulier groupe)
- Date de début et date de fin prévue
- Séances par semaine (ex. : 2 séances de 2h par semaine)
- Statut : ouvert aux inscriptions / complet / en cours / terminé / annulé

#### Gestion des Apprenants dans un Groupe

- Ajouter un apprenant au groupe (vérifie la capacité, vérifie les conflits d'horaire avec ses autres groupes)
- Retirer un apprenant (avec raison : abandon, transfert, suspension)
- Transférer un apprenant vers un autre groupe de même niveau (ex. : il préfère le créneau du soir)
- Voir la liste complète des apprenants du groupe avec photo, statut de paiement, taux de présence
- Impression de la liste du groupe (avec ou sans photos)

#### Listes d'Attente

- Si un groupe est complet : inscription automatique en liste d'attente
- Notification automatique quand une place se libère (dans l'ordre d'inscription)
- Le centre peut créer un nouveau groupe dès que la liste d'attente atteint un seuil configurable (ex. : si 8 personnes en attente pour un groupe de 10 → suggestion d'ouvrir un nouveau groupe)

#### Progression & Passage de Niveau

Pour les formations avec niveaux multiples (langues, informatique) :
- Critères de passage configurables : présence minimum (ex. : 80%), note minimum à l'évaluation finale (ex. : 12/20)
- Passage au niveau suivant : décision du formateur validée par l'admin
- Notification à l'apprenant et au parent de la décision
- Attestation de niveau générée automatiquement si passage validé
- Si recalé : option de redoubler le même niveau (en priorité pour la prochaine session) ou de suivre des cours de rattrapage

---

### 18.8 Emploi du Temps & Salles

L'emploi du temps est la fonctionnalité la plus critique pour un centre de formation car les contraintes sont beaucoup plus complexes que dans une école privée : même salle utilisée par plusieurs groupes, formateurs multi-centres, horaires décalés en soirée et weekend.

#### Construction de l'Emploi du Temps

- Interface drag-and-drop (même technologie que les écoles privées)
- Vue par semaine, par salle, par formateur, par groupe
- Chaque créneau planifié = Groupe + Formateur + Salle + Jour + Heure début + Heure fin

#### Détection de Conflits Avancée (Temps Réel)

Le système détecte et bloque instantanément les 4 types de conflits suivants :

**Conflit de salle :** Deux groupes dans la même salle au même moment → signal rouge, impose de changer la salle ou l'horaire

**Conflit formateur (intra-centre) :** Le formateur est déjà assigné à un autre groupe au même créneau → signal rouge

**Conflit formateur (inter-établissements) :** Si le formateur est aussi enseignant dans une école privée ILMI et qu'il a déjà cours à ce créneau → signal orange avec message "Ce formateur est indisponible (autre établissement)"

**Conflit apprenant :** Un apprenant inscrit dans plusieurs groupes du même centre → lors de l'ajout à un nouveau groupe, vérification automatique que ses groupes ne se chevauchent pas

#### Séances Spéciales

- Séance de remplacement (formateur absent) : désigner un remplaçant, ou reporter la séance
- Séance supplémentaire ponctuelle (révision pré-exam)
- Séance annulée : raison (férié, maladie formateur, maintenance salle), notification automatique aux apprenants et parents
- Changement de salle ponctuel

#### Gestion des Salles

- Chaque salle a : nom, capacité, équipements disponibles (tableau blanc, projecteur, ordinateurs, internet, climatisation)
- Taux d'occupation par salle (sur le mois) → analytics pour optimisation
- Alerte si une salle dépasse 90% d'occupation → suggestion d'agrandir ou d'ajouter une salle

#### Vue Formateur

Depuis son application mobile, le formateur voit son emploi du temps complet (tous ses groupes, tous ses centres). Il reçoit une notification push si une modification est faite (séance annulée, changement de salle, nouveau groupe assigné).

---

### 18.9 Présences & Devoirs

Ces deux fonctionnalités sont reprises du système des écoles privées et adaptées au contexte formation.

#### Présences

**Marquage par le formateur (application mobile) :**
- Par défaut : tous présents (même logique optimisée que pour les enseignants)
- Options : Présent / Absent / En retard / Excusé
- Confirmation rapide (5–15 secondes pour un groupe de 10)
- Annulation possible dans les 60 secondes
- Le formateur peut aussi marquer une présence pour une séance de remplacement ou une séance supplémentaire

**Notification aux parents (ou à l'apprenant si majeur) :**
- Si l'apprenant est mineur : notification push + SMS au parent si absent (même délai de 10 minutes que les écoles privées)
- Si l'apprenant est majeur (18+) : notification push à l'apprenant lui-même directement (pas aux parents sauf si explicitement demandé à l'inscription)

**Suivi des présences :**
- Taux de présence par apprenant par formation (%)
- Alerte si taux tombe sous le seuil minimum configuré (ex. : 80%)
- Si l'apprenant est en dessous du minimum, blocage automatique à l'attestation finale avec message "taux de présence insuffisant"
- Rapport mensuel par groupe : tableau des présences séance par séance
- Rapport par apprenant sur toute la durée de la formation

**Justification d'absence :**
- Parent ou apprenant soumet une justification depuis l'app (texte + pièce jointe)
- Le formateur ou l'admin valide
- Absence justifiée ne compte pas dans le calcul du taux si configuré ainsi

#### Devoirs Maison

**Création par le formateur (application mobile) :**
- Titre + description + date limite de rendu
- Pièces jointes : PDF, images, liens (ex. : vidéo YouTube à regarder avant la prochaine séance)
- Assigné à : groupe entier / apprenants spécifiques
- Notification push aux apprenants et parents concernés
- Suivi des accusés de lecture (qui a vu le devoir)
- Marquage "corrigé" par le formateur

**Ressources pédagogiques :**
- Upload de supports de cours : PDF, PowerPoint, Word, images, liens vidéo
- Organisation par formation et par séance/module
- Accessibles dans l'application mobile apprenant
- Téléchargeable pour accès hors ligne

---

### 18.10 Gestion Financière Formation

La finance est le module le plus critique pour les centres de formation après l'emploi du temps. Elle est adaptée aux réalités des centres algériens : paiements mensuels, acomptes, tarifs variables par formation.

#### Structure des Tarifs

**Tarification par formation (non par élève de manière globale) :**
- Chaque formation a son propre tarif
- Types de tarification configurables :
  - **Mensuel** : X DZD par mois (ex. : cours de soutien 2 500 DZD/mois)
  - **Par session** : X DZD pour toute la session/cycle (ex. : préparation BAC 15 000 DZD pour 3 mois)
  - **Par module** : X DZD par module complété (ex. : formation informatique 5 modules à 4 000 DZD chacun)
  - **Horaire** : X DZD/heure (pour cours particuliers)
- Frais d'inscription séparés (non remboursables) : configurables par formation
- Réductions configurables : paiement en une fois (ex. : -10%), fratrie (2ème inscription -15%), fidélité
- Prix par groupe (ex. : groupe intensif plus cher que groupe normal)

#### Enregistrement des Paiements

- Saisie d'un paiement : apprenant, formation, montant, date, mode de paiement, référence, encaissé par
- Modes supportés : espèces, CCP, BaridiMob, CIB, virement
- Paiement partiel autorisé (acompte)
- Génération automatique d'un reçu PDF numéroté
- Envoi du reçu en notification push à l'apprenant et au parent (si mineur)

#### Tableau de Bord Financier par Apprenant

Pour chaque inscription d'un apprenant à une formation :
- Montant total dû (tarif × durée)
- Montant payé
- Solde restant
- Prochaine échéance
- Statut : Payé ✅ / Partiel 🟡 / Impayé 🔴 / En retard ⏰

#### Rappels Automatiques

- J-7 avant l'échéance mensuelle : notification push
- J0 : rappel final
- J+3 : alerte de retard avec notification parent
- J+7 : blocage automatique de l'accès aux ressources pédagogiques en ligne (configurable)
- L'admin peut désactiver le blocage pour des cas particuliers

#### Gestion des Salaires Formateurs

Les formateurs vacataires (la majorité dans les centres algériens) sont payés à l'heure :
- Calcul automatique mensuel : heures effectuées (depuis les présences marquées) × taux horaire
- Vérification et validation par l'admin avant paiement
- Génération d'une fiche de paie simplifiée (pour vacataires) ou complète (pour CDI/CDD)
- Historique des paiements par formateur
- Accessible depuis l'application mobile du formateur (section "Mes paiements")

**Cas formateur multi-établissements :**
- Chaque centre calcule et paie ses propres heures indépendamment
- Le formateur voit ses fiches de paie de chaque centre séparément dans son app

#### Rapports Financiers

- Chiffre d'affaires mensuel par département et par formation
- Taux de recouvrement (% des inscriptions payées)
- Liste des apprenants avec soldes impayés (classée par ancienneté de la dette)
- Masse salariale mensuelle (formateurs)
- Rapport de rentabilité par formation (revenus vs coût formateur)
- Export Excel pour comptabilité externe

---

### 18.11 Évaluations & Certifications

#### Types d'Évaluations

Les centres de formation utilisent un système d'évaluation interne (aucun lien avec les notes officielles de l'école privée de l'apprenant) :

- **Évaluation de début** : test de placement à l'entrée d'une formation (pour constituer les groupes de niveau homogène)
- **Évaluation continue** : notes sur les devoirs maison, participations, mini-tests en séance
- **Évaluation intermédiaire** : test à mi-parcours
- **Évaluation finale** : examen de fin de session/niveau
- **Mock exam** (préparation certifications) : simulation d'examen IELTS, TOEFL, BAC blanc, BEM blanc dans les conditions réelles

**Configuration du barème par formation :**
- L'admin définit le barème de chaque formation (ex. : évaluation continue 30% + examen final 70%)
- Sur 20 par défaut, mais configurable (sur 10, sur 100, sur 100 avec grade A/B/C/D/F)
- Seuil de passage configurable par formation

#### Saisie des Notes

- Le formateur saisit depuis l'application mobile (même interface que pour les écoles privées)
- Soumission à l'admin pour validation (même workflow : brouillon → soumis → validé → publié)
- Une fois publiées : notification push à l'apprenant et au parent

#### Attestations & Certificats

**Attestation de présence :**
- Générée automatiquement à la fin d'une formation si le taux de présence est suffisant
- Contenu : logo centre, nom apprenant, formation suivie, dates, durée en heures, taux de présence, cachet

**Attestation de réussite :**
- Générée si la note finale dépasse le seuil de passage
- Contenu : logo centre, nom apprenant, formation, niveau validé, note/mention, date, signature directeur

**Attestation de niveau (langues) :**
- Pour les centres de langues : attestation de validation du niveau CECRL (A1, A2, B1...)
- Mention du score obtenu et du niveau validé

**Relevé de progression :**
- Document récapitulatif de toutes les évaluations passées dans une formation
- Équivalent du bulletin pour les centres de formation

Tous ces documents sont générés en PDF, personnalisés avec le logo et les couleurs du centre, téléchargeables depuis l'app mobile et envoyés automatiquement aux apprenants.

---

### 18.12 Système d'Annonces & Communication

#### Annonces du Centre

Le système d'annonces est adapté au contexte formation :

**Types d'annonces :**
- **Annonce générale** : à tous les apprenants actifs du centre (ex. : "Le centre sera fermé le 5 juillet")
- **Annonce par département** : à tous les apprenants d'un département (ex. : "Rappel : les examens du département Langues commencent le 15 mars")
- **Annonce par formation** : à tous les inscrits d'une formation spécifique
- **Annonce par groupe** : à un groupe précis (ex. : "Anglais B1 Matin - séance annulée ce lundi")
- **Annonce urgente** : (bannière rouge) pour les fermetures imprévues, annulations de dernière minute
- **Annonce avec confirmation** : l'apprenant doit confirmer avoir lu (accusé de lecture obligatoire)

**Séances annulées — Flux Spécifique :**
C'est le cas d'usage le plus fréquent dans les centres. Le système propose un raccourci dédié :
1. L'admin (ou le formateur depuis son app) sélectionne le groupe + la séance annulée + la raison
2. Notification push immédiate à tous les apprenants du groupe ET à leurs parents si mineurs
3. La séance est marquée "annulée" dans l'emploi du temps avec la raison
4. Option : proposer automatiquement une date de rattrapage dans le message

**Canaux de diffusion :**
- Notification push (application mobile)
- SMS (si module SMS activé)
- Message dans l'application (in-app)
- Les trois simultanément pour les annonces urgentes

#### Messagerie Directe

- L'admin du centre peut envoyer des messages directs à un apprenant, un parent ou un formateur
- Le formateur peut envoyer des messages aux apprenants de ses groupes
- L'apprenant peut envoyer des messages à son formateur ou à l'administration
- Le parent d'un mineur peut écrire à l'administration ou au formateur

---

### 18.13 Applications Mobiles Formation

Les mêmes 3 applications Flutter (formateur, apprenant, parent) sont utilisées. Le comportement s'adapte automatiquement selon le type d'institution (`institution_type`).

#### Application Formateur (Adaptée Formation)

**Sélecteur d'établissement (si formateur multi-établissements) :**
```
┌──────────────────────────────────┐
│  [Icône École] Lycée El Hikma ▼  │
│  [Icône Centre] Centre Alpha     │
└──────────────────────────────────┘
```
Un seul tap pour switcher. Toutes les données se mettent à jour.

**Tableau de bord formateur centre :**
- Groupes du jour avec salles et horaires
- Nombre d'apprenants par groupe
- Séances non marquées (rappel présences)
- Devoirs en attente de correction
- Messages non lus

**Fonctionnalités identiques aux écoles privées :**
- Marquage des présences (même interface, même logique)
- Saisie des notes d'évaluation
- Publication des devoirs maison
- Upload de ressources pédagogiques
- Chat avec apprenants et administration

**Fonctionnalités spécifiques formation :**
- Annuler une séance avec motif (notification automatique déclenchée)
- Demander un remplacement (si absent — l'admin est notifié)
- Voir ses heures effectuées du mois et son salaire estimé (si vacataire)

#### Application Apprenant (Adaptée Formation)

L'apprenant peut avoir accès aux deux espaces (école privée + centre de formation) dans la même application, avec un sélecteur en haut.

**Tableau de bord apprenant centre :**
- Prochaine séance (groupe, salle, formateur, dans combien de temps)
- Devoirs à rendre (toutes formations confondues)
- Dernières notes publiées
- Annonces récentes
- Solde à payer (si module finance activé)

**Fonctionnalités :**
- Emploi du temps de tous ses groupes (vue semaine)
- Ressources pédagogiques de chaque formation
- Résultats d'évaluations et attestations
- Suivi de présences par formation (taux en %)
- Paiements et reçus (si module finance activé)
- Chat avec formateurs et administration
- Notifications de séances annulées ou modifiées

**Données strictement isolées :**
- L'apprenant voit ses données de l'école privée dans l'espace "École"
- Il voit ses données du centre dans l'espace "Formation"
- Ces deux espaces ne se mélangent jamais, même dans la même app

#### Application Parent (Adaptée Formation)

Si l'apprenant est mineur, les parents ont accès à l'espace formation de leur enfant.

**Ce que le parent voit dans l'espace formation :**
- Formations auxquelles son enfant est inscrit
- Emploi du temps des groupes
- Présences par séance
- Dernières notes d'évaluation
- Annonces du centre
- Solde et historique des paiements
- Attestations disponibles à télécharger

**Sélecteur multi-enfants multi-établissements :**
Un parent peut avoir un enfant dans une école privée ILMI ET un enfant (ou le même enfant) dans un centre de formation ILMI. Le sélecteur gère les deux contextes proprement.

---

### 18.14 Isolation des Données & Confidentialité

C'est un point architectural critique. Un même individu peut être simultanément :
- Élève dans une école privée ILMI
- Apprenant dans un centre de formation ILMI
- Et le même individu peut être formateur dans un centre tout en étant aussi enseignant dans une école privée

#### Règle Fondamentale

> **Chaque établissement (école privée ou centre de formation) ne voit que les données qu'il a lui-même collectées.** Aucun établissement ne peut accéder aux données d'un autre établissement, même s'il s'agit du même individu.

#### Ce qu'un Centre de Formation NE peut PAS voir

Même si l'apprenant est reconnu comme étant le même individu qu'un élève d'une école privée ILMI :
- Ses notes et bulletins de l'école privée
- Ses dossiers de présences de l'école privée
- Son dossier disciplinaire
- Son dossier médical (infirmerie)
- Ses informations financières vis-à-vis de l'école privée
- Les informations de ses enseignants à l'école privée
- Le nom de son école privée au-delà de ce que l'apprenant lui-même a déclaré à l'inscription

#### Ce qu'un Centre de Formation PEUT voir

Uniquement les données que l'apprenant (ou son parent) a lui-même fournies lors de l'inscription au centre :
- Nom, prénom, date de naissance, téléphone, email
- Niveau scolaire déclaré (ex. : "2ème AS filière Sciences" — information déclarative uniquement)
- Tout ce que le centre a lui-même collecté : présences, notes, paiements, communications

#### Détection de Doublon (sans partage de données)

Quand un apprenant s'inscrit dans un centre avec un numéro de téléphone qui existe déjà dans le système :
- Le système crée un lien technique interne (même `user_id`) pour éviter les doublons de compte
- Ce lien est **invisible** pour l'admin du centre et l'admin de l'école
- Le formateur/enseignant peut switcher entre ses établissements sans avoir deux comptes différents

#### Implémentation Technique

```python
class CrossInstitutionProfile(Model):
    """
    Lien interne entre le même individu dans plusieurs institutions.
    Jamais exposé via API aux institutions elles-mêmes.
    Accessible uniquement par le SUPER_ADMIN pour des fins de support.
    """
    user = ForeignKey(User)
    institutions = ManyToManyField(School, through='InstitutionMembership')
    
class InstitutionMembership(Model):
    user = ForeignKey(User)
    institution = ForeignKey(School)
    role_in_institution = CharField()   # STUDENT, TEACHER, LEARNER, TRAINER
    local_profile_id = UUIDField()      # ID du profil dans cette institution
    # Aucune donnée de l'autre institution n'est accessible depuis ici
    class Meta:
        unique_together = ['user', 'institution']
```

---

### 18.15 Modules Disponibles pour les Centres de Formation

#### Catalogue des Modules Formation

| ID Module | Nom | Inclus par défaut | Prix mensuel (DZD) | Prix annuel (DZD) |
|---|---|---|---|---|
| `gestion_apprenants` | Gestion Apprenants & Groupes | ✅ Inclus (base) | — | — |
| `emploi_du_temps` | Emploi du Temps & Salles | ✅ Inclus (base) | — | — |
| `presences_devoirs` | Présences & Devoirs | ✅ Inclus (base) | — | — |
| `evaluations` | Évaluations & Attestations | ✅ Inclus (base) | — | — |
| `annonces` | Annonces & Communication | ✅ Inclus (base) | — | — |
| `finance_formation` | Gestion Financière | ✅ Recommandé | 12 000 | 115 200 |
| `sms_formation` | Messagerie SMS | Optionnel | 5 000 | 48 000 |
| `mobile_formation` | Applications Mobiles (3 apps) | Optionnel | 10 000 | 96 000 |
| `empreintes_formation` | Empreintes Digitales | Optionnel | 8 000 | 76 800 |
| `ai_chatbot_formation` | Chatbot IA | Optionnel | 18 000 | 172 800 |

#### Packs Formation

| Pack | Modules inclus | Réduction |
|---|---|---|
| **Pack Starter Formation** | Base + Finance | -0% (prix standard) |
| **Pack Essentiel Formation** | Base + Finance + Mobile + SMS | -15% |
| **Pack Premium Formation** | Tous les modules formation | -25% |

---

### 18.16 Tarification Formation

#### Abonnement de Base (modules inclus)

| Capacité | Mensuel (DZD) | Annuel (DZD) |
|---|---|---|
| Jusqu'à 50 apprenants actifs | 15 000 | 144 000 |
| 51 à 150 apprenants actifs | 25 000 | 240 000 |
| 151 à 300 apprenants actifs | 35 000 | 336 000 |
| 301+ apprenants actifs | 50 000 | 480 000 |

> "Apprenants actifs" = inscrits dans au moins une formation active au cours du mois. Un apprenant inscrit dans 3 formations compte pour 1 apprenant actif.

#### Comparaison Tarifaire : École Privée vs Centre de Formation

| Capacité | École Privée (base) | Centre de Formation (base) | Pourquoi moins cher |
|---|---|---|---|
| Jusqu'à 100 | 25 000 DZD/mois | 15 000 DZD/mois | Moins de modules inclus (pas cantine, transport, infirmerie) |
| 100–300 | 40 000 DZD/mois | 25 000 DZD/mois | Même logique |
| 300–600 | 60 000 DZD/mois | 35 000 DZD/mois | — |

#### Super Admin — Gestion des Centres de Formation

Le Super Admin dispose d'un filtre dédié dans son panneau :
- Vue séparée : "Écoles Privées" / "Centres de Formation" / "Tous"
- Les KPIs sont affichés par catégorie (nombre d'apprenants actifs dans les centres, nombre d'élèves dans les écoles)
- Création d'un centre : le formulaire est adapté (institution_type = TRAINING_CENTER)
- Les modules disponibles à l'activation sont filtrés automatiquement selon le type d'institution

---

*Document généré le 2026 — ILMI Plateforme de Gestion Scolaire & Formation · Version 4.1 · Confidentiel*
