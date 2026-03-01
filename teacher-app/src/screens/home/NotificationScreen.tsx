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
import { Colors, Fonts, Radius, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { HomeStackParamList } from '../../navigation';
import ScreenHeader from '../../components/ui/ScreenHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Notification } from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  Notification['type'],
  { icon: string; bg: string }
> = {
  grade_returned:    { icon: '📊', bg: '#FFF0E0' },
  new_message:       { icon: '💬', bg: '#E0EEFF' },
  absence_justified: { icon: '✅', bg: '#E0FAF0' },
  announcement:      { icon: '📢', bg: '#F0E0FF' },
  reminder:          { icon: '⏰', bg: '#FFFBE0' },
};

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "À l'instant";
  if (mins  < 60) return `il y a ${mins}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days  <  7) return `il y a ${days}j`;
  return new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit' });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NotificationScreen() {
  const navigation             = useNavigation<Nav>();
  const notifications          = useStore(s => s.notifications);
  const unreadCount            = useStore(s => s.unreadNotificationCount);
  const markNotificationRead   = useStore(s => s.markNotificationRead);
  const markAllNotificationsRead = useStore(s => s.markAllNotificationsRead);

  // Sort by createdAt desc
  const sorted = useMemo(
    () => [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    [notifications],
  );

  const headerTitle = unreadCount > 0
    ? `Notifications (${unreadCount})`
    : 'Notifications';

  const renderItem = ({ item }: { item: Notification }) => {
    const cfg = TYPE_CONFIG[item.type];
    return (
      <TouchableOpacity
        style={[styles.row, !item.isRead && styles.rowUnread]}
        activeOpacity={0.75}
        onPress={() => markNotificationRead(item.id)}
      >
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
          <Text style={styles.iconText}>{cfg.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[styles.title, !item.isRead && styles.titleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
        </View>

        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={headerTitle}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllNotificationsRead} style={styles.readAllBtn}>
              <Text style={styles.readAllText}>Tout lire</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Aucune notification"
          subtitle="Vous êtes à jour !"
        />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={n => n.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
    backgroundColor: Colors.white,
    gap: 12,
  },
  rowUnread: {
    backgroundColor: '#F0F4FF',
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
    lineHeight: 22,
  },

  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
  },
  titleUnread: {
    fontFamily: Fonts.bold,
  },
  body: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.gray500,
    lineHeight: 17,
  },
  time: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.gray300,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },

  readAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  readAllText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});
