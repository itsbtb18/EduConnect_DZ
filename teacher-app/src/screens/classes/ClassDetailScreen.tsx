import React, { useMemo, useState, useRef } from 'react';
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
  SectionList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { ClassesStackParamList } from '../../navigation';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import GradeColorText from '../../components/ui/GradeColorText';
import AttendanceDot from '../../components/ui/AttendanceDot';
import FileTypeIcon from '../../components/ui/FileTypeIcon';
import EmptyState from '../../components/ui/EmptyState';
import { Student, HomeworkPost, Resource, AttendanceSession, AttendanceRecord } from '../../types';

type Route = RouteProp<ClassesStackParamList, 'ClassDetailScreen'>;
type Nav   = NativeStackNavigationProp<ClassesStackParamList>;

const TABS = ['Élèves', 'Devoirs', 'Ressources', 'Présences'] as const;

// ─── Relative-date helper ────────────────────────────────────────────────────
function relativeDue(dueDate: string): { label: string; color: string } {
  const diff = Math.round((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < -1) return { label: `Il y a ${Math.abs(diff)}j`, color: Colors.danger };
  if (diff === -1) return { label: 'Hier',          color: Colors.danger };
  if (diff === 0)  return { label: "Aujourd'hui",   color: Colors.warning };
  if (diff === 1)  return { label: 'Demain',         color: Colors.warning };
  if (diff <= 3)   return { label: `Dans ${diff}j`, color: Colors.warning };
  return { label: `Dans ${diff}j`, color: Colors.success };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClassDetailScreen() {
  const navigation     = useNavigation<Nav>();
  const route          = useRoute<Route>();
  const insets         = useSafeAreaInsets();
  const { classId }    = route.params;

  const classes            = useStore(s => s.classes);
  const students           = useStore(s => s.students);
  const homeworkPosts      = useStore(s => s.homeworkPosts);
  const resources          = useStore(s => s.resources);
  const attendanceSessions = useStore(s => s.attendanceSessions);
  const deleteHomework     = useStore(s => s.deleteHomework);
  const deleteResource     = useStore(s => s.deleteResource);

  const [activeTab, setActiveTab]         = useState(0);
  const [search, setSearch]               = useState('');
  const [modalSession, setModalSession]   = useState<AttendanceSession | null>(null);

  const classIndex = classes.findIndex(c => c.id === classId);
  const cls        = classes[classIndex];
  const colorIdx   = Math.max(classIndex, 0);
  const subjectColor = Colors.subjects[colorIdx % Colors.subjects.length];

  if (!cls) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Classe introuvable</Text>
      </View>
    );
  }

  const classStudents  = useMemo(() => students.filter(s => s.classId === classId), [students, classId]);
  const classHomework  = useMemo(
    () => [...homeworkPosts.filter(h => h.classId === classId)].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    ),
    [homeworkPosts, classId],
  );
  const classResources = useMemo(() => resources.filter(r => r.classId === classId), [resources, classId]);
  const classSessions  = useMemo(
    () => attendanceSessions.filter(s => s.classId === classId).slice(-5),
    [attendanceSessions, classId],
  );

  const filteredStudents = useMemo(
    () => classStudents.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
    ),
    [classStudents, search],
  );

  // Resources grouped by chapter
  const resourceSections = useMemo(() => {
    const map: Record<string, Resource[]> = {};
    classResources.forEach(r => {
      const key = r.chapter ?? 'Autres';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([title, data]) => ({ title, data }));
  }, [classResources]);

  // Stats
  const avgAttendance = classStudents.length
    ? Math.round(classStudents.reduce((s, st) => s + st.attendanceRate, 0) / classStudents.length)
    : 0;

  // ── Confirm delete ──────────────────────────────────────────────────────────
  const confirmDeleteHomework = (hw: HomeworkPost) => {
    Alert.alert(
      'Supprimer ce devoir',
      `Supprimer "${hw.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteHomework(hw.id) },
      ],
    );
  };

  const confirmDeleteResource = (r: Resource) => {
    Alert.alert(
      'Supprimer cette ressource',
      `Supprimer "${r.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteResource(r.id) },
      ],
    );
  };

  // ── Tab content renders ─────────────────────────────────────────────────────

  // TAB: Élèves
  const renderStudent = ({ item: st, index }: { item: Student; index: number }) => (
    <TouchableOpacity
      style={styles.studentRow}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('StudentDetailScreen', { studentId: st.id })}
    >
      <Avatar name={`${st.firstName} ${st.lastName}`} size={40} colorIndex={index} />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{st.firstName} {st.lastName}</Text>
        <View style={styles.studentMeta}>
          <AttendanceDot status={st.attendanceRate >= 90 ? 'present' : st.attendanceRate >= 75 ? 'late' : 'absent'} />
          <Text style={styles.studentRate}>{st.attendanceRate}%</Text>
        </View>
      </View>
      <GradeColorText value={st.average} maxValue={20} size={14} bold />
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );

  // TAB: Devoirs
  const renderHwRightAction = (hw: HomeworkPost) => (
    <TouchableOpacity
      style={styles.deleteSwipeAction}
      onPress={() => confirmDeleteHomework(hw)}
    >
      <Text style={styles.deleteSwipeIcon}>🗑️</Text>
      <Text style={styles.deleteSwipeLabel}>Supprimer</Text>
    </TouchableOpacity>
  );

  const renderHomework = ({ item: hw }: { item: HomeworkPost }) => {
    const due = relativeDue(hw.dueDate);
    return (
      <TouchableOpacity
        style={styles.hwRow}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('HomeworkDetailScreen', { homeworkId: hw.id })}
        onLongPress={() => confirmDeleteHomework(hw)}
        >
          <View style={styles.hwMain}>
            <View style={styles.hwTitleRow}>
              <Text style={styles.hwTitle} numberOfLines={1}>{hw.title}</Text>
              <View style={[styles.hwDuePill, { backgroundColor: due.color + '20' }]}>
                <Text style={[styles.hwDueText, { color: due.color }]}>{due.label}</Text>
              </View>
            </View>
            <View style={styles.hwMeta}>
              <Text style={styles.hwMetaText}>👁 {hw.viewCount}</Text>
              {hw.attachments.length > 0 && (
                <Text style={styles.hwMetaText}>📎 {hw.attachments.length}</Text>
              )}
              {hw.isCorrected && <Badge label="✅ Corrigé" color="green" small />}
            </View>
          </View>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
    );
  };

  // TAB: Ressources
  const renderResourceItem = ({ item: r }: { item: Resource }) => (
    <View style={styles.resourceRow}>
      <FileTypeIcon fileType={r.fileType} size={24} />
      <View style={styles.resourceInfo}>
        <Text style={styles.resourceTitle} numberOfLines={1}>{r.title}</Text>
        <Text style={styles.resourceMeta}>
          {r.fileSize ? r.fileSize + '  ·  ' : ''}⬇ {r.downloadCount}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.resourceDelete}
        onPress={() => confirmDeleteResource(r)}
      >
        <Text style={{ fontSize: 16 }}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResourceSection = ({ section }: { section: { title: string } }) => (
    <View style={styles.chapterHeader}>
      <Text style={styles.chapterTitle}>📂 {section.title}</Text>
    </View>
  );

  // TAB: Présences
  const sessionSummary = (s: AttendanceSession) => {
    const present = s.records.filter(r => r.status === 'present').length;
    const absent  = s.records.filter(r => r.status === 'absent').length;
    const late    = s.records.filter(r => r.status === 'late').length;
    return { present, absent, late };
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Colored header ─────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: subjectColor, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerClassName}>{cls.name}</Text>
        <Text style={styles.headerSub}>
          {cls.subject}  ·  {cls.studentCount} élèves  ·  Salle {cls.room}
        </Text>

        {/* Stat bubbles */}
        <View style={styles.statsRow}>
          <View style={styles.statBubble}>
            <Text style={styles.statValue}>{cls.averageGrade.toFixed(1)}/20</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBubble}>
            <Text style={styles.statValue}>{avgAttendance}%</Text>
            <Text style={styles.statLabel}>Présences</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBubble}>
            <Text style={styles.statValue}>{classHomework.length}</Text>
            <Text style={styles.statLabel}>Devoirs</Text>
          </View>
        </View>
      </View>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <View style={[styles.tabBar, { backgroundColor: subjectColor }]}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>
              {tab}
            </Text>
            {activeTab === i && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <View style={styles.tabContent}>

        {/* TAB 0 — Élèves */}
        {activeTab === 0 && (
          <View style={{ flex: 1 }}>
            {/* Search bar */}
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Chercher un élève…"
                placeholderTextColor={Colors.gray300}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            {filteredStudents.length === 0 ? (
              <EmptyState icon="🔍" title="Aucun élève trouvé" />
            ) : (
              <FlatList
                data={filteredStudents}
                keyExtractor={st => st.id}
                renderItem={renderStudent}
                contentContainerStyle={styles.tabList}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.listSep} />}
              />
            )}
          </View>
        )}

        {/* TAB 1 — Devoirs */}
        {activeTab === 1 && (
          <View style={{ flex: 1 }}>
            <View style={styles.tabActionBar}>
              <Button
                label="+ Nouveau devoir"
                onPress={() => navigation.navigate('AddHomeworkScreen', { classId })}
                size="sm"
              />
            </View>
            {classHomework.length === 0 ? (
              <EmptyState icon="📝" title="Aucun devoir" subtitle="Commencez par en créer un" />
            ) : (
              <FlatList
                data={classHomework}
                keyExtractor={hw => hw.id}
                renderItem={renderHomework}
                contentContainerStyle={styles.tabList}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.listSep} />}
              />
            )}
          </View>
        )}

        {/* TAB 2 — Ressources */}
        {activeTab === 2 && (
          <View style={{ flex: 1 }}>
            <View style={styles.tabActionBar}>
              <Button
                label="+ Uploader"
                onPress={() => navigation.navigate('AddResourceScreen', { classId })}
                size="sm"
              />
            </View>
            {resourceSections.length === 0 ? (
              <EmptyState icon="📂" title="Aucune ressource" subtitle="Uploadez votre première ressource" />
            ) : (
              <SectionList
                sections={resourceSections}
                keyExtractor={r => r.id}
                renderItem={renderResourceItem}
                renderSectionHeader={renderResourceSection}
                contentContainerStyle={styles.tabList}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
              />
            )}
          </View>
        )}

        {/* TAB 3 — Présences */}
        {activeTab === 3 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabList}
          >
            <View style={{ marginBottom: 16 }}>
              <Button
                label="📋 Marquer la présence"
                onPress={() => navigation.navigate('AttendanceScreen', { classId })}
                fullWidth
              />
            </View>

            {classSessions.length === 0 ? (
              <EmptyState icon="📋" title="Aucune séance enregistrée" />
            ) : (
              <View>
                <Text style={styles.presenceSubTitle}>Dernières séances</Text>
                {classSessions.map(session => {
                  const { present, absent, late } = sessionSummary(session);
                  return (
                    <TouchableOpacity
                      key={session.id}
                      style={styles.sessionRow}
                      activeOpacity={0.8}
                      onPress={() => setModalSession(session)}
                    >
                      <View style={styles.sessionLeft}>
                        <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                        <Text style={styles.sessionSlot}>{session.slot}</Text>
                      </View>
                      <View style={styles.sessionRight}>
                        <Text style={[styles.sessionStat, { color: Colors.success }]}>✅ {present}</Text>
                        <Text style={[styles.sessionStat, { color: Colors.danger }]}>❌ {absent}</Text>
                        <Text style={[styles.sessionStat, { color: Colors.warning }]}>⏰ {late}</Text>
                      </View>
                      <Text style={styles.rowChevron}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Attendance detail modal ─────────────────────────────────────────── */}
      <Modal
        visible={modalSession !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModalSession(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Présences — {modalSession ? formatDate(modalSession.date) : ''}
              </Text>
              <TouchableOpacity onPress={() => setModalSession(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {modalSession?.records.map((rec: AttendanceRecord) => (
                <View key={rec.studentId} style={styles.modalRecordRow}>
                  <AttendanceDot status={rec.status} />
                  <Text style={styles.modalStudentName}>{rec.studentName}</Text>
                  <View style={[
                    styles.modalStatusPill,
                    {
                      backgroundColor:
                        rec.status === 'present' ? Colors.successLight :
                        rec.status === 'absent'  ? Colors.dangerLight  :
                        Colors.warningLight,
                    },
                  ]}>
                    <Text style={[
                      styles.modalStatusText,
                      {
                        color:
                          rec.status === 'present' ? Colors.success :
                          rec.status === 'absent'  ? Colors.danger  :
                          Colors.warning,
                      },
                    ]}>
                      {rec.status === 'present' ? 'Présent' : rec.status === 'absent' ? 'Absent' : 'En retard'}
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

  // ── Header ──
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    marginBottom: Spacing.sm,
    padding: 4,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 22,
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  headerClassName: {
    fontSize: 22,
    fontFamily: Fonts.extraBold,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Fonts.regular,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: Radius.md,
    padding: 12,
  },
  statBubble: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: Fonts.extraBold,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 2,
  },

  // ── Tab bar ──
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255,255,255,0.55)',
  },
  tabLabelActive: {
    color: Colors.white,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.white,
  },

  // ── Tab content ──
  tabContent: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  tabList: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  tabActionBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  listSep: {
    height: 1,
    backgroundColor: Colors.gray100,
  },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.card,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray900,
    paddingVertical: 2,
  },

  // ── Students ──
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentRate: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  rowChevron: {
    fontSize: 20,
    color: Colors.gray300,
    lineHeight: 24,
  },

  // ── Homework ──
  hwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  hwMain: {
    flex: 1,
  },
  hwTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  hwTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
  },
  hwDuePill: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hwDueText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  hwMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hwMetaText: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  deleteSwipeAction: {
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minWidth: 80,
  },
  deleteSwipeIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  deleteSwipeLabel: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },

  // ── Resources ──
  chapterHeader: {
    paddingVertical: 8,
    marginTop: 8,
  },
  chapterTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.gray700,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    ...Shadow.card,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    marginBottom: 3,
  },
  resourceMeta: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  resourceDelete: {
    padding: 4,
  },

  // ── Attendance ──
  presenceSubTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray700,
    marginBottom: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 8,
    ...Shadow.card,
    gap: 8,
  },
  sessionLeft: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    marginBottom: 2,
  },
  sessionSlot: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  sessionRight: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionStat: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },

  // ── Modal ──
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
    maxHeight: '80%',
    paddingBottom: 40,
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
  modalRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalStatusText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
});
