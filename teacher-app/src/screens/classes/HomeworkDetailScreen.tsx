import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { ClassesStackParamList } from '../../navigation';
import FileTypeIcon from '../../components/ui/FileTypeIcon';
import { Attachment } from '../../types';

type Route = RouteProp<ClassesStackParamList, 'HomeworkDetailScreen'>;
type Nav   = NativeStackNavigationProp<ClassesStackParamList>;

const MONTHS_FR = [
  'jan','fév','mar','avr','mai','jun',
  'jul','aoû','sep','oct','nov','déc',
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function dueBadge(iso: string): { label: string; bg: string; color: string } {
  const due   = new Date(iso); due.setHours(0,0,0,0);
  const today = new Date();     today.setHours(0,0,0,0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0)  return { label: `En retard — ${formatDate(iso)}`,   bg: Colors.dangerLight,  color: Colors.danger  };
  if (diffDays === 0) return { label: "À rendre aujourd'hui",              bg: Colors.warningLight, color: Colors.warning };
  return { label: `À rendre dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`, bg: Colors.successLight, color: Colors.success };
}

export default function HomeworkDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const insets     = useSafeAreaInsets();
  const { homeworkId } = route.params;

  const homeworkPosts        = useStore(s => s.homeworkPosts);
  const classes              = useStore(s => s.classes);
  const students             = useStore(s => s.students);
  const markHomeworkCorrected = useStore(s => s.markHomeworkCorrected);
  const deleteHomework       = useStore(s => s.deleteHomework);

  const hw  = homeworkPosts.find(h => h.id === homeworkId);
  const cls = classes.find(c => c.id === hw?.classId);
  const studentCount = students.filter(s => s.classId === hw?.classId).length;

  const subjectColorIndex = useMemo(() => {
    if (!cls) return 0;
    const idx = classes.indexOf(cls);
    return idx % Colors.subjects.length;
  }, [cls, classes]);
  const headerColor = Colors.subjects[subjectColorIndex];

  if (!hw) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Devoir introuvable</Text>
      </View>
    );
  }

  const badge = dueBadge(hw.dueDate);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleMarkCorrected = () => {
    Alert.alert(
      'Marquer comme corrigé',
      'Confirmer que ce devoir a été corrigé ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            markHomeworkCorrected(homeworkId);
            Toast.show({ type: 'success', text1: '✅ Devoir marqué comme corrigé', visibilityTime: 2000 });
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce devoir',
      `Supprimer "${hw.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteHomework(homeworkId);
            Toast.show({ type: 'error', text1: '🗑️ Devoir supprimé', visibilityTime: 2000 });
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleDownload = (att: Attachment) => {
    Toast.show({
      type: 'info',
      text1: `Téléchargement de ${att.name}…`,
      text2: '(simulation)',
      visibilityTime: 2500,
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Colored header */}
      <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={2}>{hw.title}</Text>
        <Text style={styles.headerSub}>{hw.className} · {hw.subject}</Text>

        <View style={[styles.dueBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.dueBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card: Détails */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails</Text>
          <Text style={styles.description}>{hw.description || 'Aucune description.'}</Text>

          <Text style={styles.viewCount}>
            👁 Vu par {hw.viewCount}/{studentCount} élèves
          </Text>

          {hw.isCorrected && (
            <View style={styles.correctedTag}>
              <Text style={styles.correctedTagText}>✅ Marqué comme corrigé</Text>
            </View>
          )}
        </View>

        {/* Card: Pièces jointes */}
        {hw.attachments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pièces jointes</Text>
            {hw.attachments.map((att, i) => (
              <View
                key={att.id}
                style={[styles.attachRow, i < hw.attachments.length - 1 && styles.attachDivider]}
              >
                <FileTypeIcon fileType={att.fileType as any} size={20} />
                <View style={styles.attachInfo}>
                  <Text style={styles.attachName} numberOfLines={1}>{att.name}</Text>
                  <Text style={styles.attachSize}>{att.fileSize}</Text>
                </View>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => handleDownload(att)}
                >
                  <Text style={styles.downloadBtnText}>⬇️ Télécharger</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom actions */}
      <View style={[styles.bottomBar, { paddingBottom: 12 + insets.bottom }]}>
        {!hw.isCorrected && (
          <TouchableOpacity style={styles.correctedBtn} onPress={handleMarkCorrected}>
            <Text style={styles.correctedBtnText}>✅ Marquer comme corrigé</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate('AddHomeworkScreen', {
                classId: hw.classId,
                homeworkId: hw.id,
              })
            }
          >
            <Text style={styles.editBtnText}>✏️ Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.pageBg },

  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 20,
    gap: 8,
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.lg,
    padding: 4,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.white,
    lineHeight: 26,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.extraBold,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Fonts.medium,
  },
  dueBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  dueBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
  },

  // Scroll
  scroll: {
    padding: Spacing.xl,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    ...Shadow.card,
    gap: 0,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray700,
    lineHeight: 22,
  },
  viewCount: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginTop: 10,
  },
  correctedTag: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  correctedTagText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.success,
  },

  // Attachments
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  attachDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  attachInfo: { flex: 1 },
  attachName: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
  },
  attachSize: {
    fontSize: 11,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  downloadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray50,
  },
  downloadBtnText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    gap: 10,
    ...Shadow.strong,
  },
  correctedBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
  correctedBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  deleteBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.danger,
  },
});
