import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { MessagesStackParamList } from '../../navigation';
import Avatar from '../../components/ui/Avatar';
import FileTypeIcon from '../../components/ui/FileTypeIcon';
import { ChatMessage } from '../../types';
import { messageTemplates } from '../../data/mockData';

type Route = RouteProp<MessagesStackParamList, 'ChatScreen'>;
type Nav   = NativeStackNavigationProp<MessagesStackParamList>;

// ─── Date helpers ─────────────────────────────────────────────────────────────
function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' });
}

function getMsgDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-DZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TEMPLATE_ICONS: Record<string, string> = {
  academic_concern: '📚',
  positive:        '⭐',
  absence:         '📅',
  behavior:        '⚠️',
  meeting:         '🤝',
};

type ListItem =
  | { kind: 'separator'; label: string; key: string }
  | { kind: 'message'; data: ChatMessage };

// ──────────────────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const navigation     = useNavigation<Nav>();
  const route          = useRoute<Route>();
  const insets         = useSafeAreaInsets();
  const { roomId }     = route.params;

  const chatRooms      = useStore(s => s.chatRooms);
  const sendMessage    = useStore(s => s.sendMessage);
  const markRoomAsRead = useStore(s => s.markRoomAsRead);
  const teacher        = useStore(s => s.teacher);

  const room = chatRooms.find(r => r.id === roomId);

  const [inputText,       setInputText]       = useState('');
  const [showTemplates,   setShowTemplates]   = useState(false);

  const listRef = useRef<FlatList<ListItem>>(null);

  // Mark as read on mount
  useEffect(() => {
    markRoomAsRead(roomId);
  }, [roomId]);

  // Scroll to end whenever messages update
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 80);
  }, [room?.messages.length]);

  // Build list with date separators
  const listData = useMemo((): ListItem[] => {
    if (!room) return [];
    const result: ListItem[] = [];
    let lastLabel = '';
    room.messages.forEach(msg => {
      const label = getMsgDateLabel(msg.sentAt);
      if (label !== lastLabel) {
        result.push({ kind: 'separator', label, key: `sep_${msg.id}` });
        lastLabel = label;
      }
      result.push({ kind: 'message', data: msg });
    });
    return result;
  }, [room?.messages]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    sendMessage(roomId, text, 'text');
    setInputText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [inputText, roomId, sendMessage]);

  // ── Apply template ────────────────────────────────────────────────────────
  const applyTemplate = (body: string) => {
    let filled = body
      .replace(/{student_name}/g, room?.relatedStudentName ?? '')
      .replace(/{subject}/g,      teacher.subject            ?? '')
      .replace(/{average}/g,      '—')
      .replace(/{grade}/g,        '—')
      .replace(/{date}/g,         new Date().toLocaleDateString('fr-DZ'));
    setInputText(filled);
    setShowTemplates(false);
  };

  // ── Render message ────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'separator') {
      return (
        <View style={styles.dateSep}>
          <View style={styles.dateLine} />
          <Text style={styles.dateLabel}>{item.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const msg      = item.data;
    const isTeacher = msg.senderId === teacher.id;

    return (
      <View style={[styles.msgRow, isTeacher ? styles.msgRowRight : styles.msgRowLeft]}>
        {/* Avatar for other side */}
        {!isTeacher && (
          <Avatar name={msg.senderName} size={28} colorIndex={0} />
        )}

        <View style={{ maxWidth: '72%' }}>
          <View style={[
            styles.bubble,
            isTeacher ? styles.bubbleTeacher : styles.bubbleOther,
          ]}>
            {/* Attachment card */}
            {msg.attachment && (
              <View style={styles.attachCard}>
                <FileTypeIcon
                  fileType={msg.attachment.fileType === 'image' ? 'image' : msg.attachment.fileType}
                  size={18}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attachName, isTeacher && { color: Colors.white }]}
                    numberOfLines={1}>{msg.attachment.name}</Text>
                  <Text style={[styles.attachSize, isTeacher && { color: 'rgba(255,255,255,0.7)' }]}>
                    {msg.attachment.fileSize}
                  </Text>
                </View>
                <TouchableOpacity style={[
                  styles.downloadBtn,
                  isTeacher && { borderColor: 'rgba(255,255,255,0.6)' },
                ]}>
                  <Text style={[styles.downloadText, isTeacher && { color: Colors.white }]}>
                    Télécharger
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.msgText, isTeacher ? styles.msgTextTeacher : styles.msgTextOther]}>
              {msg.content}
            </Text>
          </View>

          <Text style={[styles.msgTime, isTeacher ? { textAlign: 'right' } : { textAlign: 'left' }]}>
            {formatMsgTime(msg.sentAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (!room) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Conversation introuvable</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Custom header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Avatar name={room.participantName} size={36} colorIndex={1} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{room.participantName}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              Re : {room.relatedStudentName}{room.isOnline ? '  🟢' : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.templateBtn} onPress={() => setShowTemplates(true)}>
          <Text style={styles.templateBtnText}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={item => item.kind === 'separator' ? item.key : item.data.id}
        renderItem={renderItem}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* ── Input area ────────────────────────────────────────────────── */}
      <View style={[styles.inputArea, { paddingBottom: 12 + insets.bottom }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Écrire un message..."
          placeholderTextColor={Colors.gray300}
          multiline
          maxHeight={100}
          returnKeyType="default"
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            !inputText.trim() && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* ════════════════════════════════════════════════════════════════
          TEMPLATE MODAL
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showTemplates}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un modèle</Text>
              <TouchableOpacity onPress={() => setShowTemplates(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={messageTemplates}
              keyExtractor={t => t.id}
              renderItem={({ item: tpl }) => (
                <TouchableOpacity
                  style={styles.tplRow}
                  onPress={() => applyTemplate(tpl.body)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.tplIcon}>{TEMPLATE_ICONS[tpl.category] ?? '💬'}</Text>
                  <View style={styles.tplBody}>
                    <Text style={styles.tplTitle}>{tpl.title}</Text>
                    <Text style={styles.tplPreview} numberOfLines={1}>
                      {tpl.body.substring(0, 55)}…
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },

  // Header
  header: {
    backgroundColor: Colors.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.white,
    lineHeight: 26,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  templateBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  templateBtnText: {
    fontSize: 18,
  },

  // Messages list
  msgList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 16,
    gap: 4,
  },
  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray300,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.gray500,
    paddingHorizontal: 8,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
    gap: 6,
  },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft:  { justifyContent: 'flex-start' },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleTeacher: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    ...Shadow.card,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 21,
  },
  msgTextTeacher: {
    color: Colors.white,
    fontFamily: Fonts.regular,
  },
  msgTextOther: {
    color: Colors.gray900,
    fontFamily: Fonts.regular,
  },
  msgTime: {
    fontSize: 10,
    color: Colors.gray300,
    fontFamily: Fonts.regular,
    marginTop: 3,
    paddingHorizontal: 2,
  },

  // Attachment inside bubble
  attachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  attachName: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
  },
  attachSize: {
    fontSize: 10,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
  downloadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  downloadText: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
  },

  // Input area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: 8,
  },
  attachBtn: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachIcon: {
    fontSize: 22,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray900,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.gray300,
  },
  sendIcon: {
    fontSize: 18,
    color: Colors.white,
  },

  // Template modal
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
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40, height: 4,
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
  tplRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 12,
  },
  tplIcon: { fontSize: 22, marginTop: 2 },
  tplBody: { flex: 1 },
  tplTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
    marginBottom: 3,
  },
  tplPreview: {
    fontSize: 12,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
  },
});
