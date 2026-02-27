import React, { useState } from 'react';
import { Tabs, Switch, Slider } from 'antd';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

// ─── Shared field styles ──────────────────────────────────────────────────────

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 6,
};

const inp: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1.5px solid #D1D5DB',
  padding: '10px 14px',
  fontSize: 13,
  fontFamily: 'var(--font)',
  color: '#374151',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
};

const fieldWrap: React.CSSProperties = { marginBottom: 16 };

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  marginBottom: 20,
};

// ─── Reusable labeled input ───────────────────────────────────────────────────

const Field: React.FC<{
  lbl: string;
  type?: string;
  defaultValue?: string;
  readOnly?: boolean;
  as?: 'textarea' | 'select';
  rows?: number;
  children?: React.ReactNode;
}> = ({ lbl, type = 'text', defaultValue, readOnly, as, rows, children }) => (
  <div style={fieldWrap}>
    <label style={label}>{lbl}</label>
    {as === 'textarea' ? (
      <textarea
        defaultValue={defaultValue}
        rows={rows ?? 3}
        style={{ ...inp, resize: 'none', height: 'auto' }}
        onFocus={(e) => (e.target.style.borderColor = '#1A6BFF')}
        onBlur={(e)  => (e.target.style.borderColor = '#D1D5DB')}
      />
    ) : as === 'select' ? (
      <select style={inp}>
        {children}
      </select>
    ) : (
      <input
        type={type}
        defaultValue={defaultValue}
        readOnly={readOnly}
        style={{ ...inp, background: readOnly ? '#F9FAFB' : 'white', color: readOnly ? '#9CA3AF' : '#374151' }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = '#1A6BFF'; }}
        onBlur={(e)  => { if (!readOnly) e.target.style.borderColor = '#D1D5DB'; }}
      />
    )}
  </div>
);

// ─── Save button ──────────────────────────────────────────────────────────────

const SaveBtn: React.FC<{ label?: string }> = ({ label: lbl = '💾 Enregistrer les modifications' }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', background: hov ? '#1558d6' : '#1A6BFF', color: 'white',
        padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600,
        border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
        transition: 'background 0.15s', marginTop: 8,
      }}
    >
      {lbl}
    </button>
  );
};

// ─── Outline small btn ────────────────────────────────────────────────────────

const SmOutlineBtn: React.FC<{ label: string; danger?: boolean }> = ({ label: lbl, danger }) => {
  const [hov, setHov] = useState(false);
  const c = danger ? '#FF4757' : '#1A6BFF';
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.15s',
        background: hov ? (danger ? '#FFE8EA' : '#E8F0FF') : 'white',
        border: `1.5px solid ${c}`, color: c,
      }}
    >
      {lbl}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Profil de l'École
// ═══════════════════════════════════════════════════════════════════════════════

const TabProfil: React.FC = () => (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

      {/* Left */}
      <div>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div
              style={{
                width: 100, height: 100, borderRadius: '50%', background: '#E8F0FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
              }}
            >
              🏫
            </div>
            <button
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 32, height: 32, borderRadius: '50%',
                background: '#1A6BFF', color: 'white', border: '2px solid white',
                cursor: 'pointer', fontSize: 14, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              📷
            </button>
          </div>
        </div>

        <Field lbl="Nom de l'école"  defaultValue="École Privée Al-Amal" />
        <Field lbl="Téléphone"       defaultValue="+213 23 45 67 89" />
        <Field lbl="Email"           type="email" defaultValue="contact@alanal.edu.dz" />
        <Field lbl="Devise (motto)"  defaultValue="L'excellence au service de l'avenir" />
        <Field lbl="Adresse"         as="textarea" rows={3} defaultValue="12 Rue de la République, Alger-Centre" />
        <Field lbl="Wilaya" as="select">
          <option>Alger</option>
          <option>Blida</option>
          <option>Oran</option>
          <option>Constantine</option>
          <option>Annaba</option>
        </Field>
      </div>

      {/* Right */}
      <div>
        <Field lbl="Sous-domaine" defaultValue="votre-ecole.educonnect.dz" readOnly />
        <Field lbl="Type d'école" as="select">
          <option>Primaire</option>
          <option>Collège</option>
          <option>Lycée</option>
          <option>Primaire + Collège</option>
          <option>Complet</option>
        </Field>
        <Field lbl="Année scolaire" defaultValue="2025-2026" />
        <Field lbl="Heure de début" type="time" defaultValue="08:00" />
        <Field lbl="Heure de fin"   type="time" defaultValue="17:00" />

        {/* Subscription card */}
        <div style={{ background: '#E8F0FF', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            Plan actuel
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A6BFF', marginBottom: 4 }}>
            Pro — 50,000 DZD / mois
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
            Valide jusqu'au 31 Août 2026
          </div>
          <SmOutlineBtn label="Mettre à niveau" />
        </div>
      </div>
    </div>

    <SaveBtn />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Configuration Académique
// ═══════════════════════════════════════════════════════════════════════════════

interface Weights {
  participation: number;
  compo1: number;
  compo2: number;
  examen: number;
}

const SliderRow: React.FC<{
  lbl: string; value: number; max: number;
  onChange: (v: number) => void;
}> = ({ lbl, value, max, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
    <span style={{ fontSize: 13, color: '#374151', minWidth: 170 }}>{lbl}</span>
    <div style={{ flex: 1 }}>
      <Slider min={0} max={max} value={value} onChange={onChange} />
    </div>
    <div
      style={{
        minWidth: 44, textAlign: 'center', padding: '3px 10px',
        borderRadius: 100, background: '#E8F0FF', color: '#1A6BFF',
        fontSize: 12, fontWeight: 700,
      }}
    >
      {value}%
    </div>
  </div>
);

const ThresholdRow: React.FC<{ lbl: string; defaultVal: string; suffix: string }> = ({
  lbl, defaultVal, suffix,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{lbl}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="number"
        defaultValue={defaultVal}
        style={{ ...inp, width: 70, textAlign: 'center' }}
      />
      <span style={{ fontSize: 13, color: '#6B7280' }}>{suffix}</span>
    </div>
  </div>
);

const TabAcademique: React.FC = () => {
  const [weights, setWeights] = useState<Weights>({
    participation: 20, compo1: 20, compo2: 20, examen: 40,
  });

  const total = weights.participation + weights.compo1 + weights.compo2 + weights.examen;
  const isOk  = total === 100;

  const set = (k: keyof Weights) => (v: number) =>
    setWeights((prev) => ({ ...prev, [k]: v }));

  return (
    <div>
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
          Poids des évaluations par trimestre
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
          Total doit être égal à 100%
        </div>

        <SliderRow lbl="Participation continue" value={weights.participation} max={60} onChange={set('participation')} />
        <SliderRow lbl="Composition 1"          value={weights.compo1}        max={60} onChange={set('compo1')}        />
        <SliderRow lbl="Composition 2"          value={weights.compo2}        max={60} onChange={set('compo2')}        />
        <SliderRow lbl="Examen final"            value={weights.examen}        max={80} onChange={set('examen')}        />

        <div
          style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 10,
            background: isOk ? '#E6FAF5' : '#FFE8EA',
            fontSize: 13, fontWeight: 700,
            color: isOk ? '#065F46' : '#991B1B',
          }}
        >
          {isOk ? `✅ Total : 100%` : `⚠️ Total : ${total}% — doit être 100%`}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
          Seuils de passage par niveau
        </div>
        <ThresholdRow lbl="Primaire (sur 10)"    defaultVal="5"  suffix="/10" />
        <ThresholdRow lbl="Collège (sur 20)"     defaultVal="10" suffix="/20" />
        <ThresholdRow lbl="Lycée (sur 20)"       defaultVal="10" suffix="/20" />
      </div>

      <SaveBtn />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Notifications
// ═══════════════════════════════════════════════════════════════════════════════

interface NotifDef {
  icon: string;
  title: string;
  desc: string;
  defaultOn: boolean;
}

const NOTIFS: NotifDef[] = [
  { icon: '📊', title: 'Note publiée',                  desc: 'Notification parent + élève',       defaultOn: true  },
  { icon: '📅', title: 'Absence marquée',               desc: 'Notification parent immédiate',     defaultOn: true  },
  { icon: '📋', title: 'Nouveau devoir publié',         desc: 'Notification élève',                defaultOn: true  },
  { icon: '📄', title: 'Bulletin disponible',           desc: 'Notification parent + élève',       defaultOn: true  },
  { icon: '⚠️', title: 'Moyenne sous le seuil',         desc: 'Alerte parent + admin',             defaultOn: true  },
  { icon: '📢', title: 'Nouvelle annonce',              desc: 'Tous les utilisateurs',             defaultOn: true  },
  { icon: '💬', title: 'Nouveau message',               desc: 'Destinataire',                      defaultOn: true  },
  { icon: '💰', title: 'Rappel de paiement',           desc: 'Parent',                            defaultOn: false },
  { icon: '🏫', title: 'Événement scolaire (veille)',   desc: 'Tous',                              defaultOn: true  },
];

const TabNotifications: React.FC = () => {
  const [states, setStates] = useState<boolean[]>(NOTIFS.map((n) => n.defaultOn));

  return (
    <div style={card}>
      {NOTIFS.map((n, i) => (
        <div
          key={i}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0',
            borderBottom: i < NOTIFS.length - 1 ? '1px solid #F3F4F6' : 'none',
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{n.desc}</div>
            </div>
          </div>
          <Switch
            checked={states[i]}
            onChange={(v) => setStates((prev) => prev.map((s, j) => j === i ? v : s))}
          />
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Sécurité
// ═══════════════════════════════════════════════════════════════════════════════

const th: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px',
  borderBottom: '1px solid #F3F4F6', background: '#F9FAFB', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '11px 14px', fontSize: 13, color: '#374151',
  borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap',
};

const SESSIONS = [
  { user: 'Admin',          role: 'Administrateur', device: 'Chrome / Windows',       last: 'Maintenant'     },
  { user: 'Mme. Saadi',     role: 'Enseignant',     device: 'Safari / iPhone',         last: 'il y a 12 min'  },
  { user: 'M. Bouzid',      role: 'Enseignant',     device: 'Firefox / Linux',         last: 'il y a 1h'      },
  { user: 'Mme. Benali',    role: 'Parent',         device: 'Chrome / Android',        last: 'il y a 2h'      },
  { user: 'M. Zerrouk',     role: 'Parent',         device: 'Edge / Windows',          last: 'Hier 18:34'     },
];

const PASSWORD_POLICIES = [
  { title: "Changer le mot de passe à la première connexion", default: true  },
  { title: "Blocage après 5 tentatives échouées",             default: true  },
  { title: "Expiration des sessions après 30 jours",          default: true  },
];

const AUDIT_LOG = [
  { icon: '📊', text: "Admin a publié les notes de 4ème A",         time: 'il y a 5 min',  badge: 'Notes'     },
  { icon: '👤', text: "Admin a inscrit un nouvel élève",            time: 'il y a 22 min', badge: 'Élèves'    },
  { icon: '📢', text: "Admin a envoyé une annonce aux parents",      time: 'il y a 1h',     badge: 'Annonces'  },
  { icon: '💰', text: "Admin a enregistré un paiement de 52,000 DZD",time: 'il y a 2h',    badge: 'Finances'  },
  { icon: '🔒', text: "Admin a réinitialisé le mot de passe de M. Bouzid", time: 'Hier',   badge: 'Sécurité'  },
];

const TabSecurite: React.FC = () => {
  const [policies, setPolicies] = useState(PASSWORD_POLICIES.map((p) => p.default));

  return (
    <div>
      {/* Sessions table */}
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
          Gestion des sessions actives
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Utilisateur', 'Rôle', 'Appareil', 'Dernière connexion', 'Actions'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SESSIONS.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={s.user} size={28} colorIndex={i} />
                      <span style={{ fontWeight: 600 }}>{s.user}</span>
                    </div>
                  </td>
                  <td style={td}>{s.role}</td>
                  <td style={{ ...td, fontSize: 12, color: '#6B7280' }}>{s.device}</td>
                  <td style={{ ...td, fontSize: 12, color: i === 0 ? '#00C48C' : '#6B7280', fontWeight: i === 0 ? 700 : 400 }}>{s.last}</td>
                  <td style={td}>
                    {i !== 0 && <SmOutlineBtn label="Révoquer" danger />}
                    {i === 0 && <span style={{ fontSize: 12, color: '#00C48C', fontWeight: 700 }}>Session actuelle</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password policies */}
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
          Politique de mots de passe
        </div>
        {PASSWORD_POLICIES.map((p, i) => (
          <div
            key={i}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0',
              borderBottom: i < PASSWORD_POLICIES.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            <span style={{ fontSize: 13, color: '#374151' }}>{p.title}</span>
            <Switch
              checked={policies[i]}
              onChange={(v) => setPolicies((prev) => prev.map((s, j) => j === i ? v : s))}
            />
          </div>
        ))}
      </div>

      {/* Audit log */}
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
          Journal d'audit (dernières actions)
        </div>
        {AUDIT_LOG.map((entry, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < AUDIT_LOG.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: 10, background: '#E8F0FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
              }}
            >
              {entry.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{entry.text}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{entry.time}</div>
            </div>
            <Badge label={entry.badge} color="blue" />
          </div>
        ))}
        <button
          style={{
            marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#1A6BFF', fontFamily: 'var(--font)', padding: 0,
          }}
        >
          Voir le journal complet →
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

const SettingsPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <PageHeader title="Paramètres de l'École" />

    <Tabs
      defaultActiveKey="profil"
      size="large"
      items={[
        { key: 'profil',       label: "🏫 Profil de l'École",         children: <TabProfil />        },
        { key: 'academique',   label: '📚 Config. Académique',         children: <TabAcademique />    },
        { key: 'notifs',       label: '🔔 Notifications',              children: <TabNotifications /> },
        { key: 'securite',     label: '🔒 Sécurité',                   children: <TabSecurite />      },
      ]}
    />
  </div>
);

export default SettingsPage;
