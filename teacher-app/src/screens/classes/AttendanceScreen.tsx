import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { ClassesStackParamList } from '../../navigation';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import { AttendanceStatus, AttendanceRecord, Student } from '../../types';

type Route = RouteProp<ClassesStackParamList, 'AttendanceScreen'>;
type Nav   = NativeStackNavigationProp<ClassesStackParamList>;

const DAYS_FR   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

function formatDateFr(d: Date) {
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Row item type ────────────────────────────────────────────────────────────
interface RowItem {
  student: Student;
  record:  AttendanceRecord;
  idx:     number;
}

// ─── Status button ────────────────────────────────────────────────────────────
interface StatusBtnProps {
  label: string;
  status: AttendanceStatus;
  current: AttendanceStatus;
  onPress: () => void;
  disabled?: boolean;
}

function StatusBtn({ label, status, current, onPress, disabled }: StatusBtnProps) {
  const active = current === status;
  const bg =
    active && status === 'present' ? Colors.success :
    active && status === 'late'    ? Colors.warning :
    active && status === 'absent'  ? Colors.danger  :
    Colors.gray100;

  return (
    <TouchableOpacity
      style={[styles.statusBtn, { backgroundColor: bg }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.statusBtnText, { color: active ? Colors.white : Colors.gray500 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AttendanceScreen() {
  const navigation  = useNavigation<Nav>();
  const route       = useRoute<Route>();
  const insets      = useSafeAreaInsets();
  const { classId } = route.params;

  const classes                = useStore(s => s.classes);
  const students               = useStore(s => s.students);
  const attendanceSessions     = useStore(s => s.attendanceSessions);
  const updateAttendanceStatus = useStore(s => s.updateAttendanceStatus);
  const updateAttendanceNote   = useStore(s => s.updateAttendanceNote);
  const createAttendanceSession = useStore(s => s.createAttendanceSession);
  const submitAttendance       = useStore(s => s.submitAttendance);

  const cls         = classes.find(c => c.id === classId);
  const className   = cls?.name   ?? '';
  const subject     = cls?.subject ?? '';
  const classStudents = useMemo(
    () => students.filter(s => s.classId === classId),
    [students, classId],
  );

  const today = new Date();

  // Find today's slot from the class schedule
  const todayName = DAYS_FR[today.getDay()];
  const todaySlot = cls?.schedule.find(s => s.day === todayName);
  const slotLabel = todaySlot
    ? `${todaySlot.startTime} – ${todaySlot.endTime}`
    : formatDateFr(today);

  // ── Ensure session exists in store ──────────────────────────────────────────
  const existingSession = attendanceSessions.find(s => s.classId === classId);
  const [sessionId] = useState<string>(() => existingSession?.id ?? `AS_${classId}_${Date.now()}`);

  useEffect(() => {
    if (!existingSession) {
      // Create fresh session, all students default to 'present'
      createAttendanceSession({
        id: sessionId,
        classId,
        className,
        subject,
        date: today.toISOString(),
        slot: slotLabel,
        isSubmitted: false,
        records: classStudents.map(s => ({
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          status: 'present',
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reactive session from store
  const session = attendanceSessions.find(s => s.id === sessionId);
  const records = session?.records ?? [];
  const isSubmitted = session?.isSubmitted ?? false;

  // ── Counts ──────────────────────────────────────────────────────────────────
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount  = records.filter(r => r.status === 'absent').length;
  const lateCount    = records.filter(r => r.status === 'late').length;

  // ── Local note state (keyed by studentId) ───────────────────────────────────
  const [notes, setNotes] = useState<Record<string, string>>({});

  const updateNote = (studentId: string, text: string) => {
    setNotes(prev => ({ ...prev, [studentId]: text }));
    updateAttendanceNote(sessionId, studentId, text);
  };

  // ── Mark all present ─────────────────────────────────────────────────────────
  const markAllPresent = () => {
    records.forEach(r => {
      if (r.status !== 'present') {
        updateAttendanceStatus(sessionId, r.studentId, 'present');
      }
    });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    Alert.alert(
      'Soumettre l\'appel',
      `Êtes-vous sûr de vouloir soumettre l'appel pour ${className} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: () => {
            submitAttendance(sessionId);
            Toast.show({
              type: 'success',
              text1: 'Appel soumis !',
              text2: 'Les parents des élèves absents ont été notifiés.',
              visibilityTime: 3000,
            });
            navigation.goBack();
          },
        },
      ],
    );
  };

  // ── Summary modal (read-only view) ───────────────────────────────────────────
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // ── Build FlatList data ──────────────────────────────────────────────────────
  const listData: RowItem[] = useMemo(
    () => classStudents.map((student, idx) => ({
      student,
      record: records.find(r => r.studentId === student.id) ?? {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        status: 'present' as AttendanceStatus,
      },
      idx,
    })),
    [classStudents, records],
  );

  // ── Student row ──────────────────────────────────────────────────────────────
  const renderRow = ({ item }: { item: RowItem }) => {
    const { student, record, idx } = item;
    const status = record.status;
    const noteVal = notes[student.id] ?? record.note ?? '';
    const showNoteInput = !isSubmitted && (status === 'absent' || status === 'late');

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentRow}>
          <Avatar name={`${student.firstName} ${student.lastName}`} size={40} colorIndex={idx} />

          <View style={styles.studentMid}>
            <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
            {status === 'absent' && !isSubmitted && (
              <Text style={styles.absentNote}>Absent — Notif. envoyée aux parents</Text>
            )}
            {status === 'late' && !isSubmitted && (
              <Text style={styles.lateNote}>En retard</Text>
            )}
            {isSubmitted && (
              <Text style={[
                styles.submittedStatus,
                {
                  color:
                    status === 'present' ? Colors.success :
                    status === 'absent'  ? Colors.danger  :
                    Colors.warning,
                },
              ]}>
                {status === 'present' ? '✅ Présent' : status === 'absent' ? '❌ Absent' : '⏱ En retard'}
              </Text>
            )}
          </View>

          {!isSubmitted && (
            <View style={styles.btnGroup}>
              <StatusBtn
                label="✓"
                status="present"
                current={status}
                onPress={() => updateAttendanceStatus(sessionId, student.id, 'present')}
              />
              <StatusBtn
                label="⏱"
                status="late"
                current={status}
                onPress={() => updateAttendanceStatus(sessionId, student.id, 'late')}
              />
              <StatusBtn
                label="✗"
                status="absent"
                current={status}
                onPress={() => updateAttendanceStatus(sessionId, student.id, 'absent')}
              />
            </View>
          )}
        </View>

        {showNoteInput && (
          <TextInput
            style={styles.noteInput}
            placeholder="Ajouter une note (optionnel)"
            placeholderTextColor={Colors.gray300}
            value={noteVal}
            onChangeText={t => updateNote(student.id, t)}
          />
        )}
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Appel"
        subtitle={`${className} · ${slotLabel}`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          !isSubmitted ? (
            <TouchableOpacity style={styles.allPresentBtn} onPress={markAllPresent}>
              <Text style={styles.allPresentText}>✅ Tous présents</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* ── Summary bar ──────────────────────────────────────────────────────── */}
      <View style={styles.summaryBar}>
        <View style={[styles.counter, { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.counterValue, { color: Colors.success }]}>{presentCount}</Text>
          <Text style={[styles.counterLabel, { color: Colors.success }]}>présents</Text>
        </View>
        <View style={[styles.counter, { backgroundColor: Colors.dangerLight }]}>
          <Text style={[styles.counterValue, { color: Colors.danger }]}>{absentCount}</Text>
          <Text style={[styles.counterLabel, { color: Colors.danger }]}>absents</Text>
        </View>
        <View style={[styles.counter, { backgroundColor: Colors.warningLight }]}>
          <Text style={[styles.counterValue, { color: Colors.warning }]}>{lateCount}</Text>
          <Text style={[styles.counterLabel, { color: Colors.warning }]}>en retard</Text>
        </View>
      </View>

      {/* ── Already submitted banner ─────────────────────────────────────────── */}
      {isSubmitted && (
        <View style={styles.submittedBanner}>
          <Text style={styles.submittedBannerText}>✅ Appel déjà soumis</Text>
          <TouchableOpacity onPress={() => setShowSummaryModal(true)}>
            <Text style={styles.summaryLink}>Voir le résumé</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── FlatList ─────────────────────────────────────────────────────────── */}
      <FlatList
        data={listData}
        keyExtractor={item => item.student.id}
        renderItem={renderRow}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isSubmitted ? 40 : 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Fixed submit button ───────────────────────────────────────────────── */}
      {!isSubmitted && (
        <View style={[styles.submitBar, { paddingBottom: 16 + insets.bottom }]}>
          <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={handleSubmit}>
            <Text style={styles.submitLabel}>📤  Soumettre l'appel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUMMARY MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Résumé de l'appel — {className}</Text>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDate}>{formatDateFr(today)}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {records.map((rec: AttendanceRecord) => (
                <View key={rec.studentId} style={styles.modalRow}>
                  <Text style={styles.modalStudentName}>{rec.studentName}</Text>
                  <View style={[
                    styles.modalStatusPill,
                    {
                      backgroundColor:
                        rec.status === 'present' ? Colors.successLight :
                        rec.status === 'absent'  ? Colors.dangerLight :
                        Colors.warningLight,
                    },
                  ]}>
                    <Text style={[
                      styles.modalStatusText,
                      {
                        color:
                          rec.status === 'present' ? Colors.success :
                          rec.status === 'absent'  ? Colors.danger :
                          Colors.warning,
                      },
                    ]}>
                      {rec.status === 'present' ? '✅ Présent' : rec.status === 'absent' ? '❌ Absent' : '⏱ En retard'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
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

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  counter: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 20,
    fontFamily: Fonts.extraBold,
  },
  counterLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 1,
  },

  // Submitted banner
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  submittedBannerText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.success,
  },
  summaryLink: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // List
  list: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },

  // Student card
  studentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    padding: 12,
    ...Shadow.card,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentMid: {
    flex: 1,
    paddingHorizontal: 2,
  },
  studentName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    marginBottom: 2,
  },
  absentNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.danger,
  },
  lateNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.warning,
  },
  submittedStatus: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },

  // Status button group
  btnGroup: {
    flexDirection: 'row',
    gap: 5,
  },
  statusBtn: {
    borderRadius: Radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },

  // Note input
  noteInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.gray900,
    backgroundColor: Colors.gray50,
  },

  // All-present header button
  allPresentBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  allPresentText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },

  // Submit bar
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    ...Shadow.strong,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitLabel: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: 0.3,
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
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
    flex: 1,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.gray500,
    padding: 4,
  },
  modalDate: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.lg,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 10,
  },
  modalStudentName: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.gray900,
  },
  modalStatusPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  modalStatusText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
});
