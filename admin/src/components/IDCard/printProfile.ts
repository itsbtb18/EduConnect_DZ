/* ══════════════════════════════════════════════════════════════════════
   ILMI — Print Profile Utility
   
   Opens a print dialog with a 2-page A4 layout:
     Page 1 → Student/Teacher info + ID card + QR code
     Page 2 → Grades summary table
   ══════════════════════════════════════════════════════════════════════ */

import type { StudentFullProfile } from '../../types/student-profile';

/** Format helpers */
function fmtDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function num(v?: string | number | null): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

/** Section color for the header banner */
function sectionColor(section?: string): string {
  if (!section) return '#0EA5E9';
  const s = section.toLowerCase();
  if (s.includes('primaire') || s.includes('primary')) return '#10b981';
  if (s.includes('moyen') || s.includes('cem') || s.includes('middle')) return '#f59e0b';
  if (s.includes('lycée') || s.includes('lycee') || s.includes('high')) return '#ef4444';
  return '#0EA5E9';
}

interface PrintProfileOptions {
  profile: StudentFullProfile;
  schoolName?: string;
  schoolLogo?: string;
  schoolPhone?: string;
  qrCodeBase64?: string | null;
}

/**
 * printStudentProfile
 * Builds a full A4 printable document in a child window and triggers `window.print()`.
 */
export function printStudentProfile(opts: PrintProfileOptions): void {
  const { profile, schoolName, schoolLogo, schoolPhone, qrCodeBase64 } = opts;
  const identity = profile.identity;
  const cls = profile.academic_info.current_class;
  const section = cls?.section ?? '';
  const color = sectionColor(section);

  /* ── Grades table rows ── */
  const gradesHistory = profile.grades_history;
  let gradesRows = '';

  /* Build rows from subject_averages grouped by trimester */
  const subjectsByTrimester = new Map<number, typeof gradesHistory.subject_averages>();
  (gradesHistory.subject_averages ?? []).forEach(sa => {
    if (!subjectsByTrimester.has(sa.trimester)) subjectsByTrimester.set(sa.trimester, []);
    subjectsByTrimester.get(sa.trimester)!.push(sa);
  });

  subjectsByTrimester.forEach((subjects, trimNum) => {
    const tLabel = `Trimestre ${trimNum}`;
    subjects.forEach((subj, idx) => {
      gradesRows += `
        <tr>
          ${idx === 0 ? `<td rowspan="${subjects.length}" style="font-weight:600;vertical-align:middle">${tLabel}</td>` : ''}
          <td>${subj.subject ?? ''}</td>
          <td style="text-align:center">—</td>
          <td style="text-align:center;font-weight:600">${num(subj.average).toFixed(2)}</td>
          <td style="text-align:center">—</td>
        </tr>`;
    });
    /* Trimester average row */
    const trimAvg = (gradesHistory.trimester_averages ?? []).find(ta => ta.trimester === trimNum);
    if (trimAvg) {
      gradesRows += `
        <tr style="background:#f0f4f8;font-weight:700">
          <td colspan="3" style="text-align:right">Moyenne du ${tLabel}</td>
          <td style="text-align:center">${num(trimAvg.average).toFixed(2)}</td>
          <td style="text-align:center">${trimAvg.rank_in_class ?? '—'}</td>
        </tr>`;
    }
  });

  /* ── Parents summary ── */
  const parentsList = (profile.parents ?? [])
    .map(p => `<li><strong>${p.full_name}</strong> — ${p.relationship} — ${p.phone_number || '—'}</li>`)
    .join('');

  /* ── Payment summary ── */
  const paymentItems = (profile.payment_info?.recent_payments ?? [])
    .map(p => `<li>${p.payment_type}: <strong>${p.amount_paid} DA</strong> (${p.status})</li>`)
    .join('');

  /* ── Build HTML ── */
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Profil — ${identity.full_name}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Inter', sans-serif; font-size: 11px; color: #1a1a2e; line-height: 1.5; }
  
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  /* ─── Page 1: Profile ─── */
  .header-banner {
    background: ${color};
    color: #fff;
    padding: 14px 18px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }
  .header-banner img.school-logo {
    width: 40px; height: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,.4);
  }
  .header-banner .school-name { font-size: 16px; font-weight: 700; letter-spacing: .5px; }
  .header-banner .sub { font-size: 10px; opacity: .85; }

  .profile-grid { display: flex; gap: 16px; margin-bottom: 16px; }
  .profile-photo {
    width: 90px; height: 110px; border-radius: 10px; overflow: hidden;
    border: 2px solid #e2e8f0; background: #f8fafc; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .profile-photo img { width: 100%; height: 100%; object-fit: cover; }
  .profile-photo .initials { font-size: 28px; font-weight: 700; color: #94a3b8; }
  
  .info-table { width: 100%; border-collapse: collapse; }
  .info-table td { padding: 3px 8px; }
  .info-table td:first-child { font-weight: 600; color: #475569; width: 120px; }

  .section-title { font-size: 13px; font-weight: 700; color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 3px; margin: 14px 0 8px; }

  .qr-section { display: flex; align-items: center; gap: 16px; margin-top: 12px; }
  .qr-section img { width: 100px; height: 100px; border: 1px solid #e2e8f0; border-radius: 6px; }

  /* ─── Page 2: Grades ─── */
  .grades-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .grades-table th {
    background: ${color}; color: #fff; padding: 6px 8px; font-size: 10px;
    text-align: left; text-transform: uppercase; letter-spacing: .5px;
  }
  .grades-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
  .grades-table tr:nth-child(even) { background: #f8fafc; }

  ul { list-style: disc inside; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
  <!-- ════ PAGE 1 ════ -->
  <div class="page">
    <div class="header-banner">
      ${schoolLogo ? `<img src="${schoolLogo}" class="school-logo" alt=""/>` : ''}
      <div>
        <div class="school-name">${schoolName ?? 'ILMI'}</div>
        <div class="sub">Fiche de profil élève — ${cls?.academic_year ?? ''}</div>
      </div>
    </div>

    <div class="profile-grid">
      <div class="profile-photo">
        ${identity.photo
          ? `<img src="${identity.photo}" alt="${identity.full_name}"/>`
          : `<span class="initials">${(identity.first_name?.[0] ?? '') + (identity.last_name?.[0] ?? '')}</span>`}
      </div>
      <table class="info-table">
        <tr><td>Nom complet</td><td>${identity.full_name}</td></tr>
        <tr><td>N° Élève</td><td>${identity.student_id ?? '—'}</td></tr>
        <tr><td>Date naissance</td><td>${fmtDate(identity.date_of_birth)}</td></tr>
        <tr><td>Classe</td><td>${cls?.name ?? '—'}</td></tr>
        <tr><td>Section</td><td>${section || '—'}</td></tr>
        <tr><td>Filière</td><td>${cls?.stream ?? '—'}</td></tr>
        <tr><td>Téléphone</td><td>${identity.phone_number ?? '—'}</td></tr>
        <tr><td>Email</td><td>${identity.email ?? '—'}</td></tr>
        <tr><td>Inscrit le</td><td>${fmtDate(identity.enrollment_date)}</td></tr>
        <tr><td>Statut</td><td>${identity.is_active ? 'Actif' : 'Inactif'}</td></tr>
      </table>
    </div>

    ${parentsList ? `
    <div class="section-title">Parents / Tuteurs</div>
    <ul>${parentsList}</ul>` : ''}

    ${paymentItems ? `
    <div class="section-title">Paiements</div>
    <ul>${paymentItems}</ul>` : ''}

    ${qrCodeBase64 ? `
    <div class="section-title">Carte Étudiant & QR Code</div>
    <div class="qr-section">
      <img src="${qrCodeBase64}" alt="QR Code"/>
      <div>
        <strong>${identity.full_name}</strong><br/>
        N° : ${identity.student_id ?? '—'}<br/>
        Classe : ${cls?.name ?? '—'}<br/>
        ${schoolPhone ? `Contact : ${schoolPhone}` : ''}
      </div>
    </div>` : ''}
  </div>

  <!-- ════ PAGE 2 ════ -->
  <div class="page">
    <div class="header-banner" style="margin-bottom:12px">
      ${schoolLogo ? `<img src="${schoolLogo}" class="school-logo" alt=""/>` : ''}
      <div>
        <div class="school-name">${schoolName ?? 'ILMI'}</div>
        <div class="sub">Relevé de notes — ${identity.full_name} — ${cls?.academic_year ?? ''}</div>
      </div>
    </div>

    <table class="grades-table">
      <thead>
        <tr>
          <th>Trimestre</th>
          <th>Matière</th>
          <th>Coeff.</th>
          <th>Moyenne</th>
          <th>Rang</th>
        </tr>
      </thead>
      <tbody>
        ${gradesRows || '<tr><td colspan="5" style="text-align:center;padding:20px">Aucune note disponible</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  /* ── Open print window ── */
  const win = window.open('', '_blank', 'width=800,height=1100');
  if (!win) {
    alert('Veuillez autoriser les popups pour imprimer.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}
