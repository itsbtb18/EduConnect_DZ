import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { ClassesStackParamList } from '../../navigation';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import GradeColorText from '../../components/ui/GradeColorText';
import AttendanceDot from '../../components/ui/AttendanceDot';
import { EXAM_LABELS } from '../grades/GradeListScreen';

type Route = RouteProp<ClassesStackParamList, 'StudentDetailScreen'>;
type Nav   = NativeStackNavigationProp<ClassesStackParamList>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; color: 'green' | 'orange' | 'red' }> = {
  active:    { label: 'Actif',     color: 'green'  },
  watch:     { label: 'Surveillé', color: 'orange' },
  suspended: { label: 'Suspendu',  color: 'red'    },
};

const ATTEND_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  present: { label: 'Présent',  color: Colors.success },
  absent:  { label: 'Absent',   color: Colors.danger  },
  late:    { label: 'Retard',   color: Colors.warning },
};

const TABS = ['Infos', 'Notes', 'Présences', 'Contact'] as const;
type TabKey = typeof TABS[number];

// ─── Component ───────────────────────────────────────────────────────────────
export default function StudentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const insets     = useSafeAreaInsets();
  const { studentId } = route.params;

  const students       = useStore(s => s.students);
  const classes        = useStore(s => s.classes);
  const gradeSessions  = useStore(s => s.gradeSessions);
  const attendanceSessions = useStore(s => s.attendanceSessions);
  const chatRooms      = useStore(s => s.chatRooms);
  const createChatRoom = useStore(s => s.createChatRoom);

  const [activeTab, setActiveTab] = useState<TabKey>('Infos');

  const student = students.find(s => s.id === studentId);
  const cls     = classes.find(c => c.id === student?.classId);

  // Color from subject index — cycle through Colors.subjects
  const subjectColorIndex = useMemo(() => {
    if (!cls) return 0;
    const idx = classes.indexOf(cls);
    return idx % Colors.subjects.length;
  }, [cls, classes]);
  const headerColor = Colors.subjects[subjectColorIndex];

  // ── Grade data ──────────────────────────────────────────────────────────────
  // Find all published grades for this student
  type GradeEntry = { trimester: 1|2|3; examType: string; value: number; maxValue: number; submittedAt?: string };
  const studentGrades = useMemo((): GradeEntry[] => {
    const results: GradeEntry[] = [];
    gradeSessions.forEach(sess => {
      if (sess.status !== 'published' && sess.status !== 'submitted') return;
      const grade = sess.grades.find(g => g.studentId === studentId);
      if (grade && grade.value > 0) {
        results.push({
          trimester:   sess.trimester,
          examType:    sess.examType,
          value:       grade.value,
          maxValue:    grade.maxValue,
          submittedAt: sess.submittedAt,
        });
      }
    });
    return results.sort((a, b) => a.trimester - b.trimester);
  }, [gradeSessions, studentId]);

  // Group by trimester
  const gradesByTrimester = useMemo(() => {
    const map = new Map<number, GradeEntry[]>();
    studentGrades.forEach(g => {
      if (!map.has(g.trimester)) map.set(g.trimester, []);
      map.get(g.trimester)!.push(g);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [studentGrades]);

  // ── Attendance data ─────────────────────────────────────────────────────────
  type AttendEntry = { date: string; status: string; note?: string };
  const studentAttendance = useMemo((): AttendEntry[] => {
    const records: AttendEntry[] = [];
    attendanceSessions
      .filter(s => s.classId === student?.classId && s.isSubmitted)
      .forEach(sess => {
        const rec = sess.records.find(r => r.studentId === studentId);
        if (rec) records.push({ date: sess.date, status: rec.status, note: rec.note });
      });
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [attendanceSessions, studentId, student?.classId]);

  const attendanceSummary = useMemo(() => {
    const all = attendanceSessions
      .filter(s => s.classId === student?.classId && s.isSubmitted)
      .map(sess => sess.records.find(r => r.studentId === studentId))
      .filter(Boolean);
    const present = all.filter(r => r!.status === 'present').length;
    const absent  = all.filter(r => r!.status === 'absent').length;
    const late    = all.filter(r => r!.status === 'late').length;
    return { present, absent, late };
  }, [attendanceSessions, studentId, student?.classId]);

  // ── Navigate to chat ────────────────────────────────────────────────────────
  const handleMessage = () => {
    if (!student) return;
    let room = chatRooms.find(
      r => r.relatedStudentId === studentId && r.type === 'TEACHER_PARENT',
    );
    if (!room) {
      createChatRoom(studentId, 'TEACHER_PARENT');
      room = useStore.getState().chatRooms.find(
        r => r.relatedStudentId === studentId && r.type === 'TEACHER_PARENT',
      );
    }
    if (room) {
      // Navigate to Messages tab → ChatScreen
      (navigation as any).navigate('Messages', {
        screen: 'ChatScreen',
        params: { roomId: room.id },
      });
    }
  };

  if (!student) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Élève introuvable</Text>
      </View>
    );
  }

  const fullName   = `${student.firstName} ${student.lastName}`;
  const statusBadge = STATUS_BADGE[student.status] ?? STATUS_BADGE.active;
  const isAtRisk   = student.average < 10 || student.attendanceRate < 75;

  // ── Render tabs ─────────────────────────────────────────────────────────────
  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      {/* Risk alert */}
      {isAtRisk && (
        <View style={styles.riskCard}>
          <Text style={styles.riskText}>
            ⚠️ Élève à risque — Moyenne : {student.average.toFixed(1)}/20
            {student.attendanceRate < 75 ? `  ·  Présence : ${student.attendanceRate}%` : ''}
          </Text>
        </View>
      )}

      <Card style={styles.infoCard}>
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Classe</Text>
            <Text style={styles.infoCellValue}>{student.className}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Niveau</Text>
            <Text style={styles.infoCellValue}>{cls?.level ?? '—'}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Statut</Text>
            <Badge label={statusBadge.label} color={statusBadge.color} small />
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Présence</Text>
            <Text style={[styles.infoCellValue, student.attendanceRate < 75 && { color: Colors.danger }]}>
              {student.attendanceRate}%
            </Text>
          </View>
          <View style={[styles.infoCell, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoCellLabel}>Moyenne générale</Text>
            <GradeColorText value={student.average} maxValue={20} bold />
          </View>
          <View style={[styles.infoCell, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoCellLabel}>Salle</Text>
            <Text style={styles.infoCellValue}>{cls?.room ?? '—'}</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderNotesTab = () => (
    <View style={styles.tabContent}>
      {gradesByTrimester.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Aucune note publiée</Text>
        </View>
      ) : (
        gradesByTrimester.map(([trimester, grades]) => {
          const avg = grades.reduce((s, g) => s + g.value / g.maxValue * 20, 0) / grades.length;
          return (
            <View key={trimester} style={{ marginBottom: 16 }}>
              <Text style={styles.trimesterHeader}>Trimestre {trimester}</Text>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {grades.map((g, i) => (
                  <View
                    key={i}
                    style={[styles.gradeRow, i < grades.length - 1 && styles.gradeDivider]}
                  >
                    <Text style={styles.gradeExamLabel}>{EXAM_LABELS[g.examType as keyof typeof EXAM_LABELS]}</Text>
                    <GradeColorText value={g.value} maxValue={g.maxValue} bold />
                  </View>
                ))}
                {/* Trimester avg */}
                <View style={styles.trimesterAvgRow}>
                  <Text style={styles.trimesterAvgLabel}>Moyenne du trimestre</Text>
                  <GradeColorText value={parseFloat(avg.toFixed(1))} maxValue={20} bold />
                </View>
              </Card>
            </View>
          );
        })
      )}
    </View>
  );

  const renderPresencesTab = () => (
    <View style={styles.tabContent}>
      {/* Summary */}
      <View style={styles.attendSummary}>
        <View style={styles.attendStat}>
          <Text style={[styles.attendStatVal, { color: Colors.success }]}>{attendanceSummary.present}</Text>
          <Text style={styles.attendStatLabel}>Présents</Text>
        </View>
        <View style={styles.attendDivider} />
        <View style={styles.attendStat}>
          <Text style={[styles.attendStatVal, { color: Colors.danger }]}>{attendanceSummary.absent}</Text>
          <Text style={styles.attendStatLabel}>Absents</Text>
        </View>
        <View style={styles.attendDivider} />
        <View style={styles.attendStat}>
          <Text style={[styles.attendStatVal, { color: Colors.warning }]}>{attendanceSummary.late}</Text>
          <Text style={styles.attendStatLabel}>Retards</Text>
        </View>
      </View>

      {studentAttendance.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>Aucun appel enregistré</Text>
        </View>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {studentAttendance.map((rec, i) => {
            const cfg = ATTEND_STATUS_LABEL[rec.status];
            return (
              <View
                key={i}
                style={[styles.attendRow, i < studentAttendance.length - 1 && styles.gradeDivider]}
              >
                <AttendanceDot status={rec.status as any} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attendDate}>
                    {new Date(rec.date).toLocaleDateString('fr-DZ', {
                      weekday: 'short', day: '2-digit', month: 'long',
                    })}
                  </Text>
                  {rec.note ? <Text style={styles.attendNote}>{rec.note}</Text> : null}
                </View>
                <Text style={[styles.attendStatusLabel, { color: cfg?.color ?? Colors.gray500 }]}>
                  {cfg?.label ?? rec.status}
                </Text>
              </View>
            );
          })}
        </Card>
      )}
    </View>
  );

  const renderContactTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.contactCard}>
        <Avatar name={student.parentName} size={56} colorIndex={2} />
        <Text style={styles.parentName}>{student.parentName}</Text>
        <Text style={styles.parentPhone}>{student.parentPhone}</Text>

        <View style={styles.contactActions}>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: Colors.success }]}
            onPress={() => {
              const phone = student.parentPhone.replace(/\s/g, '');
              Linking.openURL(`tel:${phone}`);
            }}
          >
            <Text style={styles.contactBtnText}>📱 Appeler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: Colors.primary }]}
            onPress={handleMessage}
          >
            <Text style={styles.contactBtnText}>💬 Envoyer un message</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Colored header ── */}
      <View style={[styles.header, { backgroundColor: headerColor, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Avatar name={fullName} size={64} colorIndex={subjectColorIndex + 1} />
        <Text style={styles.headerName}>{fullName}</Text>

        <View style={styles.headerBadgeRow}>
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{student.className}</Text>
          </View>
          <Badge label={statusBadge.label} color={statusBadge.color} small />
        </View>

        <Text style={styles.headerAttend}>{student.attendanceRate}% de présence</Text>
      </View>

      {/* ── Sticky tab bar ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Infos'     && renderInfoTab()}
        {activeTab === 'Notes'     && renderNotesTab()}
        {activeTab === 'Présences' && renderPresencesTab()}
        {activeTab === 'Contact'   && renderContactTab()}
      </ScrollView>
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
    top: 12,
    padding: 4,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.white,
    lineHeight: 26,
  },
  headerName: {
    fontSize: 20,
    fontFamily: Fonts.extraBold,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 6,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  classBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  headerAttend: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Fonts.medium,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray500,
  },
  tabBtnTextActive: {
    color: Colors.primary,
  },

  // Tab content wrapper
  tabContent: {
    padding: Spacing.xl,
    gap: 12,
  },

  // Risk alert
  riskCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  riskText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.danger,
    lineHeight: 19,
  },

  // Info grid
  infoCard: { padding: 0, overflow: 'hidden' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoCell: {
    width: '50%',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 4,
  },
  infoCellLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoCellValue: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
  },

  // Grades tab
  trimesterHeader: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  gradeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  gradeExamLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.gray700,
    flex: 1,
  },
  trimesterAvgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.pageBg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  trimesterAvgLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
    flex: 1,
  },

  // Attendance tab
  attendSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 16,
    marginBottom: 4,
    ...Shadow.card,
  },
  attendStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  attendStatVal: {
    fontSize: 22,
    fontFamily: Fonts.extraBold,
  },
  attendStatLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.gray500,
  },
  attendDivider: {
    width: 1,
    backgroundColor: Colors.gray100,
    marginVertical: 4,
  },
  attendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  attendDate: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.gray900,
    textTransform: 'capitalize',
  },
  attendNote: {
    fontSize: 11,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  attendStatusLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    flexShrink: 0,
  },

  // Contact tab
  contactCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  parentName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
    marginTop: 4,
  },
  parentPhone: {
    fontSize: 14,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginBottom: 8,
  },
  contactActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  contactBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: {
    fontSize: 13,
    color: Colors.gray500,
    fontFamily: Fonts.medium,
  },
});
