import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../theme';
import useStore from '../../store/useStore';
import { ClassesStackParamList } from '../../navigation/AppNavigator';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Input from '../../components/ui/Input';
import FileTypeIcon from '../../components/ui/FileTypeIcon';
import { Resource } from '../../types';

type Route = RouteProp<ClassesStackParamList, 'AddResourceScreen'>;
type Nav   = StackNavigationProp<ClassesStackParamList>;

// ─── Constants ────────────────────────────────────────────────────────────────
type FileTypeOption = Resource['fileType'];

interface FileTypePill {
  type: FileTypeOption;
  label: string;
  emoji: string;
}

const FILE_TYPE_PILLS: FileTypePill[] = [
  { type: 'pdf',   label: 'PDF',   emoji: '📄' },
  { type: 'pptx',  label: 'PPT',   emoji: '📊' },
  { type: 'docx',  label: 'Word',  emoji: '📝' },
  { type: 'image', label: 'Image', emoji: '🖼️' },
  { type: 'video', label: 'Vidéo', emoji: '🎬' },
  { type: 'link',  label: 'Lien',  emoji: '🔗' },
];

interface PickedFile {
  name: string;
  uri: string;
  size: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddResourceScreen() {
  const navigation  = useNavigation<Nav>();
  const route       = useRoute<Route>();
  const { classId } = route.params;

  const classes     = useStore(s => s.classes);
  const addResource = useStore(s => s.addResource);

  const cls       = classes.find(c => c.id === classId);
  const className = cls?.name ?? '';
  const subject   = cls?.subject ?? '';

  // ── Form state ───────────────────────────────────────────────────────────────
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [chapter, setChapter]           = useState('');
  const [selectedType, setSelectedType] = useState<FileTypeOption>('pdf');
  const [pickedFile, setPickedFile]     = useState<PickedFile | null>(null);
  const [urlInput, setUrlInput]         = useState('');

  // ── Error state ──────────────────────────────────────────────────────────────
  const [titleError, setTitleError] = useState('');
  const [fileError, setFileError]   = useState('');

  const [submitting, setSubmitting] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const isUrlType = (t: FileTypeOption) => t === 'video' || t === 'link';

  const handleTypeChange = (t: FileTypeOption) => {
    setSelectedType(t);
    setPickedFile(null);
    setUrlInput('');
    setFileError('');
  };

  // ── File pickers ─────────────────────────────────────────────────────────────
  const pickDocument = async (type: FileTypeOption) => {
    let mimeType: string | string[] = 'application/pdf';
    if (type === 'pptx') mimeType = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (type === 'docx') mimeType = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: mimeType,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setPickedFile({
        name: file.name ?? 'fichier',
        uri:  file.uri,
        size: file.size ? `${(file.size / 1024).toFixed(0)} Ko` : '–',
      });
      setFileError('');
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ouvrir le fichier.");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPickedFile({
      name: asset.fileName ?? 'image.jpg',
      uri:  asset.uri,
      size: asset.fileSize ? `${(asset.fileSize / 1024).toFixed(0)} Ko` : '–',
    });
    setFileError('');
  };

  const handleUploadPress = () => {
    if (selectedType === 'image') {
      pickImage();
    } else {
      pickDocument(selectedType);
    }
  };

  // ── Validation & submit ──────────────────────────────────────────────────────
  const handleSubmit = () => {
    let valid = true;

    if (title.trim().length < 2) {
      setTitleError('Le titre est requis (min. 2 caractères).');
      valid = false;
    } else {
      setTitleError('');
    }

    if (isUrlType(selectedType)) {
      if (!urlInput.trim()) {
        setFileError('Veuillez saisir une URL valide.');
        valid = false;
      } else {
        setFileError('');
      }
    } else {
      if (!pickedFile) {
        setFileError('Veuillez choisir un fichier.');
        valid = false;
      } else {
        setFileError('');
      }
    }

    if (!valid) return;

    setSubmitting(true);

    const resource: Resource = {
      id:            Date.now().toString(),
      classId,
      className,
      subject,
      title:         title.trim(),
      description:   description.trim() || undefined,
      fileType:      selectedType,
      fileUrl:       isUrlType(selectedType) ? urlInput.trim() : (pickedFile?.uri ?? ''),
      fileSize:      isUrlType(selectedType) ? '–' : (pickedFile?.size ?? '–'),
      chapter:       chapter.trim() || undefined,
      uploadedAt:    new Date().toISOString(),
      downloadCount: 0,
    };

    addResource(resource);

    Toast.show({
      type:           'success',
      text1:          '📤 Ressource publiée !',
      text2:          'La ressource est disponible pour les élèves.',
      visibilityTime: 3000,
    });

    setSubmitting(false);
    navigation.goBack();
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Uploader une ressource"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Class info card ────────────────────────────────────── */}
          <View style={styles.classCard}>
            <View style={[styles.classCardAccent, { backgroundColor: Colors.primary }]} />
            <View style={styles.classCardBody}>
              <Text style={styles.classCardName}>{className}</Text>
              <Text style={styles.classCardSub}>{subject}</Text>
            </View>
            <View style={styles.classCardBadge}>
              <Text style={styles.classCardBadgeText}>
                {cls?.studentCount ?? 0} élèves
              </Text>
            </View>
          </View>

          {/* ── Titre ─────────────────────────────────────────────── */}
          <Input
            label="TITRE DE LA RESSOURCE *"
            placeholder="Ex: Cours Chapitre 3 — Équations"
            value={title}
            onChangeText={t => { setTitle(t); if (titleError) setTitleError(''); }}
            error={titleError}
          />

          {/* ── Description ───────────────────────────────────────── */}
          <Input
            label="DESCRIPTION (optionnel)"
            placeholder="Brève description du contenu..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* ── Chapitre ──────────────────────────────────────────── */}
          <Input
            label="CHAPITRE / UNITÉ"
            placeholder="Ex: Chapitre 3"
            value={chapter}
            onChangeText={setChapter}
          />

          {/* ── Type de fichier ───────────────────────────────────── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>TYPE DE FICHIER *</Text>
            <View style={styles.pillsRow}>
              {FILE_TYPE_PILLS.map(pill => {
                const active = selectedType === pill.type;
                return (
                  <TouchableOpacity
                    key={pill.type}
                    activeOpacity={0.7}
                    onPress={() => handleTypeChange(pill.type)}
                    style={[
                      styles.pill,
                      active ? styles.pillActive : styles.pillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        active ? styles.pillTextActive : styles.pillTextInactive,
                      ]}
                    >
                      {pill.emoji} {pill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Fichier / URL ─────────────────────────────────────── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>
              {isUrlType(selectedType) ? 'URL *' : 'FICHIER *'}
            </Text>

            {isUrlType(selectedType) ? (
              /* URL input */
              <Input
                label=""
                placeholder={
                  selectedType === 'video'
                    ? 'https://youtube.com/...'
                    : 'https://...'
                }
                value={urlInput}
                onChangeText={t => { setUrlInput(t); if (fileError) setFileError(''); }}
                error={fileError}
                autoCapitalize="none"
                keyboardType="url"
              />
            ) : (
              /* Upload area */
              <>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleUploadPress}
                  style={[
                    styles.uploadArea,
                    !!fileError && styles.uploadAreaError,
                  ]}
                >
                  {pickedFile ? (
                    /* File selected */
                    <View style={styles.pickedFileRow}>
                      <View style={styles.pickedFileIcon}>
                        <FileTypeIcon fileType={selectedType} size={28} />
                      </View>
                      <View style={styles.pickedFileMeta}>
                        <Text style={styles.pickedFileName} numberOfLines={1}>
                          {pickedFile.name}
                        </Text>
                        <Text style={styles.pickedFileSize}>{pickedFile.size}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setPickedFile(null)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.pickedFileRemove}
                      >
                        <Text style={styles.pickedFileRemoveIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Empty state */
                    <View style={styles.uploadEmptyState}>
                      <Text style={styles.uploadEmptyIcon}>
                        {FILE_TYPE_PILLS.find(p => p.type === selectedType)?.emoji ?? '📎'}
                      </Text>
                      <Text style={styles.uploadEmptyText}>
                        Appuyer pour choisir un fichier
                      </Text>
                      <Text style={styles.uploadEmptyHint}>
                        {selectedType === 'image'
                          ? 'JPG, PNG, WEBP'
                          : selectedType === 'pdf'
                          ? 'Format PDF'
                          : selectedType === 'pptx'
                          ? 'PowerPoint (.pptx, .ppt)'
                          : 'Word (.docx, .doc)'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {!!fileError && (
                  <Text style={styles.fieldError}>{fileError}</Text>
                )}
              </>
            )}
          </View>

          {/* Spacer for fixed submit bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Fixed submit button ──────────────────────────────────────── */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Publication...' : '📤 Publier la ressource'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // Class card
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  classCardAccent: {
    width: 5,
    alignSelf: 'stretch',
  },
  classCardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  classCardName: {
    fontSize: 16,
    fontFamily: Fonts.extraBold,
    color: Colors.text,
  },
  classCardSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
  classCardBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: Spacing.md,
  },
  classCardBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },

  // Section blocks
  sectionBlock: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.textLight,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  // File type pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginBottom: 4,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillInactive: {
    backgroundColor: Colors.gray100,
  },
  pillText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  pillTextActive: {
    color: Colors.white,
  },
  pillTextInactive: {
    color: Colors.gray700,
  },

  // Upload area
  uploadArea: {
    minHeight: 110,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.gray300,
    borderRadius: Radius.lg,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  uploadAreaError: {
    borderColor: Colors.danger,
  },
  uploadEmptyState: {
    alignItems: 'center',
    gap: 4,
  },
  uploadEmptyIcon: {
    fontSize: 30,
    marginBottom: 4,
  },
  uploadEmptyText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.textLight,
  },
  uploadEmptyHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.gray500,
  },
  pickedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.sm,
  },
  pickedFileIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.card,
  },
  pickedFileMeta: {
    flex: 1,
  },
  pickedFileName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  pickedFileSize: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
  pickedFileRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickedFileRemoveIcon: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: Fonts.bold,
  },

  // Standalone field error (below upload area)
  fieldError: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 2,
  },

  // Submit bar
  submitBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    ...Shadow.card,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
});
