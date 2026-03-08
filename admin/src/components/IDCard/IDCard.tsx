/* ══════════════════════════════════════════════════════════════════════
   ILMI — School ID Card Component
   Renders a credit-card-sized (85.6mm × 54mm) school ID card
   for students and teachers, with PDF / PNG export.
   ══════════════════════════════════════════════════════════════════════ */
import React, { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Printer, Download, Loader2 } from 'lucide-react';

import './IDCard.css';

/* ─────────────── Types ─────────────── */

export interface IDCardSchoolInfo {
  name: string;
  logo?: string | null;
  address?: string;
  phone?: string;
  academic_year?: string;
}

export interface IDCardStudentData {
  id: string;
  full_name: string;
  photo?: string | null;
  date_of_birth?: string | null;
  student_id?: string;
  class_name?: string;
  section?: string;
  stream?: string;
  qr_code_base64?: string | null;
}

export interface IDCardTeacherData {
  id: string;
  full_name: string;
  photo?: string | null;
  employee_id?: string;
  hire_date?: string | null;
  subjects?: { name: string; section?: string }[];
  qr_code_base64?: string | null;
}

export interface IDCardProps {
  type: 'student' | 'teacher';
  data: IDCardStudentData | IDCardTeacherData;
  schoolInfo: IDCardSchoolInfo;
  /** Hide action buttons (for print-only rendering) */
  hideActions?: boolean;
}

/* ─────────────── Helpers ─────────────── */

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

function validityDate(): string {
  const now = new Date();
  const y = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  return `30/06/${y}`;
}

/** Section stripe colour */
function sectionColor(section?: string): string {
  if (!section) return '#0EA5E9';
  const s = section.toLowerCase();
  if (s.includes('primaire') || s.includes('primary')) return '#10b981';
  if (s.includes('moyen') || s.includes('cem') || s.includes('middle')) return '#f59e0b';
  if (s.includes('lycée') || s.includes('lycee') || s.includes('high')) return '#ef4444';
  return '#0EA5E9';
}

/* ═══════════════════════════════════════════════════════════════════════
   CARD RENDER
   ═══════════════════════════════════════════════════════════════════════ */

const IDCard: React.FC<IDCardProps> = ({ type, data, schoolInfo, hideActions }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = React.useState(false);

  const acYear = schoolInfo.academic_year || currentAcademicYear();
  const isStudent = type === 'student';
  const stu = isStudent ? (data as IDCardStudentData) : null;
  const tch = !isStudent ? (data as IDCardTeacherData) : null;

  const bannerColor = isStudent
    ? sectionColor(stu?.section)
    : '#1e3a5f'; // navy for teachers

  /* ─── Export handlers ─── */

  const captureCard = useCallback(async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  }, []);

  const handlePrintPDF = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      pdf.save(`carte-${type}-${data.full_name.replace(/\s/g, '_')}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [captureCard, type, data.full_name]);

  const handleDownloadPNG = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `carte-${type}-${data.full_name.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  }, [captureCard, type, data.full_name]);

  /* ─── Initials fallback ─── */
  const initials = data.full_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="idcard-wrapper">
      {/* ════ The actual card (captured for export) ════ */}
      <div className="idcard" ref={cardRef} id="id-card-preview">
        {/* ── Top banner ── */}
        <div className="idcard__banner" style={{ background: bannerColor }}>
          <div className="idcard__banner-left">
            {schoolInfo.logo ? (
              <img src={schoolInfo.logo} alt="" className="idcard__school-logo" />
            ) : (
              <div className="idcard__school-logo-placeholder">
                {schoolInfo.name.charAt(0)}
              </div>
            )}
            <div className="idcard__school-text">
              <span className="idcard__school-name">{schoolInfo.name}</span>
              <span className="idcard__school-sub">
                {isStudent
                  ? `École Privée${schoolInfo.address ? ` — ${schoolInfo.address}` : ''}`
                  : 'Personnel Enseignant'}
              </span>
            </div>
          </div>
          <span className="idcard__year">{acYear}</span>
        </div>

        {/* ── Body ── */}
        <div className="idcard__body">
          {/* Left: Photo + info */}
          <div className="idcard__info">
            <div className="idcard__photo">
              {data.photo ? (
                <img src={data.photo} alt={data.full_name} />
              ) : (
                <span className="idcard__photo-initials">{initials}</span>
              )}
            </div>

            <div className="idcard__details">
              <span className="idcard__name">{data.full_name}</span>

              {isStudent && stu && (
                <>
                  {stu.date_of_birth && (
                    <span className="idcard__line">Né(e) le {fmtDate(stu.date_of_birth)}</span>
                  )}
                  {stu.student_id && (
                    <span className="idcard__line">N° : {stu.student_id}</span>
                  )}
                  {stu.class_name && (
                    <span className="idcard__line">Classe : {stu.class_name}</span>
                  )}
                  {stu.section && (
                    <span className="idcard__line">Section : {stu.section}</span>
                  )}
                  {stu.stream && (
                    <span className="idcard__line">Filière : {stu.stream}</span>
                  )}
                </>
              )}

              {!isStudent && tch && (
                <>
                  {tch.employee_id && (
                    <span className="idcard__line">N° : {tch.employee_id}</span>
                  )}
                  {tch.hire_date && (
                    <span className="idcard__line">Recruté le : {fmtDate(tch.hire_date)}</span>
                  )}
                  {tch.subjects && tch.subjects.length > 0 && (
                    <div className="idcard__subjects">
                      <span className="idcard__line idcard__line--label">Matières :</span>
                      {tch.subjects.slice(0, 3).map((s, i) => (
                        <span key={i} className="idcard__line idcard__line--bullet">
                          • {s.name}{s.section ? ` (${s.section})` : ''}
                        </span>
                      ))}
                      {tch.subjects.length > 3 && (
                        <span className="idcard__line idcard__line--bullet idcard__line--muted">
                          +{tch.subjects.length - 3} autres
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: QR code */}
          <div className="idcard__qr-zone">
            {(isStudent ? stu?.qr_code_base64 : tch?.qr_code_base64) ? (
              <img
                src={(isStudent ? stu?.qr_code_base64 : tch?.qr_code_base64) as string}
                alt="QR Code"
                className="idcard__qr-img"
              />
            ) : (
              <div className="idcard__qr-placeholder">QR</div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="idcard__footer" style={{ borderTopColor: bannerColor }}>
          <span className="idcard__footer-validity">
            Valable jusqu'au : {validityDate()}
          </span>
          {isStudent && schoolInfo.phone && (
            <span className="idcard__footer-phone">
              En cas de perte, contacter : {schoolInfo.phone}
            </span>
          )}
        </div>
      </div>

      {/* ════ Action buttons ════ */}
      {!hideActions && (
        <div className="idcard-actions">
          <button
            className="idcard-actions__btn idcard-actions__btn--pdf"
            onClick={handlePrintPDF}
            disabled={exporting}
          >
            {exporting ? <Loader2 size={14} className="idcard-spin" /> : <Printer size={14} />}
            Imprimer PDF
          </button>
          <button
            className="idcard-actions__btn idcard-actions__btn--png"
            onClick={handleDownloadPNG}
            disabled={exporting}
          >
            {exporting ? <Loader2 size={14} className="idcard-spin" /> : <Download size={14} />}
            Télécharger PNG
          </button>
        </div>
      )}
    </div>
  );
};

export default IDCard;
