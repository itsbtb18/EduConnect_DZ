import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, Radius, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { MessagesStackParamList } from '../../navigation';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import { ChatRoom, ChatRoomType } from '../../types';

type Nav = NativeStackNavigationProp<MessagesStackParamList>;

const TABS: Array<{ label: string; filter: ChatRoomType | 'all' }> = [
  { label: 'Tous',    filter: 'all'             },
  { label: 'Parents', filter: 'TEACHER_PARENT'  },
  { label: 'Élèves',  filter: 'TEACHER_STUDENT' },
];

export default function MessageListScreen() {
  const navigation  = useNavigation<Nav>();
  const chatRooms   = useStore(s => s.chatRooms);
  const [activeTab, setActiveTab] = useState<ChatRoomType | 'all'>('all');

  const filtered = useMemo(
    () => activeTab === 'all' ? chatRooms : chatRooms.filter(r => r.type === activeTab),
    [chatRooms, activeTab],
  );

  // ── Row ─────────────────────────────────────────────────────────────────────
  const renderRoom = ({ item: room, index }: { item: ChatRoom; index: number }) => (
      <TouchableOpacity
        style={styles.roomRow}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('ChatScreen', { roomId: room.id })}
        onLongPress={() =>
          Alert.alert('Archiver', 'Archiver cette conversation ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Archiver', style: 'destructive', onPress: () => {} },
          ])
        }
      >
        {/* Avatar + online dot */}
        <View style={styles.avatarWrap}>
          <Avatar name={room.participantName} size={48} colorIndex={index} />
          {room.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.roomBody}>
          <View style={styles.roomTopRow}>
            <Text style={styles.roomName} numberOfLines={1}>{room.participantName}</Text>
            <Text style={styles.roomTime}>{room.lastTime}</Text>
          </View>

          {/* Student badge */}
          <View style={styles.studentBadgeWrap}>
            <Text style={styles.studentBadge}>Re: {room.relatedStudentName}</Text>
          </View>

          <Text style={styles.roomLast} numberOfLines={1}>{room.lastMessage || 'Aucun message'}</Text>
        </View>

        {/* Unread badge */}
        {room.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{room.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Messages"
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('SelectStudentScreen')}
            style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
          >
            <Text style={{ fontSize: 14, color: '#fff', fontFamily: Fonts.semiBold }}>
              + Nouveau
            </Text>
          </TouchableOpacity>
        }
      />

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.label}
            style={[styles.tab, activeTab === tab.filter && styles.tabActive]}
            onPress={() => setActiveTab(tab.filter)}
          >
            <Text style={[styles.tabText, activeTab === tab.filter && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>Aucune conversation</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          renderItem={renderRoom}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray500,
  },
  tabTextActive: {
    color: Colors.primary,
  },

  // Room row
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
    backgroundColor: Colors.white,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  roomBody: {
    flex: 1,
    gap: 3,
  },
  roomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    flex: 1,
  },
  roomTime: {
    fontSize: 11,
    color: Colors.gray300,
    fontFamily: Fonts.regular,
    marginLeft: 8,
    flexShrink: 0,
  },
  studentBadgeWrap: {
    alignSelf: 'flex-start',
  },
  studentBadge: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  roomLast: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // Swipe action
  archiveAction: {
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
  },
  archiveText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 14,
    color: Colors.gray500,
    fontFamily: Fonts.medium,
  },
});
