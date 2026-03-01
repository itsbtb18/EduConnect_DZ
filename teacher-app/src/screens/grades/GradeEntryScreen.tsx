import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { GradesStackParamList } from '../../navigation';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import { Grade } from '../../types';
import { EXAM_LABELS } from './GradeListScreen';

type Route = RouteProp<GradesStackParamList, 'GradeEntryScreen'>;
type Nav   = NativeStackNavigationProp<GradesStackParamList>;

// ─── Grade border/bg logic ────────────────────────────────────────────────────
function gradeStyle(value: number, maxValue: number, empty: boolean) {
  if (empty) return { borderColor: Colors.gray300, bg: Colors.white };
  const ratio = value / maxValue;
  if (ratio >= 0.7) return { borderColor: Colors.success, bg: Colors.successLight };
  if (ratio >= 0.5) return { borderColor: Colors.primary, bg: Colors.primaryLight };
  return { borderColor: Colors.danger, bg: Colors.dangerLight };
}

// ─── Row item ─────────────────────────────────────────────────────────────────
interface RowItem {
  grade: Grade;
  idx:   number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GradeEntryScreen() {
  const navigation        = useNavigation<Nav>();
  const route             = useRoute<Route>();
  const insets            = useSafeAreaInsets();
  const { sessionId }     = route.params;

  const gradeSessions      = useStore(s => s.gradeSessions);
  const updateGradeValue   = useStore(s => s.updateGradeValue);
  const submitGradeSession = useStore(s => s.submitGradeSession);

  const session = gradeSessions.find(s => s.id === sessionId);

  // Local draft values keyed by studentId (raw string as user types)
  const [draftValues, setDraftValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    session?.grades.forEach(g => {
      init[g.studentId] = g.value > 0 ? g.value.toString() : '';
    });
    return init;
  });

  const editable = session?.status === 'draft' || session?.status === 'returned';

  // ── Live stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!session) return { avg: 0, highest: 0, lowest: 0, filled: 0, total: 0 };
    const values = session.grades
      .map(g => {
        const raw = draftValues[g.studentId];
        return raw !== undefined && raw !== '' ? parseFloat(raw) : g.value;
      })
      .filter(v => !isNaN(v) && v > 0);
    const total = session.grades.length;
    const filled = values.length;
    const avg = filled ? values.reduce((a, b) => a + b, 0) / filled : 0;
    const highest = filled ? Math.max(...values) : 0;
    const lowest  = filled ? Math.min(...values) : 0;
    return { avg, highest, lowest, filled, total };
  }, [session, draftValues]);

  // ── Input change ────────────────────────────────────────────────────────────
  const handleChange = useCallback((studentId: string, text: string, maxValue: number) => {
    // Allow empty, digits, and one dot
    const cleaned = text.replace(/[^0-9.]/g, '');
    setDraftValues(prev => ({ ...prev, [studentId]: cleaned }));

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= maxValue) {
      updateGradeValue(sessionId, studentId, parsed);
    }
  }, [sessionId, updateGradeValue]);

  // ── Fill / clear ────────────────────────────────────────────────────────────
  const fillAllZero = () => {
    if (!session) return;
    const updates: Record<string, string> = {};
    session.grades.forEach(g => {
      if (!draftValues[g.studentId] || draftValues[g.studentId] === '') {
        updates[g.studentId] = '0';
        updateGradeValue(sessionId, g.studentId, 0);
      }
    });
    setDraftValues(prev => ({ ...prev, ...updates }));
  };

  const clearAll = () => {
    Alert.alert(
      'Effacer toutes les notes',
      'Remettre toutes les notes à 0 ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            if (!session) return;
            const reset: Record<string, string> = {};
            session.grades.forEach(g => {
              reset[g.studentId] = '';
              updateGradeValue(sessionId, g.studentId, 0);
            });
            setDraftValues(reset);
          },
        },
      ],
    );
  };

  // ── Save draft ──────────────────────────────────────────────────────────────
  const saveDraft = () => {
    Toast.show({
      type: 'success',
      text1: 'Brouillon enregistré',
      visibilityTime: 2000,
    });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    Alert.alert(
      'Soumettre les notes',
      `Soumettre les notes de ${session?.className ?? ''} à l'administration ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: () => {
            submitGradeSession(sessionId);
            Toast.show({
              type: 'success',
              text1: 'Notes soumises ✓',
              text2: "L'administration a été notifiée.",
              visibilityTime: 2500,
            });
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (!session) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Session introuvable</Text>
      </View>
    );
  }

  const examLabel = EXAM_LABELS[session.examType];
  const listData: RowItem[] = session.grades.map((grade, idx) => ({ grade, idx }));

  // ── Render row ──────────────────────────────────────────────────────────────
  const renderRow = ({ item }: { item: RowItem }) => {
    const { grade, idx } = item;
    const rawDraft = draftValues[grade.studentId] ?? '';
    const isEmpty  = rawDraft === '';
    const gs       = gradeStyle(parseFloat(rawDraft), grade.maxValue, isEmpty);

    return (
      <View style={styles.gradeRow}>
        <Avatar name={grade.studentName} size={36} colorIndex={idx} />

        <Text style={styles.gradeName} numberOfLines={1}>{grade.studentName}</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={[
              styles.gradeInput,
              { borderColor: gs.borderColor, backgroundColor: gs.bg },
            ]}
            value={rawDraft}
            onChangeText={t => handleChange(grade.studentId, t, grade.maxValue)}
            keyboardType="decimal-pad"
            maxLength={4}
            textAlign="center"
            selectTextOnFocus
            editable={editable}
            placeholder="–"
            placeholderTextColor={Colors.gray300}
          />
          <Text style={styles.maxValue}>/{grade.maxValue}</Text>
        </View>
      </View>
    );
  };

  // ── Status banner ────────────────────────────────────────────────────────────
  const StatusBanner = () => {
    if (session.status === 'draft') return null;
    let message = '';
    let bg = Colors.primaryLight;
    let color = Colors.primary;
    if (session.status === 'submitted') {
      message = "⏳ En attente de validation par l'administration";
    } else if (session.status === 'published') {
      message = '✅ Notes publiées — visibles par les élèves et parents';
      bg = Colors.successLight; color = Colors.success;
    } else if (session.status === 'returned') {
      message = "🔄 Renvoyé par l'admin";
      bg = Colors.dangerLight; color = Colors.danger;
    }
    return (
      <View style={[styles.statusBanner, { backgroundColor: bg }]}>
        <Text style={[styles.statusBannerText, { color }]}>{message}</Text>
        {session.status === 'returned' && session.adminComment && (
          <View style={styles.adminComment}>
            <Text style={styles.adminCommentText}>💬 {session.adminComment}</Text>
          </View>
        )}
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <ScreenHeader
        title={examLabel}
        subtitle={`${session.className} · ${session.subject}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <StatusBanner />

      {/* ── Stats row ── */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.avg.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Moyenne</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{stats.highest}</Text>
          <Text style={styles.statLabel}>Max</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.lowest || '–'}</Text>
          <Text style={styles.statLabel}>Min</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.filled}/{stats.total}</Text>
          <Text style={styles.statLabel}>Remplis</Text>
        </View>
      </View>

      {/* ── Fill options bar ── */}
      {editable && (
        <View style={styles.fillBar}>
          <TouchableOpacity style={styles.fillBtn} onPress={fillAllZero}>
            <Text style={styles.fillBtnText}>Tous absents (0)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fillBtn, styles.fillBtnDanger]} onPress={clearAll}>
            <Text style={[styles.fillBtnText, { color: Colors.danger }]}>Effacer tout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Grade list ── */}
      <FlatList
        data={listData}
        keyExtractor={item => item.grade.id}
        renderItem={renderRow}
        contentContainerStyle={[
          styles.gradeList,
          { paddingBottom: editable ? 110 + insets.bottom : 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* ── Bottom actions ── */}
      {editable && (
        <View style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}>
          <TouchableOpacity style={styles.draftBtn} onPress={saveDraft}>
            <Text style={styles.draftBtnText}>💾 Enregistrer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>📤 Soumettre</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },

  // Status banner
  statusBanner: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
  },
  statusBannerText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  adminComment: {
    marginTop: 6,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.sm,
    padding: 8,
  },
  adminCommentText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: Fonts.medium,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: Fonts.extraBold,
    color: Colors.gray900,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.gray500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray100,
    marginVertical: 4,
  },

  // Fill options bar
  fillBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 10,
  },
  fillBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray50,
  },
  fillBtnDanger: {
    borderColor: Colors.dangerLight,
    backgroundColor: Colors.dangerLight,
  },
  fillBtnText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
  },

  // Grade list
  gradeList: {
    paddingTop: 4,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
    gap: 0,
  },
  gradeName: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    paddingHorizontal: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gradeInput: {
    width: 70,
    height: 44,
    borderWidth: 2,
    borderRadius: Radius.md,
    fontSize: 18,
    fontFamily: Fonts.extraBold,
    color: Colors.gray900,
    textAlign: 'center',
  },
  maxValue: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    width: 28,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: 12,
    ...Shadow.strong,
  },
  draftBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  draftBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  submitBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
});
