import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Badge from '../../components/ui/Badge';
import { ClassesStackParamList } from '../../navigation';
import { ClassRoom } from '../../types';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;

export default function ClassListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClassesStackParamList>>();
  const classes    = useStore(s => s.classes);

  const todayName  = DAYS_FR[new Date().getDay()];

  const classesWithIndex = useMemo(
    () => classes.map((cls, idx) => ({ cls, idx })),
    [classes],
  );

  const renderClass = ({ item }: { item: { cls: ClassRoom; idx: number } }) => {
    const { cls, idx } = item;
    const subjectColor  = Colors.subjects[idx % Colors.subjects.length];
    const todaySlots    = cls.schedule.filter(s => s.day === todayName);
    const firstToday    = todaySlots[0];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ClassDetailScreen', { classId: cls.id })}
        style={styles.cardWrap}
      >
        {/* Colored strip */}
        <View style={[styles.stripBar, { backgroundColor: subjectColor }]} />

        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              <Text style={styles.className}>{cls.name}</Text>
              <Badge label={cls.level} color="blue" small />
            </View>
            {/* Average circle */}
            <View style={[styles.avgCircle, { backgroundColor: subjectColor + '20' }]}>
              <Text style={[styles.avgValue, { color: subjectColor }]}>
                {cls.averageGrade.toFixed(1)}
              </Text>
              <Text style={[styles.avgMax, { color: subjectColor }]}>/20</Text>
            </View>
          </View>

          <Text style={styles.subjectLabel}>{cls.subject}</Text>

          <Text style={styles.metaRow}>
            👥 {cls.studentCount} élèves{'  ·  '}🏫 {cls.room}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Today's schedule pill */}
          {firstToday ? (
            <View style={[styles.schedulePill, { backgroundColor: subjectColor + '18' }]}>
              <Text style={[styles.schedulePillText, { color: subjectColor }]}>
                🕐 Aujourd'hui{' '}
                {firstToday.startTime} – {firstToday.endTime}
                {' · '}Salle {firstToday.room}
              </Text>
            </View>
          ) : (
            <Text style={styles.noClassToday}>Pas de cours aujourd'hui</Text>
          )}
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Mes Classes"
        subtitle={`${classes.length} classe${classes.length > 1 ? 's' : ''} assignée${classes.length > 1 ? 's' : ''}`}
      />

      <FlatList
        data={classesWithIndex}
        keyExtractor={item => item.cls.id}
        renderItem={renderClass}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },

  list: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },

  cardWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },

  stripBar: {
    width: 4,
  },

  cardContent: {
    flex: 1,
    padding: 14,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },

  className: {
    fontSize: 16,
    fontFamily: Fonts.extraBold,
    color: Colors.gray900,
  },

  avgCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },

  avgValue: {
    fontSize: 14,
    fontFamily: Fonts.extraBold,
  },

  avgMax: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    marginLeft: 1,
  },

  subjectLabel: {
    fontSize: 13,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },

  metaRow: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginVertical: 10,
    marginHorizontal: 0,
  },

  schedulePill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  schedulePillText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },

  noClassToday: {
    fontSize: 12,
    color: Colors.gray300,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
  },

  chevron: {
    fontSize: 22,
    color: Colors.gray300,
    alignSelf: 'center',
    paddingRight: 14,
    lineHeight: 26,
  },
});
