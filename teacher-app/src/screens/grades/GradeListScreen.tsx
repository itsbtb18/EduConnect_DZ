import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { GradesStackParamList } from '../../navigation';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { GradeSession, GradeStatus, ExamType, GradeScale } from '../../types';

type Nav = NativeStackNavigationProp<GradesStackParamList>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const EXAM_LABELS: Record<ExamType, string> = {
  CONTINUOUS: 'Participation continue',
  TEST_1:     'Composition 1',
  TEST_2:     'Composition 2',
  FINAL:      'Examen final',
};

const STATUS_BADGE: Record<GradeStatus, { label: string; color: 'orange' | 'blue' | 'green' | 'red' }> = {
  draft:     { label: 'Brouillon', color: 'orange' },
  submitted: { label: 'Soumis',    color: 'blue'   },
  published: { label: 'Publié',    color: 'green'  },
  returned:  { label: 'Renvoyé',   color: 'red'    },
};

const STATUS_DOT: Record<GradeStatus, string> = {
  draft:     Colors.warning,
  submitted: Colors.primary,
  published: Colors.success,
  returned:  Colors.danger,
};

const FILTER_TABS: Array<{ label: string; value: GradeStatus | 'all' }> = [
  { label: 'Tous',       value: 'all'       },
  { label: 'Brouillon',  value: 'draft'     },
  { label: 'Soumis',     value: 'submitted' },
  { label: 'Publiés',    value: 'published' },
  { label: 'Renvoyés',   value: 'returned'  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GradeListScreen() {
  const navigation          = useNavigation<Nav>();
  const gradeSessions       = useStore(s => s.gradeSessions);
  const classes             = useStore(s => s.classes);
  const students            = useStore(s => s.students);
  const createGradeSession  = useStore(s => s.createGradeSession);

  const [activeFilter, setActiveFilter] = useState<GradeStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create modal state
  const [selClassId,   setSelClassId]   = useState(classes[0]?.id ?? '');
  const [selTrimester, setSelTrimester] = useState<1 | 2 | 3>(1);
  const [selExamType,  setSelExamType]  = useState<ExamType>('TEST_1');

  const filtered = useMemo(
    () => activeFilter === 'all'
      ? gradeSessions
      : gradeSessions.filter(s => s.status === activeFilter),
    [gradeSessions, activeFilter],
  );

  const handleCreate = () => {
    const cls = classes.find(c => c.id === selClassId);
    if (!cls) return;

    const classStudents = students.filter(s => s.classId === selClassId);
    const newSession: GradeSession = {
      id: Date.now().toString(),
      classId: selClassId,
      className: cls.name,
      subject:   cls.subject,
      trimester: selTrimester,
      examType:  selExamType,
      status:    'draft',
      grades: classStudents.map((st, i) => ({
        id:          `g_${Date.now()}_${i}`,
        studentId:   st.id,
        studentName: `${st.firstName} ${st.lastName}`,
        classId:     selClassId,
        subject:     cls.subject,
        trimester:   selTrimester,
        examType:    selExamType,
        value:       0,
        maxValue:    20 as GradeScale,
        status:      'draft',
      })),
    };
    createGradeSession(newSession);
    setShowCreateModal(false);
    // Navigate straight to entry screen
    // We need to wait for the store update — use setTimeout tick
    setTimeout(() => {
      navigation.navigate('GradeEntryScreen', { sessionId: newSession.id });
    }, 50);
  };

  const renderSession = ({ item: session }: { item: GradeSession }) => {
    const badge = STATUS_BADGE[session.status];
    const dot   = STATUS_DOT[session.status];
    return (
      <Card
        style={styles.sessionCard}
        onPress={() => navigation.navigate('GradeEntryScreen', { sessionId: session.id })}
      >
        <View style={styles.sessionRow}>
          {/* Status dot */}
          <View style={[styles.statusDot, { backgroundColor: dot }]} />

          {/* Content */}
          <View style={styles.sessionBody}>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {session.className} — {EXAM_LABELS[session.examType]}
            </Text>
            <Text style={styles.sessionMeta}>
              Trimestre {session.trimester}  ·  {session.subject}  ·  {session.grades.length} élèves
            </Text>
            {session.submittedAt && (
              <Text style={styles.sessionDate}>Soumis le {formatDate(session.submittedAt)}</Text>
            )}
            {session.adminComment && (
              <View style={styles.adminCommentBox}>
                <Text style={styles.adminCommentText}>💬 {session.adminComment}</Text>
              </View>
            )}
          </View>

          {/* Right */}
          <View style={styles.sessionRight}>
            <Badge label={badge.label} color={badge.color} small />
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Notes" subtitle="Gestion des évaluations" />

      {/* ── Filter tabs ── */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.filterTab, activeFilter === tab.value && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.value)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === tab.value && styles.filterTabTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Session list ── */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Aucune évaluation dans cette catégorie</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={s => s.id}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Floating action button ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* ════════════════════════════════════════════════════════════════════
          CREATE SESSION MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle évaluation</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Select class */}
            <Text style={styles.modalLabel}>CLASSE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {classes.map(cls => (
                  <TouchableOpacity
                    key={cls.id}
                    style={[styles.chipBtn, selClassId === cls.id && styles.chipBtnActive]}
                    onPress={() => setSelClassId(cls.id)}
                  >
                    <Text style={[styles.chipText, selClassId === cls.id && styles.chipTextActive]}>
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Select trimester */}
            <Text style={styles.modalLabel}>TRIMESTRE</Text>
            <View style={[styles.chipRow, { marginBottom: Spacing.lg }]}>
              {([1, 2, 3] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chipBtn, selTrimester === t && styles.chipBtnActive]}
                  onPress={() => setSelTrimester(t)}
                >
                  <Text style={[styles.chipText, selTrimester === t && styles.chipTextActive]}>
                    Trimestre {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select exam type */}
            <Text style={styles.modalLabel}>TYPE D'ÉVALUATION</Text>
            <View style={[styles.chipRow, { flexWrap: 'wrap', marginBottom: Spacing.xl }]}>
              {(Object.entries(EXAM_LABELS) as [ExamType, string][]).map(([type, label]) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chipBtn, selExamType === type && styles.chipBtnActive]}
                  onPress={() => setSelExamType(type)}
                >
                  <Text style={[styles.chipText, selExamType === type && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button label="Créer l'évaluation" onPress={handleCreate} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },

  // Filter bar
  filterWrap: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  filterContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray500,
  },
  filterTabTextActive: {
    color: Colors.white,
  },

  // List
  list: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },

  sessionCard: {
    marginBottom: 12,
    padding: 14,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  sessionBody: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
    marginBottom: 3,
  },
  sessionMeta: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 11,
    color: Colors.gray300,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  adminCommentBox: {
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
  sessionRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  chevron: {
    fontSize: 18,
    color: Colors.gray300,
    lineHeight: 22,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray500,
    fontFamily: Fonts.medium,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.strong,
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.gray500,
    padding: 4,
  },
  modalLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray500,
  },
  chipTextActive: {
    color: Colors.primary,
  },
});
