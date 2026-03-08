# ============================================================
# ILMI — Mobile Store Publishing Configuration
# ============================================================
# App: ILMI — Gestion Scolaire
# Platform: Android (Google Play) / iOS (App Store)
# Category: Education
# ============================================================

## Android (Google Play Store)

### App Details
- **Package Name**: `com.ilmi.mobile`
- **App Name**: ILMI — Gestion Scolaire
- **Short Description**: Plateforme de gestion scolaire pour les écoles privées en Algérie
- **Category**: Education
- **Content Rating**: Everyone
- **Min SDK**: Android 8.0 (API 26)
- **Target SDK**: Android 14 (API 34)

### Build & Sign
```bash
# Generate release keystore (one-time)
keytool -genkey -v -keystore ilmi-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias ilmi -storepass <PASSWORD> -keypass <PASSWORD>

# Build release APK
cd mobile
flutter build apk --release --target-platform android-arm64

# Build release App Bundle (recommended for Play Store)
flutter build appbundle --release
```

### key.properties (android/key.properties — DO NOT COMMIT)
```properties
storePassword=<YOUR_STORE_PASSWORD>
keyPassword=<YOUR_KEY_PASSWORD>
keyAlias=ilmi
storeFile=../ilmi-release.jks
```

### Gradle signing config (android/app/build.gradle.kts)
Already configured via `signingConfigs` block. Ensure `key.properties` exists.

---

## iOS (App Store)

### App Details
- **Bundle ID**: `com.ilmi.mobile`
- **App Name**: ILMI — Gestion Scolaire
- **Category**: Education
- **Min iOS Version**: 14.0
- **Provisioning**: Automatic via Xcode

### Build & Sign
```bash
# Build iOS release
cd mobile
flutter build ipa --release

# The .ipa output is at build/ios/ipa/ilmi_mobile.ipa
# Upload via Transporter or `xcrun altool`
```

---

## Store Listing (French)

### Titre
ILMI — Gestion Scolaire

### Description courte
Gestion complète de votre école : notes, présences, emploi du temps, paiements et communication parents-enseignants.

### Description complète
ILMI est une plateforme de gestion scolaire moderne conçue pour les écoles privées en Algérie.

**Fonctionnalités principales :**
- 📝 Notes et bulletins scolaires
- 📅 Suivi de présence en temps réel
- 📊 Emploi du temps interactif
- 💰 Gestion financière (frais scolaires, paiements)
- 💬 Messagerie parents-enseignants
- 📢 Annonces et notifications push
- 🏥 Infirmerie scolaire
- 🍽️ Gestion de cantine
- 🚌 Transport scolaire
- 📚 Bibliothèque numérique
- 🎮 Gamification et badges
- 🔒 Mode hors ligne

**Rôles supportés :**
- Administrateur d'école
- Enseignant
- Parent d'élève
- Élève

**Sécurité :**
- Authentification par téléphone + mot de passe
- Vérification OTP / TOTP
- Connexion biométrique
- Isolation multi-tenant par école

Application conçue en Algérie 🇩🇿, en français et en arabe.

### Mots-clés
école, gestion scolaire, notes, présence, parents, enseignants, Algérie, éducation, ILMI

### Screenshots requis
- Écran de connexion
- Tableau de bord élève
- Liste des notes
- Emploi du temps
- Messagerie
- Mode hors ligne (bannière)
