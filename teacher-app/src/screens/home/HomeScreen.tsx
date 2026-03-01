import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing, Radius, Shadow } from '../../theme';
import useStore from '../../store/useStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import GradeColorText from '../../components/ui/GradeColorText';
import EmptyState from '../../components/ui/EmptyState';

// ─── Locale helpers ───────────────────────────────────────────────────────────
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function formatDateFr(date: Date): string {
  return `${DAYS_FR[date.getDay()]}, ${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

function relativeDue(dueDate: string): { label: string; color: string } {
  const diff = Math.round((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < -1) return { label: `Il y a ${Math.abs(diff)}j`, color: Colors.danger };
  if (diff === -1) return { label: 'Hier', color: Colors.danger };
  if (diff === 0)  return { label: "Aujourd'hui",              color: Colors.warning };
  if (diff === 1)  return { label: 'Demain',                   color: Colors.warning };
  if (diff <= 3)   return { label: `Dans ${diff}j`,            color: Colors.warning };
  return { label: `Dans ${diff}j`, color: Colors.success };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation     = useNavigation<any>();
  const insets         = useSafeAreaInsets();

  const teacher                 = useStore(s => s.teacher);
  const myClasses               = useStore(s => s.classes);
  const myStudents              = useStore(s => s.students);
  const homeworkPosts           = useStore(s => s.homeworkPosts);
  const gradeSessions           = useStore(s => s.gradeSessions);
  const unreadNotificationCount = useStore(s => s.unreadNotificationCount);
  const unreadMessageCount      = useStore(s => s.unreadMessageCount);

  // ── Derived values ──────────────────────────────────────────────────────────
  const now          = new Date();
  const todayDayName = DAYS_FR[now.getDay()];
  const todayLabel   = formatDateFr(now);

  const totalStudents    = myStudents.length;
  const draftCount       = useMemo(() => gradeSessions.filter(s => s.status === 'draft').length, [gradeSessions]);
  const pendingGradeCount = draftCount;

  const todaySlots = useMemo(() => {
    const result: Array<{ id: string; startTime: string; endTime: string; className: string; room: string; classId: string; classIndex: number }> = [];
    myClasses.forEach((cls, idx) => {
      cls.schedule.forEach(slot => {
        if (slot.day === todayDayName) {
          result.push({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            className: slot.className,
            room: slot.room,
            classId: cls.id,
            classIndex: idx,
          });
        }
      });
    });
    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [myClasses, todayDayName]);

  const hwDueSoon = useMemo(() => {
    const cutoff = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return homeworkPosts.filter(hw => !hw.isCorrected && new Date(hw.dueDate) <= cutoff).length;
  }, [homeworkPosts]);

  const recentHomework = useMemo(
    () => [...homeworkPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3),
    [homeworkPosts],
  );

  const hasTasks = draftCount > 0 || hwDueSoon > 0 || unreadMessageCount > 0;

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goClassDetail = (classId: string) =>
    navigation.navigate('Classes', { screen: 'ClassDetailScreen', params: { classId } });
  const goClassList   = () => navigation.navigate('Classes', { screen: 'ClassListScreen' });
  const goGradeList   = () => navigation.navigate('Notes',   { screen: 'GradeListScreen' });
  const goMessageList = () => navigation.navigate('Messages',{ screen: 'MessageListScreen' });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerBg} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>

        {/* Row 1 — greeting + bell */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSmall}>Bonjour,</Text>
            <Text style={styles.greetingName}>{teacher.firstName} {teacher.lastName}</Text>
          </View>

          <TouchableOpacity
            style={styles.bellWrap}
            onPress={() => navigation.navigate('NotificationScreen')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24 }}>🔔</Text>
            {unreadNotificationCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Row 2 — stat pills */}
        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>👥 {totalStudents} élèves</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>📚 {myClasses.length} classes</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>📋 {pendingGradeCount} notes à soumettre</Text>
          </View>
        </View>
      </View>

      {/* ── SCROLL CONTENT ─────────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── SECTION 1 — Aujourd'hui ───────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Aujourd'hui</Text>
        <Text style={styles.dateLabel}>{todayLabel}</Text>

        {todaySlots.length === 0 ? (
          <Text style={styles.emptyDay}>📅 Pas de cours aujourd'hui</Text>
        ) : (
          <View style={styles.hScrollOuter}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {todaySlots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  activeOpacity={0.85}
                  style={[
                    styles.scheduleCard,
                    { backgroundColor: Colors.subjects[slot.classIndex % Colors.subjects.length] },
                  ]}
                  onPress={() => goClassDetail(slot.classId)}
                >
                  <Text style={styles.scheduleTime}>{slot.startTime} – {slot.endTime}</Text>
                  <Text style={styles.scheduleClass}>{slot.className}</Text>
                  <Text style={styles.scheduleRoom}>Salle {slot.room}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── SECTION 2 — À faire ──────────────────────────────────────────── */}
        <Card style={styles.todoCard}>
          <Text style={styles.todoCardTitle}>⚡ À faire</Text>

          {!hasTasks ? (
            <EmptyState icon="✅" title="Tout est à jour !" />
          ) : (
            <View>
              {draftCount > 0 && (
                <View style={styles.todoRow}>
                  <Text style={styles.todoText}>
                    📊 {draftCount} session{draftCount > 1 ? 's' : ''} de notes en brouillon
                  </Text>
                  <TouchableOpacity
                    style={[styles.todoBtn, { backgroundColor: Colors.accent }]}
                    onPress={goGradeList}
                  >
                    <Text style={styles.todoBtnLabel}>Soumettre</Text>
                  </TouchableOpacity>
                </View>
              )}

              {hwDueSoon > 0 && (
                <View style={styles.todoRow}>
                  <Text style={styles.todoText}>
                    📝 {hwDueSoon} devoir{hwDueSoon > 1 ? 's' : ''} à corriger
                  </Text>
                  <TouchableOpacity
                    style={[styles.todoBtn, styles.todoBtnGhost]}
                    onPress={goClassList}
                  >
                    <Text style={[styles.todoBtnLabel, { color: Colors.primary }]}>Voir</Text>
                  </TouchableOpacity>
                </View>
              )}

              {unreadMessageCount > 0 && (
                <View style={[styles.todoRow, { marginBottom: 0 }]}>
                  <Text style={styles.todoText}>
                    💬 {unreadMessageCount} nouveau{unreadMessageCount > 1 ? 'x' : ''} message{unreadMessageCount > 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity
                    style={[styles.todoBtn, { backgroundColor: Colors.primary }]}
                    onPress={goMessageList}
                  >
                    <Text style={styles.todoBtnLabel}>Répondre</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* ── SECTION 3 — Mes classes ──────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 Mes classes</Text>
          <TouchableOpacity onPress={goClassList}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {myClasses.map((cls, idx) => (
          <TouchableOpacity
            key={cls.id}
            style={styles.classCard}
            activeOpacity={0.8}
            onPress={() => goClassDetail(cls.id)}
          >
            <View
              style={[
                styles.classIndicator,
                { backgroundColor: Colors.subjects[idx % Colors.subjects.length] },
              ]}
            />
            <View style={styles.classBody}>
              <View style={styles.classNameRow}>
                <Text style={styles.className}>{cls.name}</Text>
                <Badge label={cls.level} color="blue" small />
              </View>
              <Text style={styles.classSubInfo}>{cls.subject} · {cls.studentCount} élèves</Text>
            </View>
            <View style={styles.classRight}>
              <GradeColorText value={cls.averageGrade} maxValue={20} size={15} bold />
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── SECTION 4 — Devoirs récents ──────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Devoirs récents</Text>
          <TouchableOpacity onPress={goClassList}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.hwCard}>
          {recentHomework.map((hw, idx) => {
            const due      = relativeDue(hw.dueDate);
            const classIdx = myClasses.findIndex(c => c.id === hw.classId);
            const dotColor = Colors.subjects[Math.max(classIdx, 0) % Colors.subjects.length];
            const isLast   = idx === recentHomework.length - 1;

            return (
              <View
                key={hw.id}
                style={[styles.hwItem, !isLast && styles.hwItemBorder]}
              >
                <View style={styles.hwTopRow}>
                  <View style={styles.hwLeft}>
                    <View style={[styles.hwDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.hwTitle} numberOfLines={1}>{hw.title}</Text>
                    <Badge label={hw.className} color="blue" small />
                  </View>
                  <Text style={[styles.hwDueText, { color: due.color }]}>{due.label}</Text>
                </View>

                <Text style={styles.hwDesc} numberOfLines={1}>{hw.description}</Text>

                {hw.isCorrected && (
                  <View style={{ marginTop: 6 }}>
                    <Badge label="✅ Corrigé" color="green" small />
                  </View>
                )}
              </View>
            );
          })}
        </Card>

      </ScrollView>
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
    backgroundColor: Colors.headerBg,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greetingSmall: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 20,
    color: Colors.white,
    fontFamily: Fonts.extraBold,
  },
  bellWrap: {
    padding: 6,
    marginTop: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontSize: 9,
    color: Colors.white,
    fontFamily: Fonts.bold,
    lineHeight: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pillText: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },

  // ── Section labels ──
  sectionTitle: {
    fontSize: 16,
    color: Colors.gray900,
    fontFamily: Fonts.bold,
  },
  dateLabel: {
    fontSize: 13,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginTop: 2,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },

  // ── Today schedule ──
  emptyDay: {
    fontSize: 13,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginBottom: 20,
  },
  hScrollOuter: {
    marginHorizontal: -Spacing.xl,
    marginBottom: 4,
  },
  hScrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 8,
  },
  scheduleCard: {
    minWidth: 180,
    marginRight: 12,
    borderRadius: Radius.lg,
    padding: 16,
  },
  scheduleTime: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
  },
  scheduleClass: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: Fonts.extraBold,
    marginBottom: 4,
  },
  scheduleRoom: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.regular,
  },

  // ── To-do card ──
  todoCard: {
    marginTop: 20,
    padding: Spacing.lg,
  },
  todoCardTitle: {
    fontSize: 15,
    color: Colors.gray900,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  todoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray700,
    fontFamily: Fonts.medium,
  },
  todoBtn: {
    borderRadius: Radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  todoBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  todoBtnLabel: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },

  // ── Class cards ──
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: 10,
    padding: 14,
    ...Shadow.card,
  },
  classIndicator: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    minHeight: 44,
  },
  classBody: {
    flex: 1,
    paddingLeft: 12,
  },
  classNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  className: {
    fontSize: 14,
    color: Colors.gray900,
    fontFamily: Fonts.bold,
  },
  classSubInfo: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  classRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevron: {
    fontSize: 20,
    color: Colors.gray300,
    marginLeft: 4,
    lineHeight: 24,
  },

  // ── Homework list ──
  hwCard: {
    padding: 0,
    overflow: 'hidden',
  },
  hwItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hwItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  hwTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  hwLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  hwDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  hwTitle: {
    fontSize: 13,
    color: Colors.gray900,
    fontFamily: Fonts.bold,
    flex: 1,
  },
  hwDueText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    flexShrink: 0,
  },
  hwDesc: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginLeft: 16,
  },
});
