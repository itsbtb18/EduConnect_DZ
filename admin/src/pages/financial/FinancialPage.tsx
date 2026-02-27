import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import { payments } from '../../data/mockData';
import type { BadgeColor } from '../../types';

const statusMap: Record<string, { label: string; color: BadgeColor }> = {
  paid: { label: 'Payé', color: 'green' },
  partial: { label: 'Partiel', color: 'yellow' },
  pending: { label: 'En attente', color: 'orange' },
  overdue: { label: 'En retard', color: 'red' },
};

const FinancialPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = payments.filter(
    (p) =>
      (statusFilter === 'all' || p.status === statusFilter) &&
      p.studentName.toLowerCase().includes(search.toLowerCase()),
  );

  const collectionRates = [
    { label: '1ère AS', rate: 82 },
    { label: '2ème AS', rate: 76 },
    { label: '3ème AS', rate: 90 },
    { label: '4ème AM', rate: 65 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Gestion Financière"
        subtitle="Suivi des paiements et inscriptions"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn('outline')}>📤 Exporter</button>
            <button style={btn('primary')}>+ Ajouter un paiement</button>
          </div>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <StatCard label="Total prévu" value="4.2M DZD" sub="année 2025–2026" borderColor="#1A6BFF" />
        <StatCard label="Encaissé" value="3.1M DZD" sub="74% du total" borderColor="#00C48C" />
        <StatCard label="En attente" value="1.1M DZD" sub="26% restant" subColor="#FFB800" borderColor="#FFB800" />
        <StatCard label="Ce mois" value="280K DZD" sub="38 paiements" borderColor="#FF6B35" />
      </div>

      {/* Payment table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={h2}>Historique des paiements</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Chercher un étudiant…" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">Tous</option>
              <option value="paid">Payé</option>
              <option value="partial">Partiel</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        </div>

        <table style={tableGlobal}>
          <thead>
            <tr>
              {['Étudiant', 'Classe', 'Montant', 'Méthode', 'Date', 'Statut'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const st = statusMap[p.status];
              return (
                <tr key={p.id}>
                  <td style={tdStyle}>{p.studentName}</td>
                  <td style={tdStyle}>{p.className}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{(p.amount / 1000).toFixed(0)}K DZD</td>
                  <td style={tdStyle}>{p.method}</td>
                  <td style={tdStyle}>{p.date}</td>
                  <td style={tdStyle}><Badge label={st.label} color={st.color} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Collection rates */}
        <div className="card">
          <h2 style={{ ...h2, marginBottom: 14 }}>Taux de recouvrement par niveau</h2>
          {collectionRates.map((c) => (
            <div key={c.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.rate >= 80 ? '#00C48C' : '#FFB800' }}>{c.rate}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${c.rate}%`, background: c.rate >= 80 ? '#00C48C' : '#FFB800' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Next deadline */}
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'linear-gradient(135deg, #FF6B35 0%, #FFB800 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.9 }}>Prochaine échéance de paiement</div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0' }}>15 Mars 2026</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>2ème tranche — 38 élèves concernés</div>
          <button
            style={{
              marginTop: 14,
              padding: '8px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'rgba(255,255,255,0.25)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              width: 'fit-content',
              fontSize: 13,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Envoyer les rappels →
          </button>
        </div>
      </div>
    </div>
  );
};

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0 };
const tableGlobal: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #F3F4F6' };
const selectStyle: React.CSSProperties = { padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff' };

function btn(variant: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    default: return base;
  }
}

export default FinancialPage;
