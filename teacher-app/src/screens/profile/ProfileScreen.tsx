import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';

export default function ProfileScreen() {
  const navigation   = useNavigation<any>();
  const teacher      = useStore(s => s.teacher);
  const classes      = useStore(s => s.classes);
  const students     = useStore(s => s.students);
  const homeworkPosts  = useStore(s => s.homeworkPosts);
  const resources    = useStore(s => s.resources);
  const gradeSessions = useStore(s => s.gradeSessions);

  // Settings toggles
  const [notifPush,   setNotifPush]   = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);

  // Stats
  const submissionRate = useMemo(() => {
    if (!gradeSessions.length) return '—';
    const done = gradeSessions.filter(
      s => s.status === 'submitted' || s.status === 'published',
    ).length;
    return Math.round((done / gradeSessions.length) * 100) + '%';
  }, [gradeSessions]);

  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => {
            // Show a simple feedback — in production reset store & route to auth
            Alert.alert('À bientôt !', `À bientôt, ${teacher.firstName} 👋`);
          },
        },
      ],
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Contacter le support',
      'support@ilmi.dz\n+213 23 456 789',
      [{ text: 'OK' }],
    );
  };

  // ── Info row ─────────────────────────────────────────────────────────────────
  const InfoRow = ({
    icon, label, value,
  }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoRowBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );

  // ── Toggle row ───────────────────────────────────────────────────────────────
  const ToggleRow = ({
    icon, label, value, onChange, note,
  }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void; note?: string }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.toggleBody}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {note && !value && <Text style={styles.toggleNote}>{note}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.gray300, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.white}
      />
    </View>
  );

  // ── Support row ──────────────────────────────────────────────────────────────
  const SupportRow = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.supportRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.supportLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <ScreenHeader title="Mon Profil" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Profile header card ── */}
        <Card style={styles.profileCard}>
          <Avatar name={fullName} size={80} colorIndex={0} />
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileSubject}>{teacher.subject}</Text>
          <Text style={styles.profileSchool}>{teacher.schoolName}</Text>
        </Card>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Classes', value: classes.length },
            { label: 'Élèves',  value: students.length },
            { label: 'Notes',   value: gradeSessions.length },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Informations personnelles ── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <InfoRow icon="📧" label="Email"     value={teacher.email}      />
          <InfoRow icon="📱" label="Téléphone" value={teacher.phone}      />
          <InfoRow icon="🏫" label="École"     value={teacher.schoolName} />
          <InfoRow icon="📚" label="Matière"   value={teacher.subject}    />
          <TouchableOpacity style={styles.editBtn}
            onPress={() => Alert.alert('Modifier', 'Modification du profil — bientôt disponible.')}
          >
            <Text style={styles.editBtnText}>✏️ Modifier</Text>
          </TouchableOpacity>
        </Card>

        {/* ── Mes classes ── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mes classes</Text>
          {classes.map((cls, i) => (
            <TouchableOpacity
              key={cls.id}
              style={[styles.classRow, i < classes.length - 1 && styles.rowDivider]}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('Classes', {
                  screen: 'ClassDetailScreen',
                  params: { classId: cls.id },
                })
              }
            >
              <View
                style={[
                  styles.classColorBar,
                  { backgroundColor: Colors.subjects[i % Colors.subjects.length] },
                ]}
              />
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classMeta}>{cls.subject} · {cls.studentCount} élèves</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* ── Statistiques ── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          {[
            { label: 'Devoirs publiés',         value: String(homeworkPosts.length)  },
            { label: 'Ressources uploadées',     value: String(resources.length)      },
            { label: 'Sessions de notes',        value: String(gradeSessions.length)  },
            { label: 'Taux de soumission',       value: submissionRate                },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[styles.statDetailRow, i < arr.length - 1 && styles.rowDivider]}
            >
              <Text style={styles.statDetailLabel}>{row.label}</Text>
              <Text style={styles.statDetailValue}>{row.value}</Text>
            </View>
          ))}
        </Card>

        {/* ── Paramètres ── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <ToggleRow
            icon="🔔"
            label="Notifications push"
            value={notifPush}
            onChange={setNotifPush}
          />
          <View style={styles.rowDivider} />
          <ToggleRow
            icon="📧"
            label="Résumé hebdomadaire par email"
            value={emailDigest}
            onChange={setEmailDigest}
          />
          <View style={styles.rowDivider} />
          <ToggleRow
            icon="🌙"
            label="Thème sombre"
            value={darkMode}
            onChange={setDarkMode}
            note="Disponible prochainement"
          />
        </Card>

        {/* ── Aide & Support ── */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Aide &amp; Support</Text>
          <SupportRow
            icon="📖"
            label="Guide d'utilisation"
            onPress={() => Alert.alert('Guide', 'Ouverture du guide…')}
          />
          <View style={styles.rowDivider} />
          <SupportRow icon="💬" label="Contacter le support" onPress={handleSupport} />
          <View style={styles.rowDivider} />
          <SupportRow
            icon="⭐"
            label="Noter l'application"
            onPress={() => Alert.alert('Merci !', 'Votre avis nous aide à nous améliorer 🙏')}
          />
          <View style={styles.rowDivider} />
          <SupportRow
            icon="📋"
            label="Conditions d'utilisation"
            onPress={() => Alert.alert("Conditions d'utilisation", 'En utilisant ILMI, vous acceptez nos CGU disponibles sur ilmi.dz/cgu')}
          />
        </Card>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={styles.version}>ILMI Enseignant · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.pageBg },

  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 48,
    gap: 12,
  },

  // Profile header card
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  profileName: {
    fontSize: 20,
    fontFamily: Fonts.extraBold,
    color: Colors.gray900,
    marginTop: 8,
  },
  profileSubject: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  profileSchool: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.gray500,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
    ...Shadow.card,
  },
  statValue: {
    fontSize: 22,
    fontFamily: Fonts.extraBold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.gray500,
  },

  // Generic section card
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoRowBody: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.gray500,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
  },

  editBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },

  // Class rows
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  classColorBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
    flexShrink: 0,
  },
  classInfo: { flex: 1 },
  className: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
  },
  classMeta: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.gray500,
    marginTop: 2,
  },

  // Stat detail rows
  statDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  statDetailLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.gray700,
  },
  statDetailValue: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },

  // Divider
  rowDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginHorizontal: 16,
  },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  toggleBody: { flex: 1 },
  toggleLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.gray900,
  },
  toggleNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.gray500,
    marginTop: 2,
  },

  // Support rows
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  supportLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.gray900,
  },
  chevron: {
    fontSize: 20,
    color: Colors.gray300,
    lineHeight: 24,
  },

  // Logout
  logoutBtn: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.danger,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.gray300,
    marginTop: 4,
  },
});
