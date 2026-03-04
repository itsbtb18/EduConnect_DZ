import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Modal, Form, Select, Input, Table, Tooltip, Spin, message, Alert,
} from 'antd';
import {
  ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CalendarOutlined, DownloadOutlined, CloseOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, CloudUploadOutlined,
  FilePdfOutlined, DeleteFilled, SettingOutlined,
} from '@ant-design/icons';
import {
  useTimetables, useTimetablesClassesStatus,
  useCreateTimetable, useUpdateTimetable, useDeleteTimetable,
  useClasses, useAcademicYears,
} from '../../hooks/useApi';
import dayjs from 'dayjs';
import './TimetablePage.css';

/* ─── Types ───────────────────────────────────────────────────────── */
interface TimetableRecord {
  id: string;
  class_group: string;
  class_name: string;
  academic_year: string;
  academic_year_name: string;
  title: string;
  image: string;
  image_url: string;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

interface ClassStatus {
  id: string;
  name: string;
  timetable_count: number;
  timetable_titles: string[];
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
const isPdf = (url: string) => url?.toLowerCase().endsWith('.pdf');
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'pdf'];
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TimetablePage: React.FC = () => {  const navigate = useNavigate();
  /* ── State ─────────────────────────────────────────────────────── */
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TimetableRecord | null>(null);
  const [lightboxItem, setLightboxItem] = useState<TimetableRecord | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();

  /* ── Queries ───────────────────────────────────────────────────── */
  const timetableParams = classFilter ? { class: classFilter } : undefined;
  const { data: ttData, isLoading, refetch, isError: ttError } = useTimetables(timetableParams);
  const { data: statusData, isLoading: statusLoading, isError: statusError } = useTimetablesClassesStatus();
  const { data: classesData } = useClasses();
  const { data: yearsData } = useAcademicYears();

  const createTT = useCreateTimetable();
  const updateTT = useUpdateTimetable();
  const deleteTT = useDeleteTimetable();

  const timetables: TimetableRecord[] = (ttData as any)?.results || [];
  // classes-status returns a bare array, but extractData wraps it → {results, count}
  const classStatuses: ClassStatus[] = Array.isArray(statusData)
    ? statusData
    : ((statusData as any)?.results || []);
  const classes = ((classesData as any)?.results || []) as { id: string; name: string }[];
  const academicYears = ((yearsData as any)?.results || []) as { id: string; name: string; is_current: boolean }[];
  const currentYear = academicYears.find((y) => y.is_current) || academicYears[0];

  /* ── Stats ─────────────────────────────────────────────────────── */
  const totalTimetables = timetables.length;
  const configuredClasses = classStatuses.filter((c) => c.timetable_count > 0).length;
  const totalClasses = classStatuses.length;
  const hasNoClasses = !statusLoading && classStatuses.length === 0;

  /* ── File handling ─────────────────────────────────────────────── */
  const validateFile = useCallback((file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.includes(ext)) return 'Format non supporté. Utilisez PNG, JPG, JPEG ou PDF.';
    if (file.size > MAX_SIZE) return 'La taille du fichier dépasse 10 Mo.';
    return '';
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const err = validateFile(file);
    setFileError(err);
    if (err) { setSelectedFile(null); setFilePreview(null); return; }
    setSelectedFile(file);
    if (!isPdf(file.name)) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ── Modal open/close ──────────────────────────────────────────── */
  const openCreate = (preClassId?: string) => {
    setEditRecord(null);
    setSelectedFile(null);
    setFilePreview(null);
    setFileError('');
    form.resetFields();
    if (preClassId) form.setFieldsValue({ class_group: preClassId });
    setModalOpen(true);
  };

  const openEdit = (record: TimetableRecord) => {
    setEditRecord(record);
    setSelectedFile(null);
    setFilePreview(null);
    setFileError('');
    form.setFieldsValue({
      class_group: record.class_group,
      title: record.title,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditRecord(null);
    clearFile();
    form.resetFields();
  };

  /* ── Submit ────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const fd = new FormData();
      fd.append('title', values.title);

      if (editRecord) {
        // Edit: only send changed fields
        if (selectedFile) fd.append('image', selectedFile);
        await updateTT.mutateAsync({ id: editRecord.id, data: fd });
        closeModal();
      } else {
        // Create
        if (!selectedFile) {
          setFileError('Veuillez sélectionner une image.');
          return;
        }
        fd.append('class_group', values.class_group);
        if (currentYear) fd.append('academic_year', currentYear.id);
        fd.append('image', selectedFile);
        await createTT.mutateAsync(fd);
        const cls = classes.find((c) => c.id === values.class_group);
        message.success(`Emploi du temps ajouté pour ${cls?.name || 'la classe'}`);
        closeModal();
      }
    } catch {
      /* form validation */
    }
  };

  /* ── Delete ────────────────────────────────────────────────────── */
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer cet emploi du temps ?',
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okButtonProps: { danger: true },
      onOk: () => deleteTT.mutateAsync(id),
    });
  };

  /* ── Lightbox keyboard ─────────────────────────────────────────── */
  useEffect(() => {
    if (!lightboxItem) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxItem]);

  const downloadImage = (item: TimetableRecord) => {
    const link = document.createElement('a');
    link.href = item.image_url;
    link.download = item.title + (isPdf(item.image_url) ? '.pdf' : '.jpg');
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Table columns ─────────────────────────────────────────────── */
  const columns = [
    {
      title: 'Aperçu',
      dataIndex: 'image_url',
      key: 'preview',
      width: 80,
      render: (url: string, record: TimetableRecord) =>
        isPdf(url) ? (
          <div className="tt-thumb-pdf" onClick={() => setLightboxItem(record)}>
            <FilePdfOutlined />
          </div>
        ) : (
          <img
            src={url}
            alt={record.title}
            className="tt-thumb"
            onClick={() => setLightboxItem(record)}
          />
        ),
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: TimetableRecord) => (
        <span className="tt-title-link" onClick={() => setLightboxItem(record)}>
          {title}
        </span>
      ),
    },
    {
      title: 'Classe',
      dataIndex: 'class_name',
      key: 'class_name',
      width: 130,
      render: (v: string) => <span style={{ fontWeight: 600, color: '#0F2044' }}>{v}</span>,
    },
    {
      title: 'Uploadé par',
      dataIndex: 'uploaded_by_name',
      key: 'uploaded_by',
      width: 160,
      render: (v: string) => v || '—',
    },
    {
      title: "Date d'ajout",
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: TimetableRecord) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="Voir">
            <button className="tt-action-btn" onClick={() => setLightboxItem(record)}>
              <EyeOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Modifier">
            <button className="tt-action-btn" onClick={() => openEdit(record)}>
              <EditOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Supprimer">
            <button className="tt-action-btn tt-action-btn--danger" onClick={() => handleDelete(record.id)}>
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="page animate-fade-in tt-page">
      {/* Header */}
      <div className="tt-header">
        <div className="tt-header__info">
          <h1>Emploi du temps</h1>
          <div className="tt-header__subtitle">
            {totalTimetables} emploi{totalTimetables !== 1 ? 's' : ''} du temps · {configuredClasses} classe{configuredClasses !== 1 ? 's' : ''} configurée{configuredClasses !== 1 ? 's' : ''} / {totalClasses} classes total
          </div>
        </div>
        <div className="tt-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openCreate()}
            style={{ background: '#00C9A7', borderColor: '#00C9A7' }}
          >
            Ajouter un emploi du temps
          </Button>
        </div>
      </div>

      {/* Classes status row */}
      {statusLoading ? (
        <div className="tt-classes-loading">
          <Spin size="small" /> Chargement des classes…
        </div>
      ) : classStatuses.length > 0 && (
        <div className="tt-classes-row">
          {/* All chip */}
          <div
            className={`tt-class-chip tt-class-chip--all ${classFilter === null ? 'tt-class-chip--active' : ''}`}
            onClick={() => setClassFilter(null)}
          >
            <span className="tt-class-chip__name">Toutes les classes</span>
          </div>
          {classStatuses.map((cs) => (
            <div
              key={cs.id}
              className={`tt-class-chip tt-animate ${classFilter === cs.id ? 'tt-class-chip--active' : ''}`}
              onClick={() => setClassFilter(cs.id === classFilter ? null : cs.id)}
            >
              {cs.timetable_count > 0 ? (
                <CheckCircleOutlined className="tt-class-chip__icon--ok" />
              ) : (
                <ExclamationCircleOutlined className="tt-class-chip__icon--empty" />
              )}
              <span className="tt-class-chip__name">{cs.name}</span>
              <span className={`tt-class-chip__status ${cs.timetable_count > 0 ? 'tt-class-chip__status--ok' : 'tt-class-chip__status--empty'}`}>
                {cs.timetable_count > 0 ? `${cs.timetable_count} emploi${cs.timetable_count > 1 ? 's' : ''}` : 'Aucun emploi'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {(ttError || statusError) && (
        <Alert
          type="error"
          showIcon
          message="Erreur de chargement"
          description="Impossible de charger les emplois du temps. Vérifiez votre connexion et réessayez."
          action={<Button onClick={() => refetch()}>Réessayer</Button>}
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && !ttError && (
        <div className="tt-table-wrap" style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin size="large" tip="Chargement des emplois du temps…" />
        </div>
      )}

      {/* Premium empty state: no classes in the school yet */}
      {!isLoading && !ttError && hasNoClasses ? (
        <div className="tt-table-wrap">
          <div className="tt-empty">
            <SettingOutlined className="tt-empty__icon" style={{ fontSize: 56 }} />
            <div className="tt-empty__title">
              Aucune classe configurée
            </div>
            <div className="tt-empty__subtitle">
              Vous devez d'abord créer vos classes dans l'assistant de configuration
              avant de pouvoir ajouter des emplois du temps.
            </div>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => navigate('/setup')}
              style={{ background: '#00C9A7', borderColor: '#00C9A7' }}
            >
              Configurer l'école
            </Button>
          </div>
        </div>

      /* Empty state: classes exist but no timetables uploaded */
      ) : !isLoading && !ttError && timetables.length === 0 ? (
        <div className="tt-table-wrap">
          <div className="tt-empty">
            <CalendarOutlined className="tt-empty__icon" />
            <div className="tt-empty__title">
              {classFilter ? 'Aucun emploi du temps pour cette classe' : 'Aucun emploi du temps configuré'}
            </div>
            <div className="tt-empty__subtitle">
              {classFilter
                ? 'Ajoutez un emploi du temps pour cette classe.'
                : 'Assignez des enseignants à vos classes pour générer l\'emploi du temps, ou uploadez une image.'}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCreate(classFilter || undefined)}
                style={{ background: '#00C9A7', borderColor: '#00C9A7' }}
              >
                Ajouter un emploi du temps
              </Button>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => navigate('/classes')}
              >
                Gérer les classes
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="tt-table-wrap">
          <Table
            columns={columns}
            dataSource={timetables}
            loading={isLoading}
            rowKey="id"
            pagination={timetables.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
            locale={{ emptyText: 'Aucun emploi du temps' }}
          />
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightboxItem && (
        <div className="tt-lightbox" onClick={(e) => { if (e.target === e.currentTarget) setLightboxItem(null); }}>
          <div className="tt-lightbox__header">
            <span className="tt-lightbox__title">{lightboxItem.title}</span>
            <div className="tt-lightbox__actions">
              <button className="tt-lightbox__btn" onClick={() => downloadImage(lightboxItem)} title="Télécharger">
                <DownloadOutlined />
              </button>
              <button className="tt-lightbox__btn" onClick={() => setLightboxItem(null)} title="Fermer">
                <CloseOutlined />
              </button>
            </div>
          </div>
          {isPdf(lightboxItem.image_url) ? (
            <iframe src={lightboxItem.image_url} className="tt-lightbox__pdf-frame" title={lightboxItem.title} />
          ) : (
            <img src={lightboxItem.image_url} alt={lightboxItem.title} className="tt-lightbox__image" />
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────── */}
      <Modal
        title={editRecord ? 'Modifier l\'emploi du temps' : 'Ajouter un emploi du temps'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={createTT.isPending || updateTT.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
        width={560}
        className="tt-modal"
        destroyOnClose
        okButtonProps={{ style: { background: '#00C9A7', borderColor: '#00C9A7' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Class selector */}
          <Form.Item
            label="Classe"
            name="class_group"
            rules={editRecord ? [] : [{ required: true, message: 'Sélectionnez une classe' }]}
          >
            {editRecord ? (
              <div className="tt-readonly-field">{editRecord.class_name}</div>
            ) : (
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Sélectionner une classe"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          </Form.Item>

          {/* Title */}
          <Form.Item
            label="Titre"
            name="title"
            rules={[{ required: true, message: 'Le titre est requis' }]}
          >
            <Input placeholder="Ex: Emploi du temps 1er Trimestre" />
          </Form.Item>

          {/* Academic year — read-only */}
          <Form.Item label="Année scolaire">
            <div className="tt-readonly-field">
              {editRecord ? editRecord.academic_year_name : (currentYear?.name || '—')}
            </div>
          </Form.Item>

          {/* Current image (edit mode) */}
          {editRecord && editRecord.image_url && !selectedFile && (
            <div className="tt-current-image">
              <div className="tt-current-image__label">Image actuelle</div>
              {isPdf(editRecord.image_url) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: '#FEF2F2', borderRadius: 8 }}>
                  <FilePdfOutlined style={{ fontSize: 24, color: '#DC2626' }} />
                  <span style={{ color: '#0F2044', fontWeight: 500 }}>Document PDF</span>
                </div>
              ) : (
                <img src={editRecord.image_url} alt="current" className="tt-current-image__img" />
              )}
            </div>
          )}

          {/* Upload zone */}
          <Form.Item label={editRecord ? 'Remplacer l\'image (optionnel)' : 'Image'} required={!editRecord}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            {!selectedFile ? (
              <div
                className={`tt-upload-zone ${isDragging ? 'tt-upload-zone--drag' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <CloudUploadOutlined className="tt-upload-zone__icon" />
                <div className="tt-upload-zone__text">Cliquez ou glissez l'image ici</div>
                <div className="tt-upload-zone__hint">PNG, JPG, PDF — max 10 MB</div>
              </div>
            ) : (
              <div className="tt-upload-preview">
                {isPdf(selectedFile.name) ? (
                  <div className="tt-upload-preview__pdf-icon">
                    <FilePdfOutlined />
                  </div>
                ) : filePreview ? (
                  <img src={filePreview} alt="preview" className="tt-upload-preview__img" />
                ) : null}
                <div className="tt-upload-preview__info">
                  <div className="tt-upload-preview__name">{selectedFile.name}</div>
                  <div className="tt-upload-preview__size">{formatSize(selectedFile.size)}</div>
                </div>
                <DeleteFilled className="tt-upload-preview__remove" onClick={clearFile} />
              </div>
            )}

            {fileError && <div className="tt-upload-zone__error">{fileError}</div>}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimetablePage;
