/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  useSetupWizard — Central hook for the 9-step school setup wizard      ║
 * ║  Manages all state, validation, API sync, and persistence              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { message } from 'antd';
import type {
  WizardState,
  WizardStepKey,
  ProfileData,
  AcademicYearData,
  SectionConfig,
  LevelConfig,
  SubjectConfig,
  LevelSubjectConfig,
  TeacherEntry,
  StudentEntry,
  TrimesterConfig,
} from '../types/wizard';
import {
  LEVELS,
  LEVELS_BY_CYCLE,
  CYCLE_COLORS,
  SUBJECTS,
  getSubjectsForLevel,
  getDefaultTrimesters,
  ALL_STREAMS,
  type CycleType,
} from '../constants/algerian-curriculum';
import {
  useSchoolProfile,
  useCreateSection,
  useCreateAcademicYear,
  useCreateLevel,
  useCreateStream,
  useCreateClass,
  useCreateUser,
  useCompleteSetup,
  useUploadSchoolLogo,
  useBulkSyncSubjects,
  useBulkSetupTeachers,
} from './useApi';
import { schoolsAPI } from '../api/services';

// ─── Storage key ──────────────────────────────────────────────────────
const STORAGE_KEY = 'ilmi_setup_wizard_state';

function loadPersistedState(): Partial<WizardState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function persistState(state: WizardState) {
  try {
    // Don't persist File objects
    const toSave = {
      ...state,
      profile: { ...state.profile, logo: typeof state.profile.logo === 'string' ? state.profile.logo : null },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

// ─── Default State Builder ────────────────────────────────────────────
function buildDefaultSections(school: { has_primary: boolean; has_middle: boolean; has_high: boolean }): SectionConfig[] {
  const sections: SectionConfig[] = [];
  if (school.has_primary) sections.push({ type: 'PRIMARY', enabled: true, gradingMax: 10, passingGrade: 5 });
  if (school.has_middle)  sections.push({ type: 'MIDDLE',  enabled: true, gradingMax: 20, passingGrade: 10 });
  if (school.has_high)    sections.push({ type: 'HIGH',    enabled: true, gradingMax: 20, passingGrade: 10 });
  return sections;
}

function buildDefaultLevels(
  school: { has_primary: boolean; has_middle: boolean; has_high: boolean; available_streams?: string[] },
): LevelConfig[] {
  const result: LevelConfig[] = [];
  const enabledCycles: CycleType[] = [];
  if (school.has_primary) enabledCycles.push('PRIMARY');
  if (school.has_middle)  enabledCycles.push('MIDDLE');
  if (school.has_high)    enabledCycles.push('HIGH');

  for (const level of LEVELS) {
    if (!enabledCycles.includes(level.cycle)) continue;
    const enabledStreams: string[] = [];
    if (level.hasStreams && level.streamCodes) {
      for (const sc of level.streamCodes) {
        if (!school.available_streams || school.available_streams.includes(sc)) {
          enabledStreams.push(sc);
        }
      }
    }
    result.push({
      code: level.code,
      name: level.name,
      cycle: level.cycle,
      enabled: true,
      classCount: 1,
      classNames: {},
      streamClasses: enabledStreams.reduce((acc, s) => ({ ...acc, [s]: 1 }), {}),
      streamClassNames: {},
      enabledStreams,
      customStreams: [],
    });
  }
  return result;
}

function buildDefaultSubjects(levels: LevelConfig[]): LevelSubjectConfig[] {
  const result: LevelSubjectConfig[] = [];
  for (const level of levels) {
    if (!level.enabled) continue;
    if (level.enabledStreams.length > 0) {
      for (const sc of level.enabledStreams) {
        const assignments = getSubjectsForLevel(level.code, sc);
        result.push({
          levelCode: level.code,
          streamCode: sc,
          subjects: assignments.map(([code, coeff, mandatory]) => ({
            subjectCode: code,
            subjectName: SUBJECTS[code]?.name || code,
            arabicName: SUBJECTS[code]?.arabicName || '',
            coefficient: coeff,
            isMandatory: mandatory,
            color: SUBJECTS[code]?.color || '#666',
            isCustom: false,
          })),
        });
      }
    } else {
      const assignments = getSubjectsForLevel(level.code, null);
      result.push({
        levelCode: level.code,
        streamCode: null,
        subjects: assignments.map(([code, coeff, mandatory]) => ({
          subjectCode: code,
          subjectName: SUBJECTS[code]?.name || code,
          arabicName: SUBJECTS[code]?.arabicName || '',
          coefficient: coeff,
          isMandatory: mandatory,
          color: SUBJECTS[code]?.color || '#666',
          isCustom: false,
        })),
      });
    }
  }
  return result;
}

function createDefaultState(school: {
  has_primary: boolean;
  has_middle: boolean;
  has_high: boolean;
  available_streams?: string[];
  name?: string;
  address?: string;
  wilaya?: string;
  phone?: string;
  email?: string;
  website?: string;
  motto?: string;
  logo_url?: string;
}): WizardState {
  const currentYear = new Date().getFullYear();
  const startMonth = 9; // September
  const sections = buildDefaultSections(school);
  const levels = buildDefaultLevels(school);
  const subjects = buildDefaultSubjects(levels);

  return {
    currentStep: 0,
    levelsSubStep: 'select',
    profile: {
      name: school.name || '',
      address: school.address || '',
      wilaya: school.wilaya || '',
      phone: school.phone || '',
      email: school.email || '',
      website: school.website || '',
      motto: school.motto || '',
      logo: school.logo_url || null,
    },
    academic: {
      name: `${currentYear}/${currentYear + 1}`,
      startDate: `${currentYear}-0${startMonth}-01`,
      endDate: `${currentYear + 1}-06-30`,
      trimesters: getDefaultTrimesters(currentYear) as TrimesterConfig[],
    },
    sections,
    levels,
    subjects,
    teachers: [],
    students: [],
    savedEntities: {
      sectionIds: {},
      levelIds: {},
      streamIds: {},
      classIds: {},
      subjectIds: {},
      levelSubjectIds: [],
      teacherIds: [],
      studentIds: [],
    },
    dirty: {
      profile: false,
      academic: false,
      sections: false,
      levels: false,
      subjects: false,
      teachers: false,
      students: false,
      summary: false,
      finish: false,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
export function useSetupWizard() {
  const { data: schoolProfile, isLoading: loadingProfile } = useSchoolProfile();

  const school = useMemo(() => ({
    has_primary: schoolProfile?.has_primary ?? false,
    has_middle: schoolProfile?.has_middle ?? false,
    has_high: schoolProfile?.has_high ?? false,
    available_streams: schoolProfile?.available_streams as string[] | undefined,
    name: schoolProfile?.name || '',
    address: schoolProfile?.address || '',
    wilaya: schoolProfile?.wilaya || '',
    phone: schoolProfile?.phone || '',
    email: schoolProfile?.email || '',
    website: schoolProfile?.website || '',
    motto: schoolProfile?.motto || '',
    logo_url: schoolProfile?.logo_url || '',
  }), [schoolProfile]);

  // ── Mutations ────────────────────────────────────────────────────
  const createSection = useCreateSection();
  const createAcademicYear = useCreateAcademicYear();
  const createLevel = useCreateLevel();
  const createStream = useCreateStream();
  const createClass = useCreateClass();
  const bulkSyncSubjects = useBulkSyncSubjects();
  const bulkSetupTeachers = useBulkSetupTeachers();
  const createUser = useCreateUser();
  const completeSetup = useCompleteSetup();
  const uploadLogo = useUploadSchoolLogo();

  // ── State ────────────────────────────────────────────────────────
  const [state, setState] = useState<WizardState>(() => {
    const persisted = loadPersistedState();
    if (persisted && persisted.currentStep !== undefined) {
      return persisted as WizardState;
    }
    return createDefaultState(school);
  });

  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  // Re-initialize from school profile once loaded
  useEffect(() => {
    if (schoolProfile && !initialized.current) {
      initialized.current = true;
      const persisted = loadPersistedState();
      if (persisted && persisted.currentStep !== undefined) {
        // Merge school info into persisted state
        setState(prev => ({
          ...prev,
          ...persisted as WizardState,
        }));
      } else {
        setState(createDefaultState(school));
      }
    }
  }, [schoolProfile, school]);

  // Auto-persist on state change
  useEffect(() => {
    if (initialized.current) {
      persistState(state);
    }
  }, [state]);

  // ── Navigation ───────────────────────────────────────────────────
  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: Math.max(0, Math.min(8, step)) }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.min(8, prev.currentStep + 1) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  }, []);

  const setLevelsSubStep = useCallback((sub: 'select' | 'classes') => {
    setState(prev => ({ ...prev, levelsSubStep: sub }));
  }, []);

  // ── Data Setters ─────────────────────────────────────────────────
  const updateProfile = useCallback((data: Partial<ProfileData>) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, ...data },
      dirty: { ...prev.dirty, profile: true },
    }));
  }, []);

  const updateAcademic = useCallback((data: Partial<AcademicYearData>) => {
    setState(prev => ({
      ...prev,
      academic: { ...prev.academic, ...data },
      dirty: { ...prev.dirty, academic: true },
    }));
  }, []);

  const updateSections = useCallback((sections: SectionConfig[]) => {
    setState(prev => ({
      ...prev,
      sections,
      dirty: { ...prev.dirty, sections: true },
    }));
  }, []);

  const updateLevel = useCallback((code: string, data: Partial<LevelConfig>) => {
    setState(prev => {
      const levels = prev.levels.map(l =>
        l.code === code ? { ...l, ...data } : l,
      );
      // Rebuild subjects when level enablement or streams change
      const subjects = buildDefaultSubjects(levels);
      return {
        ...prev,
        levels,
        subjects,
        dirty: { ...prev.dirty, levels: true, subjects: true },
      };
    });
  }, []);

  const updateSubjects = useCallback((
    levelCode: string,
    streamCode: string | null,
    subjects: SubjectConfig[],
  ) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(ls =>
        ls.levelCode === levelCode && ls.streamCode === streamCode
          ? { ...ls, subjects }
          : ls,
      ),
      dirty: { ...prev.dirty, subjects: true },
    }));
  }, []);

  const resetSubjectsToMEN = useCallback((levelCode: string, streamCode: string | null) => {
    const assignments = getSubjectsForLevel(levelCode, streamCode);
    const subjects: SubjectConfig[] = assignments.map(([code, coeff, mandatory]) => ({
      subjectCode: code,
      subjectName: SUBJECTS[code]?.name || code,
      arabicName: SUBJECTS[code]?.arabicName || '',
      coefficient: coeff,
      isMandatory: mandatory,
      color: SUBJECTS[code]?.color || '#666',
      isCustom: false,
    }));
    updateSubjects(levelCode, streamCode, subjects);
  }, [updateSubjects]);

  const addTeacher = useCallback((teacher: TeacherEntry) => {
    setState(prev => ({
      ...prev,
      teachers: [...prev.teachers, teacher],
      dirty: { ...prev.dirty, teachers: true },
    }));
  }, []);

  const removeTeacher = useCallback((tempId: string) => {
    setState(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => t.tempId !== tempId),
      dirty: { ...prev.dirty, teachers: true },
    }));
  }, []);

  const updateTeacher = useCallback((tempId: string, data: Partial<TeacherEntry>) => {
    setState(prev => ({
      ...prev,
      teachers: prev.teachers.map(t => t.tempId === tempId ? { ...t, ...data } : t),
      dirty: { ...prev.dirty, teachers: true },
    }));
  }, []);

  const addStudent = useCallback((student: StudentEntry) => {
    setState(prev => ({
      ...prev,
      students: [...prev.students, student],
      dirty: { ...prev.dirty, students: true },
    }));
  }, []);

  const removeStudent = useCallback((tempId: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.filter(s => s.tempId !== tempId),
      dirty: { ...prev.dirty, students: true },
    }));
  }, []);

  // ── Validation ───────────────────────────────────────────────────
  const canGoNext = useMemo(() => {
    const s = state;
    switch (s.currentStep) {
      case 0: return !!(s.profile.name && s.profile.wilaya);
      case 1: return !!(s.academic.name && s.academic.startDate && s.academic.endDate);
      case 2: return s.sections.some(sec => sec.enabled);
      case 3: return s.levels.some(l => l.enabled);
      case 4: return s.subjects.length > 0;
      case 5: return true; // Teachers optional
      case 6: return true; // Students optional
      case 7: return true; // Summary — always can proceed to finish
      default: return true;
    }
  }, [state]);

  // ── Save Step to Backend ─────────────────────────────────────────
  const saveCurrentStep = useCallback(async () => {
    setSaving(true);
    try {
      const s = state;
      switch (s.currentStep) {
        case 0: {
          // Save profile
          const profileData: Record<string, unknown> = {
            name: s.profile.name,
            address: s.profile.address,
            wilaya: s.profile.wilaya,
            phone: s.profile.phone,
            email: s.profile.email,
            website: s.profile.website,
            motto: s.profile.motto,
          };
          await schoolsAPI.updateProfile(profileData);
          // Upload logo if File
          if (s.profile.logo instanceof File && schoolProfile?.id) {
            await uploadLogo.mutateAsync({ id: schoolProfile.id, file: s.profile.logo });
          }
          break;
        }
        case 1: {
          // Save academic year
          if (!s.savedEntities.academicYearId) {
            const res = await createAcademicYear.mutateAsync({
              name: s.academic.name,
              start_date: s.academic.startDate,
              end_date: s.academic.endDate,
              is_current: true,
            });
            const yearId = res?.data?.id;
            if (yearId) {
              setState(prev => ({
                ...prev,
                savedEntities: { ...prev.savedEntities, academicYearId: yearId },
              }));
            }
          }
          break;
        }
        case 2: {
          // Save sections — with idempotence (backend returns existing if duplicate)
          for (const sec of s.sections) {
            if (!sec.enabled) continue;
            if (s.savedEntities.sectionIds[sec.type]) continue;
            try {
              const res = await createSection.mutateAsync({
                section_type: sec.type,
              });
              // Backend returns 200 for existing or 201 for new — both have data
              const secId = res?.data?.id;
              if (secId) {
                setState(prev => ({
                  ...prev,
                  savedEntities: {
                    ...prev.savedEntities,
                    sectionIds: { ...prev.savedEntities.sectionIds, [sec.type]: secId },
                  },
                }));
              }
            } catch (err: unknown) {
              // Try to fetch existing sections if create fails
              console.error('Section create error for', sec.type, err);
              try {
                const listRes = await schoolsAPI.sections();
                const sections = listRes?.data?.results || listRes?.data || [];
                const existing = (sections as Array<{ id: string; section_type: string }>)
                  .find((s: { section_type: string }) => s.section_type === sec.type);
                if (existing) {
                  setState(prev => ({
                    ...prev,
                    savedEntities: {
                      ...prev.savedEntities,
                      sectionIds: { ...prev.savedEntities.sectionIds, [sec.type]: existing.id },
                    },
                  }));
                }
              } catch { /* fallback failed */ }
            }
          }
          break;
        }
        case 3: {
          // Save levels, streams (official + custom), classes (with custom names)
          const freshState = state;
          const academicYearId = freshState.savedEntities.academicYearId;
          for (const level of freshState.levels) {
            if (!level.enabled) continue;
            const sectionType = level.cycle;
            const currentState = state;
            const sectionId = currentState.savedEntities.sectionIds[sectionType];
            if (!sectionId) continue;

            // ── Create level ──
            const hasAnyStreams = level.enabledStreams.length > 0 || (level.customStreams || []).length > 0;
            let levelId = currentState.savedEntities.levelIds[level.code];
            if (!levelId) {
              const levelDef = LEVELS.find(l => l.code === level.code);
              try {
                const res = await createLevel.mutateAsync({
                  section: sectionId,
                  name: level.name,
                  code: level.code,
                  order: levelDef?.order ?? 0,
                  max_grade: levelDef?.maxGrade ?? 20,
                  passing_grade: levelDef?.passingGrade ?? 10,
                  has_streams: hasAnyStreams,
                });
                levelId = res?.data?.id;
                if (levelId) {
                  setState(prev => ({
                    ...prev,
                    savedEntities: {
                      ...prev.savedEntities,
                      levelIds: { ...prev.savedEntities.levelIds, [level.code]: levelId as string },
                    },
                  }));
                }
              } catch {
                // Level might already exist
              }
            }
            if (!levelId) continue;

            // Helper to create classes for a stream (or no stream)
            const createClassesForStream = async (
              streamId: string | null,
              classCount: number,
              namePrefix: string,
              classNamesMap: Record<string, string>,
            ) => {
              for (let i = 1; i <= classCount; i++) {
                const defaultName = `${namePrefix}-${i}`;
                const actualName = classNamesMap[defaultName] || defaultName;
                const classKey = defaultName; // use default as key for idempotency
                if (!currentState.savedEntities.classIds[classKey]) {
                  try {
                    const classData: Record<string, unknown> = {
                      name: actualName,
                      level: levelId,
                      section: sectionId,
                      capacity: 30,
                    };
                    if (streamId) classData.stream = streamId;
                    if (academicYearId) classData.academic_year = academicYearId;
                    const res = await createClass.mutateAsync(classData);
                    const classId = res?.data?.id;
                    if (classId) {
                      setState(prev => ({
                        ...prev,
                        savedEntities: {
                          ...prev.savedEntities,
                          classIds: { ...prev.savedEntities.classIds, [classKey]: classId },
                        },
                      }));
                    }
                  } catch (err) {
                    console.error('Class create error:', actualName, err);
                  }
                }
              }
            };

            // ── Official MEN streams ──
            if (level.enabledStreams.length > 0) {
              for (const sc of level.enabledStreams) {
                const streamKey = `${level.code}_${sc}`;
                let streamId = currentState.savedEntities.streamIds[streamKey];
                if (!streamId) {
                  const streamDef = ALL_STREAMS.find(s => s.code === sc);
                  try {
                    const res = await createStream.mutateAsync({
                      level: levelId,
                      name: streamDef?.name || sc,
                      code: sc,
                      short_name: streamDef?.shortName || sc,
                      is_tronc_commun: streamDef?.isTroncCommun ?? false,
                      is_custom: false,
                      color: streamDef?.color || '#3b82f6',
                      order: ALL_STREAMS.indexOf(streamDef!) + 1,
                    });
                    streamId = res?.data?.id;
                    if (streamId) {
                      setState(prev => ({
                        ...prev,
                        savedEntities: {
                          ...prev.savedEntities,
                          streamIds: { ...prev.savedEntities.streamIds, [streamKey]: streamId as string },
                        },
                      }));
                    }
                  } catch {
                    // Stream might already exist
                  }
                }
                if (streamId) {
                  const classCount = level.streamClasses[sc] || 1;
                  const namePrefix = `${level.code}-${sc.replace('TC_', '')}`;
                  await createClassesForStream(streamId, classCount, namePrefix, level.streamClassNames || {});
                }
              }
            }

            // ── Custom streams ──
            for (const cs of (level.customStreams || [])) {
              const streamKey = `${level.code}_${cs.code}`;
              let streamId = currentState.savedEntities.streamIds[streamKey];
              if (!streamId) {
                try {
                  const res = await createStream.mutateAsync({
                    level: levelId,
                    name: cs.name,
                    code: cs.code,
                    short_name: cs.name.slice(0, 30),
                    is_tronc_commun: false,
                    is_custom: true,
                    color: cs.color,
                    order: 100 + (level.customStreams || []).indexOf(cs),
                  });
                  streamId = res?.data?.id;
                  if (streamId) {
                    setState(prev => ({
                      ...prev,
                      savedEntities: {
                        ...prev.savedEntities,
                        streamIds: { ...prev.savedEntities.streamIds, [streamKey]: streamId as string },
                      },
                    }));
                  }
                } catch {
                  // Custom stream might already exist
                }
              }
              if (streamId) {
                const namePrefix = `${level.code}-${cs.code}`;
                await createClassesForStream(streamId, cs.classCount, namePrefix, level.streamClassNames || {});
              }
            }

            // ── No streams at all — create classes directly ──
            if (!hasAnyStreams) {
              await createClassesForStream(null, level.classCount, level.code, level.classNames || {});
            }
          }
          break;
        }
        case 4: {
          // ── Batch save: subjects + level-subject configs in ONE request ──
          const currentState = state;

          // 1. Collect unique subjects (deduplicate by code)
          const subjectMap = new Map<string, Record<string, unknown>>();
          for (const lsc of currentState.subjects) {
            for (const sub of lsc.subjects) {
              if (!subjectMap.has(sub.subjectCode)) {
                subjectMap.set(sub.subjectCode, {
                  name: sub.subjectName,
                  arabic_name: sub.arabicName || '',
                  code: sub.subjectCode,
                  color: sub.color || '#2196F3',
                  is_custom: sub.isCustom ?? false,
                });
              }
            }
          }

          // 2. Collect level-subject assignments
          const levelSubjects: Record<string, unknown>[] = [];
          for (const lsc of currentState.subjects) {
            const levelId = currentState.savedEntities.levelIds[lsc.levelCode];
            if (!levelId) continue;
            const streamKey = lsc.streamCode ? `${lsc.levelCode}_${lsc.streamCode}` : null;
            const streamId = streamKey ? currentState.savedEntities.streamIds[streamKey] : null;
            for (const sub of lsc.subjects) {
              levelSubjects.push({
                level: levelId,
                stream: streamId || null,
                subject_code: sub.subjectCode,
                coefficient: sub.coefficient,
                is_mandatory: sub.isMandatory,
              });
            }
          }

          // 3. Single API call
          try {
            const res = await bulkSyncSubjects.mutateAsync({
              subjects: Array.from(subjectMap.values()),
              level_subjects: levelSubjects,
            });
            const result = res?.data;
            message.success(
              `Matières synchronisées : ${(result?.created_subjects ?? 0) + (result?.updated_subjects ?? 0)} matières, ` +
              `${(result?.created_level_subjects ?? 0) + (result?.updated_level_subjects ?? 0)} configurations`,
            );
          } catch (err) {
            console.error('Bulk subject sync error:', err);
            message.error('Erreur lors de la synchronisation des matières');
          }
          break;
        }
        case 5: {
          // Bulk-setup teachers with sections, subjects, and class assignments
          const currentState = state;
          const unsaved = currentState.teachers.filter(
            t => !currentState.savedEntities.teacherIds.includes(t.tempId),
          );
          if (unsaved.length === 0) break;

          // Map class assignment keys to actual saved class names
          const classIdMap = currentState.savedEntities.classIds;

          const payload = unsaved.map(t => {
            // Resolve class names: the key might be the default name (e.g. "1AM-1")
            // and the actual class was saved with a potentially custom name
            const classNames: string[] = (t.classAssignments || []).map(key => {
              // Try to find in levels what the actual name is
              for (const lvl of currentState.levels) {
                if (!lvl.enabled) continue;
                // Check classNames map
                if (lvl.classNames?.[key]) return lvl.classNames[key];
                if (lvl.streamClassNames?.[key]) return lvl.streamClassNames[key];
              }
              return key; // fallback to the key itself
            });

            return {
              first_name: t.firstName,
              last_name: t.lastName,
              phone_number: t.phone,
              email: t.email || '',
              password: t.password || `ILMI_${t.phone.slice(-4)}`,
              section_types: t.sectionTypes || [],
              subject_codes: t.subjectCodes || [],
              class_names: classNames,
            };
          });

          try {
            const res = await bulkSetupTeachers.mutateAsync({ teachers: payload });
            const result = res?.data || res;
            const createdCount = result?.created || 0;
            // Mark all as saved (even skipped — they exist already)
            setState(prev => ({
              ...prev,
              savedEntities: {
                ...prev.savedEntities,
                teacherIds: [
                  ...prev.savedEntities.teacherIds,
                  ...unsaved.map(t => t.tempId),
                ],
              },
            }));
            if (createdCount > 0) {
              message.success(`${createdCount} enseignant(s) créé(s)`);
            }
            if (result?.errors?.length > 0) {
              for (const err of result.errors) {
                message.warning(err);
              }
            }
          } catch (err) {
            console.error('Teacher bulk setup error:', err);
            message.error('Erreur lors de la création des enseignants');
          }
          break;
        }
        case 6: {
          // Save students as users
          const currentState = state;
          for (const student of currentState.students) {
            if (currentState.savedEntities.studentIds.includes(student.tempId)) continue;
            try {
              await createUser.mutateAsync({
                first_name: student.firstName,
                last_name: student.lastName,
                phone_number: student.phone,
                role: 'STUDENT',
                password: `ILMI_${student.phone.slice(-4)}`,
              });
              setState(prev => ({
                ...prev,
                savedEntities: {
                  ...prev.savedEntities,
                  studentIds: [...prev.savedEntities.studentIds, student.tempId],
                },
              }));
            } catch { /* student might already exist */ }
          }
          break;
        }
        default:
          break;
      }
      message.success('Sauvegardé avec succès');
    } catch (err) {
      console.error('Save error:', err);
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [state, schoolProfile, createSection, createAcademicYear, createLevel, createStream, createClass, bulkSyncSubjects, bulkSetupTeachers, createUser, uploadLogo]);

  const handleCompleteSetup = useCallback(async () => {
    setSaving(true);
    try {
      await completeSetup.mutateAsync();
      localStorage.removeItem(STORAGE_KEY);
      message.success('Configuration terminée ! Bienvenue sur ILMI');
    } catch {
      message.error('Erreur lors de la finalisation');
    } finally {
      setSaving(false);
    }
  }, [completeSetup]);

  // ── Summary stats ────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const enabledLevels = state.levels.filter(l => l.enabled);
    const totalClasses = enabledLevels.reduce((sum, l) => {
      if (l.enabledStreams.length > 0) {
        return sum + l.enabledStreams.reduce((s, sc) => s + (l.streamClasses[sc] || 0), 0);
      }
      return sum + l.classCount;
    }, 0);
    const totalSubjects = new Set(
      state.subjects.flatMap(ls => ls.subjects.map(s => s.subjectCode)),
    ).size;
    return {
      sections: state.sections.filter(s => s.enabled).length,
      levels: enabledLevels.length,
      classes: totalClasses,
      subjects: totalSubjects,
      teachers: state.teachers.length,
      students: state.students.length,
    };
  }, [state]);

  return {
    state,
    school: {
      has_primary: school.has_primary,
      has_middle: school.has_middle,
      has_high: school.has_high,
      available_streams: school.available_streams,
    },
    loading: loadingProfile,
    saving,
    canGoNext,
    summaryStats,
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    setLevelsSubStep,
    // Data setters
    updateProfile,
    updateAcademic,
    updateSections,
    updateLevel,
    updateSubjects,
    resetSubjectsToMEN,
    addTeacher,
    updateTeacher,
    removeTeacher,
    addStudent,
    removeStudent,
    // Persistence
    saveCurrentStep,
    completeSetup: handleCompleteSetup,
  };
}
