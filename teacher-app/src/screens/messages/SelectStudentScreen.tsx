import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, Radius, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { MessagesStackParamList } from '../../navigation';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Avatar from '../../components/ui/Avatar';
import { Student } from '../../types';

type Nav = NativeStackNavigationProp<MessagesStackParamList>;

interface Section {
  className: string;
  data: Student[];
}

export default function SelectStudentScreen() {
  const navigation   = useNavigation<Nav>();
  const students     = useStore(s => s.students);
  const chatRooms    = useStore(s => s.chatRooms);
  const createChatRoom = useStore(s => s.createChatRoom);

  const [search, setSearch] = useState('');

  // Build grouped sections filtered by search
  const sections: Section[] = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? students.filter(s =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
          s.className.toLowerCase().includes(query)
        )
      : students;

    const map = new Map<string, Student[]>();
    filtered.forEach(s => {
      if (!map.has(s.className)) map.set(s.className, []);
      map.get(s.className)!.push(s);
    });
    return Array.from(map.entries()).map(([className, data]) => ({ className, data }));
  }, [students, search]);

  // Tap a student → reuse or create a TEACHER_PARENT chat room
  const handleSelect = (student: Student) => {
    const existing = chatRooms.find(
      r => r.relatedStudentId === student.id && r.type === 'TEACHER_PARENT',
    );
    if (existing) {
      navigation.navigate('ChatScreen', { roomId: existing.id });
      return;
    }
    // createChatRoom is synchronous (Zustand set is sync)
    createChatRoom(student.id, 'TEACHER_PARENT');
    const newRoom = useStore.getState().chatRooms.find(
      r => r.relatedStudentId === student.id && r.type === 'TEACHER_PARENT',
    );
    if (newRoom) {
      navigation.navigate('ChatScreen', { roomId: newRoom.id });
    }
  };

  // ── Renders ──────────────────────────────────────────────────────────────
  const renderStudentRow = ({ item, index }: { item: Student; index: number }) => (
    <TouchableOpacity
      style={styles.studentRow}
      activeOpacity={0.75}
      onPress={() => handleSelect(item)}
    >
      <Avatar name={`${item.firstName} ${item.lastName}`} size={44} colorIndex={index} />

      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.studentMeta}>{item.className}  ·  Parent : {item.parentName}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.className}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Nouveau message"
        subtitle="Choisir un élève"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un élève..."
            placeholderTextColor={Colors.gray300}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Grouped list */}
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Aucun élève trouvé</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderStudentRow}
          renderSectionHeader={renderSectionHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.pageBg },

  // Search
  searchWrap: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    gap: 8,
    height: 42,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray900,
  },

  // Section header
  sectionHeader: {
    backgroundColor: Colors.pageBg,
    paddingHorizontal: Spacing.xl,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Student row
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 12,
  },
  studentInfo: { flex: 1 },
  studentName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    marginBottom: 3,
  },
  studentMeta: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  chevron: {
    fontSize: 20,
    color: Colors.gray300,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    fontSize: 14,
    color: Colors.gray500,
    fontFamily: Fonts.medium,
  },
});
