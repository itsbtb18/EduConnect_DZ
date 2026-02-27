import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { payments } from '../../data/mockData';
import { Payment, BadgeColor } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('fr-DZ') + ' DZD';

const statusMap: Record<Payment['status'], { label: string; color: BadgeColor }> = {
  paid:    { label: '✓ Payé',  color: 'green'  },
  partial: { label: 'Partiel', color: 'yellow' },
  unpaid:  { label: 'Impayé',  color: 'red'    },
};

const collectColor = (rate: number) =>
  rate >= 80 ? '#00C48C' : rate >= 70 ? '#FFB800' : '#FF4757';

// ─── Mock recent payments for history table ───────────────────────────────────

const METHODS = ['CCP', 'BaridiMob', 'Espèces', 'Virement bancaire'];

const recentPayments = [
  { id: 'h1',  date: '27/02/2026', student: 'Ahmed Benali',    className: '1ère AS A', amount: 32000, method: 'BaridiMob',       receipt: 'REC-2026-0127' },
  { id: 'h2',  date: '26/02/2026', student: 'Imane Zerrouk',   className: '4ème A',   amount: 52000, method: 'Virement bancaire', receipt: 'REC-2026-0126' },
  { id: 'h3',  date: '25/02/2026', student: 'Amira Bensalah',  className: 'CM2 A',    amount: 38000, method: 'Espèces',           receipt: 'REC-2026-0125' },
  { id: 'h4',  date: '24/02/2026', student: 'Nesrine Belhadj', className: '1ère AS A', amount: 64000, method: 'CCP',              receipt: 'REC-2026-0124' },
  { id: 'h5',  date: '23/02/2026', student: 'Lina Meziane',    className: '5ème B',   amount: 52000, method: 'BaridiMob',       receipt: 'REC-2026-0123' },
  { id: 'h6',  date: '21/02/2026', student: 'Djihane Merbah',  className: '3ème B',   amount: 52000, method: 'CCP',              receipt: 'REC-2026-0122' },
  { id: 'h7',  date: '20/02/2026', student: 'Soumia Ferhat',   className: 'CE1 B',    amount: 30000, method: 'Espèces',           receipt: 'REC-2026-0121' },
  { id: 'h8',  date: '18/02/2026', student: 'Sara Hamid',      className: '1ère AS A', amount: 32000, method: 'BaridiMob',       receipt: 'REC-2026-0120' },
  { id: 'h9',  date: '17/02/2026', student: 'Rayan Bouab',     className: '4ème A',   amount: 26000, method: 'CCP',              receipt: 'REC-2026-0119' },
  { id: 'h10', date: '15/02/2026', student: 'Yassine Charef',  className: 'CM2 A',    amount: 19000, method: 'Espèces',           receipt: 'REC-2026-0118' },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const th: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid #F3F4F6',
  background: '#F9FAFB',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
};

// ─── Buttons ─────────────────────────────────────────────────────────────────

const HdrBtn: React.FC<{ label: string; primary?: boolean; onClick?: () => void }> = ({ label, primary, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        fontFamily: 'var(--font)', cursor: 'pointer', transition: 'background 0.15s',
        background: primary ? (hov ? '#1558d6' : '#1A6BFF') : (hov ? '#F3F4F6' : 'white'),
        border: primary ? 'none' : '1.5px solid #D1D5DB',
        color: primary ? 'white' : '#374151',
      }}
    >
      {label}
    </button>
  );
};

const OutlineBtn: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        padding: '5px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        fontFamily: 'var(--font)', cursor: 'pointer', transition: 'background 0.15s',
        background: hov ? '#E8F0FF' : 'white',
        border: '1.5px solid #1A6BFF',
        color: '#1A6BFF',
      }}
    >
      {label}
    </button>
  );
};

const GhostBtn: React.FC<{ label: string }> = ({ label }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: hov ? '#1558d6' : '#1A6BFF',
        fontFamily: 'var(--font)', padding: '0 2px',
      }}
    >
      {label}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FinancialPage: React.FC = () => {
  const [reminderHov, setReminderHov] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <PageHeader
        title="Gestion Financière"
        subtitle="2025/2026 — Suivi des paiements de scolarité"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <HdrBtn label="📊 Rapports" />
            <HdrBtn label="+ Enregistrer un paiement" primary />
          </div>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="TOTAL PRÉVU"  value="4.2M" sub="DZD / année"    subColor="#1A6BFF" borderColor="#1A6BFF" />
        <StatCard label="ENCAISSÉ"     value="3.1M" sub="74% collecté"   subColor="#00C48C" borderColor="#00C48C" />
        <StatCard label="EN ATTENTE"   value="1.1M" sub="26% restant"    subColor="#FF4757" borderColor="#FF4757" />
        <StatCard label="CE MOIS-CI"   value="280K" sub="DZD encaissé"   subColor="#FFB800" borderColor="#FFB800" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left — payments table */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
              Statut des paiements par élève
            </span>
            <OutlineBtn label="Envoyer les rappels" />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Élève', 'Classe', 'Frais total', 'Payé', 'Solde', 'Statut'].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.studentName} size={30} colorIndex={i} />
                        <span style={{ fontWeight: 600, color: '#1F2937' }}>{p.studentName}</span>
                      </div>
                    </td>
                    <td style={td}>{p.className}</td>
                    <td style={td}>
                      <span style={{ fontWeight: 700, color: '#374151' }}>{fmt(p.totalFee)}</span>
                    </td>
                    <td style={td}>
                      <span style={{ fontWeight: 700, color: '#00C48C' }}>{fmt(p.paid)}</span>
                    </td>
                    <td style={td}>
                      {p.balance === 0
                        ? <span style={{ color: '#9CA3AF' }}>0 DZD</span>
                        : <span style={{ fontWeight: 700, color: '#FF4757' }}>{fmt(p.balance)}</span>
                      }
                    </td>
                    <td style={td}>
                      <Badge label={statusMap[p.status].label} color={statusMap[p.status].color} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Card A — collection rate by level */}
          <div style={card}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
              Taux de collecte par niveau
            </div>

            {[
              { level: 'Lycée',    rate: 81 },
              { level: 'Collège',  rate: 74 },
              { level: 'Primaire', rate: 69 },
            ].map(({ level, rate }) => (
              <div key={level} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{level}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: collectColor(rate) }}>{rate}%</span>
                </div>
                <ProgressBar value={rate} color={collectColor(rate)} />
              </div>
            ))}
          </div>

          {/* Card B — gradient deadline card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1A6BFF, #3B82F6)',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              PROCHAINE ÉCHÉANCE DE PAIEMENT
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 }}>
              10 Mars 2026
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              47 élèves avec solde impayé
            </div>
            <button
              onMouseEnter={() => setReminderHov(true)}
              onMouseLeave={() => setReminderHov(false)}
              style={{
                width: '100%',
                background: reminderHov ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.20)',
                color: 'white',
                border: 'none',
                padding: 10,
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font)',
                transition: 'background 0.15s',
              }}
            >
              📧 Envoyer tous les rappels
            </button>
          </div>
        </div>
      </div>

      {/* Bottom — payment history */}
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
          Historique des paiements — Février 2026
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Élève', 'Classe', 'Montant', 'Méthode', 'Reçu', 'Action'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <td style={{ ...td, fontSize: 12, color: '#6B7280' }}>{r.date}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={r.student} size={28} colorIndex={i} />
                      <span style={{ fontWeight: 600, color: '#1F2937' }}>{r.student}</span>
                    </div>
                  </td>
                  <td style={td}>{r.className}</td>
                  <td style={td}>
                    <span style={{ fontWeight: 700, color: '#00C48C' }}>{fmt(r.amount)}</span>
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        background: '#F3F4F6', borderRadius: 6,
                        padding: '2px 8px', fontSize: 12, color: '#374151',
                      }}
                    >
                      {r.method}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: 12, fontFamily: 'monospace', color: '#6B7280' }}>
                    {r.receipt}
                  </td>
                  <td style={td}>
                    <OutlineBtn label="📄 Reçu" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialPage;
