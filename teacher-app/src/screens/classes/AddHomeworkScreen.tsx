import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { ClassesStackParamList } from '../../navigation';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Input from '../../components/ui/Input';
import FileTypeIcon from '../../components/ui/FileTypeIcon';
import { Attachment } from '../../types';

type Route = RouteProp<ClassesStackParamList, 'AddHomeworkScreen'>;
type Nav   = NativeStackNavigationProp<ClassesStackParamList>;

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const DAYS_HEADER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS_FR   = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const DAYS_FR_LONG = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

function formatDisplayDate(d: Date): string {
  return `${DAYS_FR_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

/** Returns grid of day numbers (0 = empty cell before month start) */
function buildCalendarGrid(year: number, month: number): (number | 0)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | 0)[] = Array(firstDay).fill(0);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  return grid;
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function isPast(year: number, month: number, day: number, today: Date) {
  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return d < t;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddHomeworkScreen() {
  const navigation  = useNavigation<Nav>();
  const route       = useRoute<Route>();
  const { classId, homeworkId } = route.params;
  const isEditMode = !!homeworkId;

  const classes        = useStore(s => s.classes);
  const homeworkPosts  = useStore(s => s.homeworkPosts);
  const addHomework    = useStore(s => s.addHomework);
  const updateHomework = useStore(s => s.updateHomework);

  // In edit mode, load existing homework for pre-fill
  const existingHw = isEditMode ? homeworkPosts.find(h => h.id === homeworkId) : undefined;

  const cls = classes.find(c => c.id === classId);
  const className = cls?.name ?? '';
  const subject   = cls?.subject ?? '';

  const today    = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  // ── Form state (pre-filled in edit mode) ────────────────────────────────────
  const [title, setTitle]             = useState(existingHw?.title ?? '');
  const [description, setDescription] = useState(existingHw?.description ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(
    existingHw ? new Date(existingHw.dueDate) : tomorrow,
  );
  const [attachments, setAttachments]   = useState<Attachment[]>(existingHw?.attachments ?? []);

  // ── Error state ──────────────────────────────────────────────────────────────
  const [titleError, setTitleError]   = useState('');
  const [dateError, setDateError]     = useState('');

  // ── Modal/overlay state ──────────────────────────────────────────────────────
  const [showDateModal, setShowDateModal]   = useState(false);
  const [calYear, setCalYear]               = useState(today.getFullYear());
  const [calMonth, setCalMonth]             = useState(today.getMonth());
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showLinkModal, setShowLinkModal]   = useState(false);
  const [linkUrl, setLinkUrl]               = useState('');
  const [submitting, setSubmitting]         = useState(false);

  const calendarGrid = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  // ── Calendar navigation ──────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const selectCalendarDay = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    setSelectedDate(d);
    setDateError('');
    setShowDateModal(false);
  };

  // ── Attachment actions ───────────────────────────────────────────────────────
  const pickDocument = async () => {
    setShowAttachModal(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const att: Attachment = {
        id: Date.now().toString(),
        name: file.name ?? 'document.pdf',
        fileType: 'pdf',
        fileSize: file.size ? `${(file.size / 1024).toFixed(0)} Ko` : '–',
        fileUrl: file.uri,
      };
      setAttachments(prev => [...prev, att]);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ouvrir le fichier.");
    }
  };

  const pickImage = async () => {
    setShowAttachModal(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const att: Attachment = {
      id: Date.now().toString(),
      name: asset.fileName ?? 'image.jpg',
      fileType: 'image',
      fileSize: asset.fileSize ? `${(asset.fileSize / 1024).toFixed(0)} Ko` : '–',
      fileUrl: asset.uri,
    };
    setAttachments(prev => [...prev, att]);
  };

  const openLinkModal = () => {
    setShowAttachModal(false);
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const confirmLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const att: Attachment = {
      id: Date.now().toString(),
      name: url,
      fileType: 'pdf', // placeholder; will display as link via FileTypeIcon via name
      fileSize: '–',
      fileUrl: url,
    };
    // Override fileType to 'image' so we can repurpose — actually let's just cast
    const linkAtt: Attachment & { fileType: any } = { ...att, fileType: 'link' as any };
    setAttachments(prev => [...prev, linkAtt]);
    setShowLinkModal(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // ── Validation & submit ──────────────────────────────────────────────────────
  const handleSubmit = () => {
    let valid = true;

    if (title.trim().length < 3) {
      setTitleError('Le titre doit comporter au moins 3 caractères.');
      valid = false;
    } else {
      setTitleError('');
    }

    const now = new Date(); now.setHours(0, 0, 0, 0);
    const due = new Date(selectedDate); due.setHours(0, 0, 0, 0);
    if (due < now) {
      setDateError('La date limite doit être dans le futur.');
      valid = false;
    } else {
      setDateError('');
    }

    if (!valid) return;

    setSubmitting(true);

    if (isEditMode && homeworkId) {
      updateHomework(homeworkId, {
        title: title.trim(),
        description: description.trim(),
        dueDate: selectedDate.toISOString(),
        attachments,
      });
      Toast.show({
        type: 'success',
        text1: '💾 Modifications enregistrées',
        visibilityTime: 2500,
      });
    } else {
      addHomework({
        id: Date.now().toString(),
        classId,
        className,
        subject,
        title: title.trim(),
        description: description.trim(),
        dueDate: selectedDate.toISOString(),
        createdAt: new Date().toISOString(),
        attachments,
        viewCount: 0,
        isCorrected: false,
      });
      Toast.show({
        type: 'success',
        text1: 'Devoir publié !',
        text2: 'Le devoir a été ajouté avec succès.',
        visibilityTime: 2500,
      });
    }

    setSubmitting(false);
    navigation.goBack();
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isEditMode ? 'Modifier le devoir' : 'Nouveau Devoir'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Field 1: Read-only class ──────────────────────────────────────── */}
        <View style={styles.classBox}>
          <Text style={styles.classBoxText}>📚 {className} — {subject}</Text>
        </View>

        {/* ── Field 2: Title ───────────────────────────────────────────────── */}
        <Input
          label="TITRE DU DEVOIR *"
          placeholder="Ex: Exercices sur les équations..."
          value={title}
          onChangeText={t => { setTitle(t); if (titleError) setTitleError(''); }}
          error={titleError}
        />

        {/* ── Field 3: Description ─────────────────────────────────────────── */}
        <Input
          label="DESCRIPTION / CONSIGNES"
          placeholder="Décrivez le travail à réaliser..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
        />

        {/* ── Field 4: Due date ─────────────────────────────────────────────── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>DATE LIMITE *</Text>
          <TouchableOpacity
            style={[styles.dateButton, dateError ? styles.dateButtonError : undefined]}
            activeOpacity={0.8}
            onPress={() => setShowDateModal(true)}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
            <Text style={styles.dateChevron}>›</Text>
          </TouchableOpacity>
          {dateError ? <Text style={styles.fieldError}>{dateError}</Text> : null}
        </View>

        {/* ── Field 5: Attachments ─────────────────────────────────────────── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>PIÈCES JOINTES</Text>

          {attachments.map(att => (
            <View key={att.id} style={styles.attRow}>
              <FileTypeIcon fileType={(att as any).fileType ?? 'pdf'} size={20} />
              <View style={styles.attInfo}>
                <Text style={styles.attName} numberOfLines={1}>{att.name}</Text>
                <Text style={styles.attSize}>{att.fileSize}</Text>
              </View>
              <TouchableOpacity
                style={styles.attRemove}
                onPress={() => removeAttachment(att.id)}
              >
                <Text style={styles.attRemoveIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addAttBtn}
            activeOpacity={0.75}
            onPress={() => setShowAttachModal(true)}
          >
            <Text style={styles.addAttPlus}>＋</Text>
            <Text style={styles.addAttText}>Ajouter un fichier ou un lien</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Fixed submit button ───────────────────────────────────────────────── */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitLabel}>
            {isEditMode ? '💾 Enregistrer les modifications' : '📝  Publier le devoir'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          DATE PICKER MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir la date limite</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Month nav */}
            <View style={styles.calNavRow}>
              <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                <Text style={styles.calNavArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calMonthLabel}>
                {MONTHS_FR[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                <Text style={styles.calNavArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day-of-week headers */}
            <View style={styles.calDaysHeader}>
              {DAYS_HEADER.map(d => (
                <Text key={d} style={styles.calDayHeaderText}>{d}</Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.calGrid}>
              {calendarGrid.map((day, i) => {
                if (day === 0) {
                  return <View key={`e${i}`} style={styles.calCell} />;
                }
                const past      = isPast(calYear, calMonth, day, today);
                const selected  = isSameDay(new Date(calYear, calMonth, day), selectedDate);
                return (
                  <TouchableOpacity
                    key={`d${day}`}
                    style={[
                      styles.calCell,
                      selected && styles.calCellSelected,
                      past     && styles.calCellDisabled,
                    ]}
                    disabled={past}
                    onPress={() => selectCalendarDay(day)}
                  >
                    <Text style={[
                      styles.calDayText,
                      selected && styles.calDayTextSelected,
                      past     && styles.calDayTextDisabled,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          ATTACHMENT ACTION SHEET MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showAttachModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachModal(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.actionSheetTitle}>Ajouter une pièce jointe</Text>

            <TouchableOpacity style={styles.actionItem} onPress={pickDocument}>
              <Text style={styles.actionItemIcon}>📄</Text>
              <Text style={styles.actionItemLabel}>Choisir un PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={pickImage}>
              <Text style={styles.actionItemIcon}>🖼️</Text>
              <Text style={styles.actionItemLabel}>Choisir une image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={openLinkModal}>
              <Text style={styles.actionItemIcon}>🔗</Text>
              <Text style={styles.actionItemLabel}>Ajouter un lien</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.actionCancel]}
              onPress={() => setShowAttachModal(false)}
            >
              <Text style={styles.actionCancelLabel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          LINK INPUT MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.linkModalBox}>
            <Text style={styles.linkModalTitle}>🔗 Ajouter un lien</Text>
            <TextInput
              style={styles.linkInput}
              placeholder="https://..."
              placeholderTextColor={Colors.gray300}
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
            />
            <View style={styles.linkModalActions}>
              <TouchableOpacity
                style={styles.linkCancelBtn}
                onPress={() => setShowLinkModal(false)}
              >
                <Text style={styles.linkCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkConfirmBtn, !linkUrl.trim() && { opacity: 0.4 }]}
                onPress={confirmLink}
                disabled={!linkUrl.trim()}
              >
                <Text style={styles.linkConfirmText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },

  formContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
  },

  // Class box
  classBox: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.lg,
  },
  classBoxText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
  },

  // Field containers
  fieldWrap: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldError: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.danger,
    marginTop: 4,
  },

  // Date button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dateButtonError: {
    borderColor: Colors.danger,
  },
  dateIcon: {
    fontSize: 18,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray900,
  },
  dateChevron: {
    fontSize: 18,
    color: Colors.gray300,
  },

  // Attachments
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 10,
    marginBottom: 8,
    gap: 10,
    ...Shadow.card,
  },
  attInfo: {
    flex: 1,
  },
  attName: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.gray900,
  },
  attSize: {
    fontSize: 11,
    color: Colors.gray500,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  attRemove: {
    padding: 4,
  },
  attRemoveIcon: {
    fontSize: 14,
    color: Colors.gray500,
  },
  addAttBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    padding: 14,
    gap: 8,
    backgroundColor: Colors.primaryLight,
  },
  addAttPlus: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  addAttText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },

  // Submit bar
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    ...Shadow.strong,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // ── Shared modal styles ──
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
    paddingBottom: 36,
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

  // ── Calendar ──
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calNavBtn: {
    padding: 8,
  },
  calNavArrow: {
    fontSize: 22,
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  calMonthLabel: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
  },
  calDaysHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calDayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    marginVertical: 1,
  },
  calCellSelected: {
    backgroundColor: Colors.primary,
  },
  calCellDisabled: {
    opacity: 0.3,
  },
  calDayText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.gray900,
  },
  calDayTextSelected: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  calDayTextDisabled: {
    color: Colors.gray500,
  },

  // ── Action sheet ──
  actionSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray300,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 12,
  },
  actionItemIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  actionItemLabel: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.gray900,
  },
  actionCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 4,
  },
  actionCancelLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.danger,
  },

  // ── Link modal ──
  linkModalBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginHorizontal: 24,
    padding: Spacing.xl,
    alignSelf: 'stretch',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  linkModalTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.gray900,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  linkInput: {
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray900,
    marginBottom: Spacing.lg,
  },
  linkModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  linkCancelBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkCancelText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.gray700,
  },
  linkConfirmBtn: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkConfirmText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});
