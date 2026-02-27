import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { wilayas } from '../../data/mockData';

type Tab = 'profile' | 'academic' | 'notifications' | 'security' | 'subscription';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profil', icon: '🏫' },
  { key: 'academic', label: 'Académique', icon: '📚' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'security', label: 'Sécurité', icon: '🔒' },
  { key: 'subscription', label: 'Abonnement', icon: '💳' },
];

const SettingsPage: React.FC = () => {
  const [active, setActive] = useState<Tab>('profile');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Paramètres"
        subtitle="Configurer votre établissement et votre compte"
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 12, padding: 4, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: active === t.key ? '#1A6BFF' : 'transparent',
              color: active === t.key ? '#fff' : '#6B7280',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === 'profile' && <ProfileTab />}
      {active === 'academic' && <AcademicTab />}
      {active === 'notifications' && <NotificationsTab />}
      {active === 'security' && <SecurityTab />}
      {active === 'subscription' && <SubscriptionTab />}
    </div>
  );
};

/* ─── Shared ─── */
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10,
  fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
};

function btn(variant: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'danger': return { ...base, background: '#FF4757', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    default: return { ...base, background: '#F3F4F6', color: '#374151' };
  }
}

/* ─── Profile Tab ─── */
const ProfileTab: React.FC = () => (
  <div className="card">
    <h2 style={h2}>Informations de l'établissement</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
      <div>
        <label style={labelStyle}>Nom de l'établissement</label>
        <input type="text" defaultValue="Lycée El-Feth" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Type</label>
        <select style={inputStyle}>
          <option>Lycée</option>
          <option>CEM</option>
          <option>École primaire</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Wilaya</label>
        <select style={inputStyle}>
          {wilayas.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Commune</label>
        <input type="text" defaultValue="Belouizdad" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Téléphone</label>
        <input type="text" defaultValue="023 45 67 89" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" defaultValue="contact@lycee-elfeth.edu.dz" style={inputStyle} />
      </div>
    </div>
    <div style={{ marginTop: 16 }}>
      <button style={btn('primary')}>💾 Enregistrer</button>
    </div>
  </div>
);

/* ─── Academic Tab ─── */
const AcademicTab: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="card">
      <h2 style={h2}>Année scolaire</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div>
          <label style={labelStyle}>Année en cours</label>
          <select style={inputStyle}>
            <option>2025–2026</option>
            <option>2024–2025</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Début</label>
          <input type="date" defaultValue="2025-09-07" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Fin</label>
          <input type="date" defaultValue="2026-06-30" style={inputStyle} />
        </div>
      </div>
    </div>
    <div className="card">
      <h2 style={h2}>Système de notation</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div>
          <label style={labelStyle}>Système</label>
          <select style={inputStyle}>
            <option>Sur 20</option>
            <option>Lettres (A–F)</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Moyenne de passage</label>
          <input type="number" defaultValue={10} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button style={btn('primary')}>💾 Enregistrer</button>
      </div>
    </div>
  </div>
);

/* ─── Notifications Tab ─── */
const NotificationsTab: React.FC = () => {
  const options = [
    { label: 'Nouvelles inscriptions', desc: 'Notification à chaque nouveau dossier', on: true },
    { label: 'Notes publiées', desc: 'Quand un enseignant publie des notes', on: true },
    { label: 'Absences non justifiées', desc: 'Alert après 3 absences consécutives', on: false },
    { label: 'Paiements en retard', desc: 'Rappels automatiques aux parents', on: true },
    { label: 'Rapports hebdomadaires', desc: 'Résumé chaque dimanche matin', on: false },
  ];
  return (
    <div className="card">
      <h2 style={h2}>Préférences de notifications</h2>
      {options.map((o, i) => (
        <div
          key={i}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: i < options.length - 1 ? '1px solid #F3F4F6' : 'none',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{o.label}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{o.desc}</div>
          </div>
          <ToggleSwitch defaultOn={o.on} />
        </div>
      ))}
    </div>
  );
};

const ToggleSwitch: React.FC<{ defaultOn: boolean }> = ({ defaultOn }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      onClick={() => setOn(!on)}
      style={{
        width: 42, height: 24, borderRadius: 12, cursor: 'pointer',
        background: on ? '#1A6BFF' : '#D1D5DB', position: 'relative', transition: 'background .2s',
      }}
    >
      <div
        style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: on ? 21 : 3, transition: 'left .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
};

/* ─── Security Tab ─── */
const SecurityTab: React.FC = () => (
  <div className="card">
    <h2 style={h2}>Sécurité du compte</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
      <div>
        <label style={labelStyle}>Mot de passe actuel</label>
        <input type="password" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Nouveau mot de passe</label>
        <input type="password" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Confirmer</label>
        <input type="password" style={inputStyle} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
      <button style={btn('primary')}>🔒 Changer le mot de passe</button>
      <button style={btn('outline')}>Activer l'A2F</button>
    </div>
  </div>
);

/* ─── Subscription Tab ─── */
const SubscriptionTab: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div
      style={{
        borderRadius: 16, padding: 24,
        background: 'linear-gradient(135deg, #1A6BFF 0%, #9333EA 100%)',
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.9 }}>Plan actuel</div>
      <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>Premium</div>
      <div style={{ fontSize: 13, opacity: 0.9 }}>Renouvel le 1er Septembre 2026 • 45,000 DZD/an</div>
    </div>

    <div className="card">
      <h2 style={h2}>Fonctionnalités incluses</h2>
      <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
        {['Gestion illimitée d\'élèves & enseignants', 'Messagerie & annonces', 'Analytiques avancées', 'Support prioritaire 24/7', 'Export PDF & Excel'].map(
          (f, i) => (
            <li key={i} style={{ padding: '6px 0', fontSize: 13, color: '#374151' }}>
              ✅ {f}
            </li>
          ),
        )}
      </ul>
    </div>
  </div>
);

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0 };

export default SettingsPage;
