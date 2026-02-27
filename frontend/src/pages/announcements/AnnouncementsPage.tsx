import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { announcements } from '../../data/mockData';
import type { BadgeColor } from '../../types';

const typeColors: Record<string, BadgeColor> = {
  Urgent: 'red',
  Info: 'blue',
  Événement: 'green',
  Rappel: 'yellow',
};

const AnnouncementsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Annonces & Communication"
        subtitle="Créer et gérer les annonces pour la communauté scolaire"
        actions={<button style={btn('primary')} onClick={() => setShowForm(!showForm)}>+ Nouvelle annonce</button>}
      />

      {showForm && (
        <div className="card">
          <h2 style={{ ...h2, marginBottom: 14 }}>Créer une annonce</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Titre</label>
              <input type="text" placeholder="Titre de l'annonce" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle}>
                <option>Info</option>
                <option>Urgent</option>
                <option>Événement</option>
                <option>Rappel</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Message</label>
            <textarea
              placeholder="Écrivez votre annonce ici…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Destinataires</label>
              <select style={inputStyle}>
                <option>Tous</option>
                <option>Enseignants</option>
                <option>Parents</option>
                <option>Élèves</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priorité</label>
              <select style={inputStyle}>
                <option>Normale</option>
                <option>Haute</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={btn('primary')}>📤 Publier</button>
            <button style={btn('outline')} onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Announcement list */}
      {announcements.map((a) => (
        <div key={a.id} className="card" style={{ borderLeft: `4px solid ${a.type === 'Urgent' ? '#FF4757' : a.type === 'Événement' ? '#00C48C' : '#1A6BFF'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge label={a.type} color={typeColors[a.type] || 'blue'} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>{a.title}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Par {a.author} • {a.date}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={btn('ghost')}>✏️</button>
              <button style={btn('ghost')}>🗑️</button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{a.content}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, fontSize: 11, color: '#9CA3AF' }}>
            <span>👁 {a.views} vues</span>
            <span>👥 {a.target}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0 };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10,
  fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
};

function btn(variant: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    case 'ghost': return { ...base, background: 'transparent', color: '#6B7280', padding: '4px 8px' };
    default: return base;
  }
}

export default AnnouncementsPage;
