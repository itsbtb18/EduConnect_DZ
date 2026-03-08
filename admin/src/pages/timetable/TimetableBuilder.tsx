import React, { useState, useMemo, useCallback, DragEvent } from 'react';
import {
  Button, Select, Modal, Form, Tooltip, Spin, message, Popconfirm, Input, Switch,
} from 'antd';
import {
  CalendarOutlined, CheckCircleOutlined, SendOutlined, FilePdfOutlined,
  DeleteOutlined, EditOutlined, ExclamationCircleOutlined, ReloadOutlined,
  DownloadOutlined, EyeOutlined, PlusOutlined, WarningOutlined,
  AppstoreOutlined, UnorderedListOutlined, TeamOutlined,
} from '@ant-design/icons';
import {
  useClasses, useSubjects, useTeachers, useTimeSlots, useRooms,
  useScheduleSlots, useCreateScheduleSlot, useUpdateScheduleSlot, useDeleteScheduleSlot,
  useCheckConflicts, usePublishSchedule, useUnpublishSchedule,
  useValidateTimetable, useExportClassPdf, useExportTeacherPdf,
  useSeedDefaultTimeSlots, useClassSchedule, useTeacherSchedule, useRoomSchedule,
} from '../../hooks/useApi';
import type { Subject, TimeSlotConfig, ScheduleSlot, SchoolRoom, TeacherProfile, ClassInfo } from '../../types';
import './TimetableBuilder.css';

/* ─── Constants ──────────────────────────────────────────────────── */
const DAYS = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
];

const DAY_SHORT: Record<number, string> = {
  0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu',
};

const DEFAULT_COLORS: Record<string, string> = {
  'Mathématiques': '#3B82F6', 'Physique': '#8B5CF6', 'Sciences': '#10B981',
  'Arabe': '#F59E0B', 'Français': '#EF4444', 'Anglais': '#EC4899',
  'Histoire': '#6366F1', 'Géographie': '#14B8A6', 'Islamique': '#059669',
  'Sport': '#F97316', 'Dessin': '#A855F7', 'Musique': '#D946EF',
  'Informatique': '#0EA5E9', 'Technologie': '#64748B',
};

function getSubjectColor(subj: Subject): string {
  return subj.color || DEFAULT_COLORS[subj.name] || '#64748B';
}

function contrastText(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1E293B' : '#FFFFFF';
}

type ViewTab = 'builder' | 'class-view' | 'teacher-view' | 'room-view';

/* ═══════════════════════════════════════════════════════════════════ */
const TimetableBuilder: React.FC = () => {
  /* ── State ─────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<ViewTab>('builder');
  const [selectedClass, setSelectedClass] = useState<string | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>();
  const [dragData, setDragData] = useState<{ subjectId: string; subjectName: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: number; slotId: string } | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<ScheduleSlot | null>(null);
  const [pendingCell, setPendingCell] = useState<{ day: number; slot: TimeSlotConfig } | null>(null);
  const [form] = Form.useForm();

  /* ── Queries ───────────────────────────────────────────────────── */
  const { data: classesRaw } = useClasses();
  const { data: subjectsRaw } = useSubjects();
  const { data: teachersRaw } = useTeachers();
  const { data: timeSlotsRaw, isLoading: tslLoading } = useTimeSlots();
  const { data: roomsRaw } = useRooms();
  const { data: slotsRaw, isLoading: slotsLoading, refetch: refetchSlots } = useScheduleSlots(
    selectedClass ? { assigned_class: selectedClass } : undefined,
  );

  // View queries
  const { data: classScheduleRaw } = useClassSchedule(activeTab === 'class-view' ? selectedClass : undefined);
  const { data: teacherScheduleRaw } = useTeacherSchedule(activeTab === 'teacher-view' ? selectedTeacher : undefined);
  const { data: roomScheduleRaw } = useRoomSchedule(activeTab === 'room-view' ? selectedRoom : undefined);

  /* ── Mutations ─────────────────────────────────────────────────── */
  const createSlot = useCreateScheduleSlot();
  const updateSlot = useUpdateScheduleSlot();
  const deleteSlot = useDeleteScheduleSlot();
  const checkConflicts = useCheckConflicts();
  const publishSchedule = usePublishSchedule();
  const unpublishSchedule = useUnpublishSchedule();
  const exportClassPdf = useExportClassPdf();
  const exportTeacherPdf = useExportTeacherPdf();
  const seedDefaults = useSeedDefaultTimeSlots();

  /* ── Data normalization ────────────────────────────────────────── */
  const classes: ClassInfo[] = useMemo(() => {
    const d = classesRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [classesRaw]);

  const subjects: Subject[] = useMemo(() => {
    const d = subjectsRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [subjectsRaw]);

  const teachers: TeacherProfile[] = useMemo(() => {
    const d = teachersRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [teachersRaw]);

  const timeSlots: TimeSlotConfig[] = useMemo(() => {
    const d = timeSlotsRaw as any;
    const arr: TimeSlotConfig[] = Array.isArray(d) ? d : d?.results ?? [];
    return [...arr].sort((a, b) => a.order - b.order);
  }, [timeSlotsRaw]);

  const rooms: SchoolRoom[] = useMemo(() => {
    const d = roomsRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [roomsRaw]);

  const scheduleSlots: ScheduleSlot[] = useMemo(() => {
    const d = slotsRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [slotsRaw]);

  /* ── Helpers ───────────────────────────────────────────────────── */
  const getSlotForCell = useCallback(
    (day: number, ts: TimeSlotConfig): ScheduleSlot | undefined =>
      scheduleSlots.find(
        (s) => s.day_of_week === day && s.start_time === ts.start_time && s.end_time === ts.end_time,
      ),
    [scheduleSlots],
  );

  // Build a schedule map from view data (schedule organized by day)
  const buildViewMap = useCallback((data: any): Map<string, ScheduleSlot[]> => {
    const map = new Map<string, ScheduleSlot[]>();
    if (!data) return map;
    // Backend returns { schedule: { 0: [...], 1: [...], ... } } or similar
    const schedule = data?.schedule || data;
    if (typeof schedule === 'object' && !Array.isArray(schedule)) {
      Object.entries(schedule).forEach(([day, slots]: [string, any]) => {
        if (Array.isArray(slots)) {
          slots.forEach((s: any) => {
            const key = `${day}-${s.start_time}`;
            map.set(key, [...(map.get(key) || []), s]);
          });
        }
      });
    }
    return map;
  }, []);

  const publishedCount = scheduleSlots.filter(s => s.status === 'PUBLISHED').length;
  const draftCount = scheduleSlots.filter(s => s.status === 'DRAFT').length;
  const isPublished = publishedCount > 0 && draftCount === 0;

  /* ── Drag and Drop handlers ────────────────────────────────────── */
  const handleDragStart = useCallback((e: DragEvent, subjectId: string, subjectName: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', subjectId);
    setDragData({ subjectId, subjectName });
  }, []);

  const handleDragOver = useCallback((e: DragEvent, day: number, slotId: string, isBreak: boolean) => {
    if (isBreak) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropTarget({ day, slotId });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, day: number, ts: TimeSlotConfig) => {
      e.preventDefault();
      setDropTarget(null);
      if (!dragData || !selectedClass || ts.is_break) return;
      // Open modal to complete the slot details
      setPendingCell({ day, slot: ts });
      form.setFieldsValue({
        subject: dragData.subjectId,
        teacher: undefined,
        room: undefined,
        is_temporary: false,
        note: '',
      });
      setAddModalOpen(true);
      setDragData(null);
    },
    [dragData, selectedClass, form],
  );

  /* ── Cell click (alternative to drag) ──────────────────────────── */
  const handleCellClick = useCallback(
    (day: number, ts: TimeSlotConfig) => {
      if (!selectedClass || ts.is_break) return;
      const existing = getSlotForCell(day, ts);
      if (existing) return; // click on existing opens edit
      setPendingCell({ day, slot: ts });
      form.resetFields();
      setAddModalOpen(true);
    },
    [selectedClass, getSlotForCell, form],
  );

  /* ── Save new slot ─────────────────────────────────────────────── */
  const handleSaveSlot = useCallback(async () => {
    if (!pendingCell || !selectedClass) return;
    try {
      const values = await form.validateFields();
      const payload = {
        assigned_class: selectedClass,
        subject: values.subject,
        teacher: values.teacher,
        room: values.room || null,
        day_of_week: pendingCell.day,
        start_time: pendingCell.slot.start_time,
        end_time: pendingCell.slot.end_time,
        is_temporary: values.is_temporary || false,
        note: values.note || '',
      };

      // Check for conflicts first
      const conflictRes = await checkConflicts.mutateAsync(payload);
      const conflicts = (conflictRes as any)?.data?.conflicts || (conflictRes as any)?.conflicts || [];
      if (conflicts.length > 0) {
        message.error(conflicts.map((c: any) => c.message || c).join(', '));
        return;
      }

      await createSlot.mutateAsync(payload);
      setAddModalOpen(false);
      setPendingCell(null);
      form.resetFields();
      refetchSlots();
    } catch {
      // validation error or API error — handled by hooks
    }
  }, [pendingCell, selectedClass, form, checkConflicts, createSlot, refetchSlots]);

  /* ── Edit slot ─────────────────────────────────────────────────── */
  const handleEditClick = useCallback((slot: ScheduleSlot) => {
    setEditSlot(slot);
    form.setFieldsValue({
      subject: slot.subject,
      teacher: slot.teacher,
      room: slot.room || undefined,
      is_temporary: slot.is_temporary,
      note: slot.note || '',
    });
  }, [form]);

  const handleUpdateSlot = useCallback(async () => {
    if (!editSlot) return;
    try {
      const values = await form.validateFields();
      await updateSlot.mutateAsync({
        id: editSlot.id,
        data: {
          subject: values.subject,
          teacher: values.teacher,
          room: values.room || null,
          is_temporary: values.is_temporary || false,
          note: values.note || '',
        },
      });
      setEditSlot(null);
      form.resetFields();
      refetchSlots();
    } catch {
      // handled by hooks
    }
  }, [editSlot, form, updateSlot, refetchSlots]);

  /* ── Delete slot ───────────────────────────────────────────────── */
  const handleDeleteSlot = useCallback(
    (id: string) => {
      deleteSlot.mutate(id, { onSuccess: () => refetchSlots() });
    },
    [deleteSlot, refetchSlots],
  );

  /* ── Publish / Unpublish ───────────────────────────────────────── */
  const handlePublish = useCallback(() => {
    if (!selectedClass) return;
    publishSchedule.mutate(selectedClass, { onSuccess: () => refetchSlots() });
  }, [selectedClass, publishSchedule, refetchSlots]);

  const handleUnpublish = useCallback(() => {
    if (!selectedClass) return;
    unpublishSchedule.mutate(selectedClass, { onSuccess: () => refetchSlots() });
  }, [selectedClass, unpublishSchedule, refetchSlots]);

  /* ── PDF Export ─────────────────────────────────────────────────── */
  const handleExportPdf = useCallback(async (type: 'class' | 'teacher', id: string) => {
    try {
      const blob = type === 'class'
        ? await exportClassPdf.mutateAsync(id)
        : await exportTeacherPdf.mutateAsync(id);
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emploi-du-temps-${type}-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('PDF téléchargé');
    } catch {
      message.error('Erreur export PDF');
    }
  }, [exportClassPdf, exportTeacherPdf]);

  /* ── Seed time slots ───────────────────────────────────────────── */
  const handleSeedDefaults = useCallback(() => {
    seedDefaults.mutate();
  }, [seedDefaults]);

  /* ═══════════════════════════════════════════════════════════════ */
  /*  RENDER: Builder Grid                                          */
  /* ═══════════════════════════════════════════════════════════════ */
  const renderGrid = (readonly = false, slotsData?: ScheduleSlot[]) => {
    const data = slotsData || scheduleSlots;
    if (timeSlots.length === 0) {
      return (
        <div className="tb-empty">
          <CalendarOutlined className="tb-empty__icon" />
          <h3>Aucun créneau horaire configuré</h3>
          <p>Configurez les créneaux horaires pour commencer à construire l&apos;emploi du temps.</p>
          <Button type="primary" onClick={handleSeedDefaults} loading={seedDefaults.isPending}>
            Créer les créneaux par défaut
          </Button>
        </div>
      );
    }

    const cols = DAYS.length + 1;
    return (
      <div className={`tb-grid-wrapper ${readonly ? 'tb-readonly' : ''}`}>
        <div
          className="tb-grid"
          style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)` }}
        >
          {/* Corner */}
          <div className="tb-grid__corner" />
          {/* Day headers */}
          {DAYS.map((d) => (
            <div key={d.value} className="tb-grid__day-header">{d.label}</div>
          ))}

          {/* Rows: one per time slot */}
          {timeSlots.map((ts) => (
            <React.Fragment key={ts.id}>
              {/* Time label */}
              <div className={`tb-grid__time ${ts.is_break ? 'tb-grid__time--break' : ''}`}>
                <span className="tb-grid__time-label">{ts.label}</span>
                <span className="tb-grid__time-range">
                  {ts.start_time?.slice(0, 5)} - {ts.end_time?.slice(0, 5)}
                </span>
              </div>

              {/* Day cells */}
              {DAYS.map((d) => {
                const existing = data.find(
                  (s) => s.day_of_week === d.value && s.start_time === ts.start_time && s.end_time === ts.end_time,
                );
                const isDragOver = dropTarget?.day === d.value && dropTarget?.slotId === ts.id;
                const cellClasses = [
                  'tb-slot',
                  ts.is_break ? 'tb-slot--break' : '',
                  isDragOver ? 'tb-slot--dragover' : '',
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={`${d.value}-${ts.id}`}
                    className={cellClasses}
                    onDragOver={readonly ? undefined : (e) => handleDragOver(e, d.value, ts.id, ts.is_break)}
                    onDragLeave={readonly ? undefined : handleDragLeave}
                    onDrop={readonly ? undefined : (e) => handleDrop(e, d.value, ts)}
                    onClick={readonly ? undefined : () => !existing && handleCellClick(d.value, ts)}
                  >
                    {existing && renderSlotBlock(existing, readonly)}
                    {!existing && !ts.is_break && !readonly && (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                        <PlusOutlined />
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderSlotBlock = (slot: ScheduleSlot, readonly: boolean) => {
    const subj = subjects.find(s => s.id === slot.subject);
    const color = slot.subject_color || (subj ? getSubjectColor(subj) : '#64748B');
    const textColor = contrastText(color);
    const blockClasses = [
      'tb-block',
      slot.status === 'DRAFT' ? 'tb-block--draft' : '',
      slot.is_temporary ? 'tb-block--temporary' : '',
    ].filter(Boolean).join(' ');

    return (
      <Tooltip
        title={
          <div>
            <div><strong>{slot.subject_name || subj?.name}</strong></div>
            <div>Enseignant: {slot.teacher_name || '—'}</div>
            <div>Salle: {slot.room_display || slot.room_name || '—'}</div>
            {slot.is_temporary && <div style={{ color: '#FCD34D' }}>⚠ Modification temporaire</div>}
            {slot.note && <div style={{ fontStyle: 'italic' }}>{slot.note}</div>}
          </div>
        }
      >
        <div
          className={blockClasses}
          style={{
            background: `${color}18`,
            borderColor: color,
            color: textColor === '#FFFFFF' ? color : '#1E293B',
            borderLeft: `3px solid ${color}`,
          }}
          onClick={readonly ? undefined : (e) => { e.stopPropagation(); handleEditClick(slot); }}
        >
          <span className="tb-block__subject">{slot.subject_name || subj?.name}</span>
          <span className="tb-block__teacher">{slot.teacher_name || ''}</span>
          {(slot.room_display || slot.room_name) && (
            <span className="tb-block__room">{slot.room_display || slot.room_name}</span>
          )}
          {!readonly && (
            <div className="tb-block__actions">
              <Popconfirm title="Supprimer ce créneau ?" onConfirm={() => handleDeleteSlot(slot.id)} okText="Oui" cancelText="Non">
                <button onClick={(e) => e.stopPropagation()}><DeleteOutlined /></button>
              </Popconfirm>
            </div>
          )}
        </div>
      </Tooltip>
    );
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  RENDER: Views (class / teacher / room)                        */
  /* ═══════════════════════════════════════════════════════════════ */
  const renderClassView = () => {
    const data = classScheduleRaw as any;
    if (!selectedClass) return <div className="tb-empty"><h3>Sélectionnez une classe</h3></div>;
    if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
    const schedule: Record<string, ScheduleSlot[]> = data?.schedule || data || {};
    const allSlots = Object.entries(schedule).flatMap(([day, slots]: [string, any]) =>
      (Array.isArray(slots) ? slots : []).map((s: any) => ({ ...s, day_of_week: Number(day) })),
    );
    return (
      <>
        <div className="tb-stats">
          <div className="tb-stat-card">
            <div className="tb-stat-card__icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <CalendarOutlined />
            </div>
            <div>
              <div className="tb-stat-card__value">{allSlots.length}</div>
              <div className="tb-stat-card__label">Créneaux cette semaine</div>
            </div>
          </div>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPdf('class', selectedClass)}>
            Export PDF
          </Button>
        </div>
        {renderGrid(true, allSlots)}
      </>
    );
  };

  const renderTeacherView = () => {
    const data = teacherScheduleRaw as any;
    if (!selectedTeacher) return <div className="tb-empty"><h3>Sélectionnez un enseignant</h3></div>;
    if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
    const schedule: Record<string, ScheduleSlot[]> = data?.schedule || data || {};
    const allSlots = Object.entries(schedule).flatMap(([day, slots]: [string, any]) =>
      (Array.isArray(slots) ? slots : []).map((s: any) => ({ ...s, day_of_week: Number(day) })),
    );
    return (
      <>
        <div className="tb-stats">
          <div className="tb-stat-card">
            <div className="tb-stat-card__icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <TeamOutlined />
            </div>
            <div>
              <div className="tb-stat-card__value">{allSlots.length}</div>
              <div className="tb-stat-card__label">Heures d&apos;enseignement</div>
            </div>
          </div>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPdf('teacher', selectedTeacher)}>
            Export PDF
          </Button>
        </div>
        {renderGrid(true, allSlots)}
      </>
    );
  };

  const renderRoomView = () => {
    const data = roomScheduleRaw as any;
    if (!selectedRoom) return <div className="tb-empty"><h3>Sélectionnez une salle</h3></div>;
    if (!data) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
    const schedule: Record<string, ScheduleSlot[]> = data?.schedule || data || {};
    const allSlots = Object.entries(schedule).flatMap(([day, slots]: [string, any]) =>
      (Array.isArray(slots) ? slots : []).map((s: any) => ({ ...s, day_of_week: Number(day) })),
    );
    const room = rooms.find(r => r.id === selectedRoom);
    return (
      <>
        <div className="tb-stats">
          <div className="tb-stat-card">
            <div className="tb-stat-card__icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <AppstoreOutlined />
            </div>
            <div>
              <div className="tb-stat-card__value">{allSlots.length}</div>
              <div className="tb-stat-card__label">Créneaux occupés</div>
            </div>
          </div>
          {room && (
            <div className="tb-stat-card">
              <div>
                <div className="tb-stat-card__value">{room.capacity}</div>
                <div className="tb-stat-card__label">Capacité</div>
              </div>
            </div>
          )}
        </div>
        {renderGrid(true, allSlots)}
      </>
    );
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  MAIN RENDER                                                   */
  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="tb-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="tb-header">
        <div className="tb-header__info">
          <h1>
            <CalendarOutlined style={{ color: '#2563EB' }} />
            Emploi du temps
          </h1>
          <div className="tb-header__subtitle">
            Construisez et gérez les emplois du temps interactifs
          </div>
        </div>
        <div className="tb-header__actions">
          {activeTab === 'builder' && selectedClass && (
            <>
              <span className={`tb-status ${isPublished ? 'tb-status--published' : 'tb-status--draft'}`}>
                {isPublished ? <><CheckCircleOutlined /> Publié</> : <><EditOutlined /> Brouillon</>}
              </span>
              {isPublished ? (
                <Button onClick={handleUnpublish} loading={unpublishSchedule.isPending}>
                  Repasser en brouillon
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handlePublish}
                  loading={publishSchedule.isPending}
                  disabled={scheduleSlots.length === 0}
                >
                  Publier
                </Button>
              )}
              <Button icon={<FilePdfOutlined />} onClick={() => handleExportPdf('class', selectedClass)}>
                PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Tab navigation ─────────────────────────────────────── */}
      <div className="tb-tabs">
        <button
          className={`tb-tab ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <EditOutlined /> Constructeur
        </button>
        <button
          className={`tb-tab ${activeTab === 'class-view' ? 'active' : ''}`}
          onClick={() => setActiveTab('class-view')}
        >
          <UnorderedListOutlined /> Vue Classe
        </button>
        <button
          className={`tb-tab ${activeTab === 'teacher-view' ? 'active' : ''}`}
          onClick={() => setActiveTab('teacher-view')}
        >
          <TeamOutlined /> Vue Enseignant
        </button>
        <button
          className={`tb-tab ${activeTab === 'room-view' ? 'active' : ''}`}
          onClick={() => setActiveTab('room-view')}
        >
          <AppstoreOutlined /> Vue Salle
        </button>
      </div>

      {/* ── Selectors ──────────────────────────────────────────── */}
      <div className="tb-selectors">
        {(activeTab === 'builder' || activeTab === 'class-view') && (
          <Select
            style={{ width: 280 }}
            placeholder="Sélectionner une classe"
            value={selectedClass}
            onChange={setSelectedClass}
            allowClear
            showSearch
            optionFilterProp="label"
            options={classes.map(c => ({ value: c.id, label: c.name }))}
          />
        )}
        {activeTab === 'teacher-view' && (
          <Select
            style={{ width: 280 }}
            placeholder="Sélectionner un enseignant"
            value={selectedTeacher}
            onChange={setSelectedTeacher}
            allowClear
            showSearch
            optionFilterProp="label"
            options={teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))}
          />
        )}
        {activeTab === 'room-view' && (
          <Select
            style={{ width: 280 }}
            placeholder="Sélectionner une salle"
            value={selectedRoom}
            onChange={setSelectedRoom}
            allowClear
            showSearch
            optionFilterProp="label"
            options={rooms.map(r => ({ value: r.id, label: `${r.name} (${r.code})` }))}
          />
        )}
        {activeTab === 'builder' && selectedClass && (
          <Button icon={<ReloadOutlined />} onClick={() => refetchSlots()}>
            Actualiser
          </Button>
        )}
      </div>

      {/* ── Tab content ────────────────────────────────────────── */}
      {activeTab === 'builder' && (
        selectedClass ? (
          <div className="tb-builder">
            {/* Palette sidebar */}
            <div className="tb-palette">
              <div className="tb-palette__section">
                <h3>Matières</h3>
                {subjects.map((s) => {
                  const color = getSubjectColor(s);
                  return (
                    <div
                      key={s.id}
                      className="tb-palette-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, s.id, s.name)}
                    >
                      <div className="tb-palette-item__color" style={{ background: color }} />
                      <span className="tb-palette-item__name">{s.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid */}
            <div>
              {slotsLoading || tslLoading ? (
                <Spin style={{ display: 'block', margin: '40px auto' }} />
              ) : (
                renderGrid()
              )}
            </div>
          </div>
        ) : (
          <div className="tb-empty">
            <CalendarOutlined className="tb-empty__icon" />
            <h3>Sélectionnez une classe</h3>
            <p>Choisissez une classe pour commencer à construire son emploi du temps.</p>
          </div>
        )
      )}

      {activeTab === 'class-view' && renderClassView()}
      {activeTab === 'teacher-view' && renderTeacherView()}
      {activeTab === 'room-view' && renderRoomView()}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  Add Slot Modal                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Modal
        open={addModalOpen}
        title={
          pendingCell
            ? `Ajouter — ${DAY_SHORT[pendingCell.day]} ${pendingCell.slot.start_time?.slice(0, 5)}-${pendingCell.slot.end_time?.slice(0, 5)}`
            : 'Ajouter un créneau'
        }
        onCancel={() => { setAddModalOpen(false); setPendingCell(null); form.resetFields(); }}
        onOk={handleSaveSlot}
        okText="Ajouter"
        confirmLoading={createSlot.isPending || checkConflicts.isPending}
        className="tb-add-modal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="subject" label="Matière" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              placeholder="Choisir une matière"
              showSearch
              optionFilterProp="label"
              options={subjects.map(s => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item name="teacher" label="Enseignant" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              placeholder="Choisir un enseignant"
              showSearch
              optionFilterProp="label"
              options={teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))}
            />
          </Form.Item>
          <Form.Item name="room" label="Salle">
            <Select
              placeholder="Choisir une salle (optionnel)"
              allowClear
              showSearch
              optionFilterProp="label"
              options={rooms.map(r => ({ value: r.id, label: `${r.name} — ${r.code}` }))}
            />
          </Form.Item>
          <Form.Item name="is_temporary" label="Modification temporaire" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="note" label="Note" dependencies={['is_temporary']}>
            <Input.TextArea rows={2} placeholder="Ex: Prof absent, remplacé par M. X" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  Edit Slot Modal                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Modal
        open={!!editSlot}
        title="Modifier le créneau"
        onCancel={() => { setEditSlot(null); form.resetFields(); }}
        onOk={handleUpdateSlot}
        okText="Enregistrer"
        confirmLoading={updateSlot.isPending}
        className="tb-add-modal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="subject" label="Matière" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              placeholder="Choisir une matière"
              showSearch
              optionFilterProp="label"
              options={subjects.map(s => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item name="teacher" label="Enseignant" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              placeholder="Choisir un enseignant"
              showSearch
              optionFilterProp="label"
              options={teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))}
            />
          </Form.Item>
          <Form.Item name="room" label="Salle">
            <Select
              placeholder="Choisir une salle (optionnel)"
              allowClear
              showSearch
              optionFilterProp="label"
              options={rooms.map(r => ({ value: r.id, label: `${r.name} — ${r.code}` }))}
            />
          </Form.Item>
          <Form.Item name="is_temporary" label="Modification temporaire" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={2} placeholder="Ex: Changement de salle" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimetableBuilder;
