import React, { useState } from 'react';
import { Modal } from 'antd';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { announcements as initialAnnouncements } from '../../data/mockData';
import { Announcement } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const blankForm = () => ({
  title:    '',
  message:  '',
  audience: 'Tous',
  urgent:   false,
  pushNotif:false,
});

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1.5px solid #D1D5DB',
  padding: '10px 14px',
  fontSize: 13,
  fontFamily: 'var(--font)',
  color: '#374151',
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 12,
  background: 'white',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 6,
};

// ─── Ghost text button ────────────────────────────────────────────────────────

const GhostBtn: React.FC<{ label: string; color?: string; onClick?: () => void }> = ({
  label, color = '#6B7280', onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 12, color, fontFamily: 'var(--font)', padding: '0 4px',
    }}
  >
    {label}
  </button>
);

// ─── Announcement Card ────────────────────────────────────────────────────────

const AnnCard: React.FC<{ ann: Announcement; onDelete: (id: string) => void }> = ({
  ann, onDelete,
}) => (
  <div
    style={{
      background: 'white',
      borderRadius: 16,
      padding: 20,
      borderLeft: `4px solid ${ann.urgent ? '#FF4757' : '#1A6BFF'}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      marginBottom: 14,
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
    }}
  >
    {/* Icon box */}
    <div
      style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: ann.urgent ? '#FFE8EA' : '#E8F0FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}
    >
      {ann.icon}
    </div>

    {/* Content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>{ann.title}</span>
        {ann.urgent && <Badge label="Urgent" color="red" />}
      </div>

      {/* Author/date */}
      <div style={{ fontSize: 12, color: '#6B7280' }}>
        Par {ann.author} · {ann.date}
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <Badge label={`👁 ${ann.audience}`} color="blue" />
        <GhostBtn label="Modifier" color="#1A6BFF" />
        <GhostBtn label="Supprimer" color="#FF4757" onClick={() => onDelete(ann.id)} />
      </div>
    </div>
  </div>
);

// ─── Announcement Form ────────────────────────────────────────────────────────

interface FormState {
  title:    string;
  message:  string;
  audience: string;
  urgent:   boolean;
  pushNotif:boolean;
}

const AnnForm: React.FC<{
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  submitLabel?: string;
}> = ({ form, setForm, onSubmit, submitLabel = "🚀 Publier l'annonce" }) => {
  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const [hovSubmit, setHovSubmit] = useState(false);

  return (
    <div>
      {/* Title */}
      <label style={fieldLabel}>Titre</label>
      <input
        style={inputStyle}
        placeholder="Titre de l'annonce…"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = '#1A6BFF')}
        onBlur={(e)  => (e.target.style.borderColor = '#D1D5DB')}
      />

      {/* Message */}
      <label style={fieldLabel}>Message</label>
      <textarea
        style={{ ...inputStyle, height: 100, resize: 'none', marginBottom: 12 }}
        placeholder="Contenu de l'annonce…"
        value={form.message}
        onChange={(e) => set('message', e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = '#1A6BFF')}
        onBlur={(e)  => (e.target.style.borderColor = '#D1D5DB')}
      />

      {/* Audience */}
      <label style={fieldLabel}>Public cible</label>
      <select
        value={form.audience}
        onChange={(e) => set('audience', e.target.value)}
        style={{ ...inputStyle }}
      >
        <option value="Tous">Tous les utilisateurs</option>
        <option value="Parents">Parents uniquement</option>
        <option value="Élèves">Élèves uniquement</option>
        <option value="Enseignants">Enseignants uniquement</option>
        <option value="Classe">Classe spécifique</option>
      </select>

      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.urgent}
            onChange={(e) => set('urgent', e.target.checked)}
            style={{ accentColor: '#FF4757', width: 15, height: 15 }}
          />
          Marquer comme urgent
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.pushNotif}
            onChange={(e) => set('pushNotif', e.target.checked)}
            style={{ accentColor: '#1A6BFF', width: 15, height: 15 }}
          />
          Envoyer notification push
        </label>
      </div>

      {/* File drop zone */}
      <div
        style={{
          border: '1.5px dashed #D1D5DB', borderRadius: 10, padding: 16,
          textAlign: 'center', cursor: 'pointer', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1A6BFF')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
      >
        <span style={{ fontSize: 18 }}>📎</span>
        <span style={{ fontSize: 13, color: '#6B7280' }}>Joindre des fichiers ou images</span>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        onMouseEnter={() => setHovSubmit(true)}
        onMouseLeave={() => setHovSubmit(false)}
        style={{
          width: '100%',
          background: hovSubmit ? '#1558d6' : '#1A6BFF',
          color: 'white',
          padding: '12px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          transition: 'background 0.15s',
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AnnouncementsPage: React.FC = () => {
  const [annList, setAnnList] = useState<Announcement[]>(initialAnnouncements);
  const [modalOpen, setModalOpen] = useState(false);

  // Inline form state (right panel)
  const [inlineForm, setInlineForm] = useState<FormState>(blankForm());

  // Modal form state
  const [modalForm, setModalForm] = useState<FormState>(blankForm());

  const [hovPrimary, setHovPrimary] = useState(false);

  const handleDelete = (id: string) =>
    setAnnList((prev) => prev.filter((a) => a.id !== id));

  const buildAnn = (form: FormState, prefix: string): Announcement => ({
    id: `${prefix}-${Date.now()}`,
    title:    form.title || 'Sans titre',
    body:     form.message || '',
    author:   'Admin',
    date:     '27 Fév 2026',
    audience: (form.audience as Announcement['audience']),
    urgent:   form.urgent,
    icon:     form.urgent ? '📢' : '📋',
  });

  const handleInlineSubmit = () => {
    setAnnList((prev) => [buildAnn(inlineForm, 'inline'), ...prev]);
    setInlineForm(blankForm());
  };

  const handleModalSubmit = () => {
    setAnnList((prev) => [buildAnn(modalForm, 'modal'), ...prev]);
    setModalForm(blankForm());
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <PageHeader
        title="Annonces"
        subtitle="Communiquez avec votre communauté scolaire"
        actions={
          <button
            onMouseEnter={() => setHovPrimary(true)}
            onMouseLeave={() => setHovPrimary(false)}
            onClick={() => setModalOpen(true)}
            style={{
              padding: '9px 16px', borderRadius: 10, border: 'none',
              background: hovPrimary ? '#1558d6' : '#1A6BFF',
              color: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'background 0.15s',
            }}
          >
            + Nouvelle annonce
          </button>
        }
      />

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left — list */}
        <div>
          {annList.map((ann) => (
            <AnnCard key={ann.id} ann={ann} onDelete={handleDelete} />
          ))}
          {annList.length === 0 && (
            <div
              style={{
                background: 'white', borderRadius: 16, padding: 40,
                textAlign: 'center', color: '#9CA3AF', fontSize: 14,
              }}
            >
              Aucune annonce pour le moment.
            </div>
          )}
        </div>

        {/* Right — inline create form */}
        <div
          style={{
            background: 'white', borderRadius: 16, padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
            ✏️ Créer une Annonce
          </div>
          <AnnForm
            form={inlineForm}
            setForm={setInlineForm}
            onSubmit={handleInlineSubmit}
          />
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={560}
        title={
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>
            ✏️ Nouvelle Annonce
          </span>
        }
      >
        <div style={{ paddingTop: 8 }}>
          <AnnForm
            form={modalForm}
            setForm={setModalForm}
            onSubmit={handleModalSubmit}
            submitLabel="🚀 Publier l'annonce"
          />
        </div>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
