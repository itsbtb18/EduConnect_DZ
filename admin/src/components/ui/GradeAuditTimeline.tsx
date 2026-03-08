/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  GradeAuditTimeline — Drawer timeline of all grade audit events    ║
 * ║                                                                    ║
 * ║  Usage:                                                            ║
 * ║  <GradeAuditTimeline                                               ║
 * ║    open={drawerOpen}                                               ║
 * ║    onClose={() => setDrawerOpen(false)}                            ║
 * ║    studentId="uuid"                                                ║
 * ║    studentName="Ahmed Benali"                                      ║
 * ║    subjectName="Maths"  (optional pre-filter label)                ║
 * ║    trimester={1}        (optional pre-filter)                      ║
 * ║  />                                                                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import React, { useMemo, useState } from 'react';
import { Drawer, Select, Spin, Tag, Empty } from 'antd';
import {
  AuditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useGradeAuditLog } from '../../hooks/useApi';
import './GradeAuditTimeline.css';

/* ─── Types ─── */
export interface AuditEntry {
  id: string;
  action: string;
  action_label: string;
  performed_by: string | null;
  performed_by_name: string;
  old_value: string | null;
  new_value: string | null;
  reason: string;
  subject_name: string;
  exam_name: string;
  trimester: number | null;
  ip_address: string | null;
  created_at: string;
}

export interface GradeAuditTimelineProps {
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  studentName?: string;
  subjectName?: string;
  trimester?: number | null;
}

/* ─── Color mapping ─── */
const ACTION_COLORS: Record<string, { dot: string; tag: string }> = {
  GRADE_ENTERED:       { dot: 'green',  tag: 'green' },
  GRADE_CORRECTED:     { dot: 'yellow', tag: 'orange' },
  GRADE_PUBLISHED:     { dot: 'blue',   tag: 'blue' },
  AVERAGE_CALCULATED:  { dot: 'blue',   tag: 'cyan' },
  AVERAGE_OVERRIDDEN:  { dot: 'orange', tag: 'volcano' },
  AVERAGE_PUBLISHED:   { dot: 'blue',   tag: 'geekblue' },
  TRIMESTER_LOCKED:    { dot: 'purple', tag: 'purple' },
  TRIMESTER_UNLOCKED:  { dot: 'purple', tag: 'magenta' },
  APPEAL_CREATED:      { dot: 'yellow', tag: 'gold' },
  APPEAL_ACCEPTED:     { dot: 'green',  tag: 'green' },
  APPEAL_REJECTED:     { dot: 'red',    tag: 'red' },
};

const ACTION_EMOJI: Record<string, string> = {
  GRADE_ENTERED: '',
  GRADE_CORRECTED: '',
  GRADE_PUBLISHED: '',
  AVERAGE_CALCULATED: '',
  AVERAGE_OVERRIDDEN: '',
  AVERAGE_PUBLISHED: '',
  TRIMESTER_LOCKED: '',
  TRIMESTER_UNLOCKED: '',
  APPEAL_CREATED: '',
  APPEAL_ACCEPTED: '',
  APPEAL_REJECTED: '',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* ─── Component ─── */
const GradeAuditTimeline: React.FC<GradeAuditTimelineProps> = ({
  open,
  onClose,
  studentId,
  studentName,
  subjectName,
  trimester: defaultTrimester,
}) => {
  const [trimesterFilter, setTrimesterFilter] = useState<number | null>(
    defaultTrimester ?? null,
  );
  const [actionFilter, setActionFilter] = useState<string | null>(null);

  const params = useMemo(() => {
    const p: Record<string, unknown> = {};
    if (studentId) p.student_id = studentId;
    if (trimesterFilter) p.trimester = trimesterFilter;
    if (actionFilter) p.action = actionFilter;
    return p;
  }, [studentId, trimesterFilter, actionFilter]);

  const { data: entries = [], isLoading } = useGradeAuditLog(
    studentId ? params : undefined,
  );

  const title = [
    'Historique',
    studentName && `— ${studentName}`,
    subjectName && `— ${subjectName}`,
    trimesterFilter && `T${trimesterFilter}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Drawer
      title={title}
      placement="right"
      width={460}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {/* Header */}
      <div className="audit-timeline__header">
        <div className="audit-timeline__header-icon">
          <AuditOutlined />
        </div>
        <div className="audit-timeline__header-text">
          <h3>{studentName || 'Élève'}</h3>
          <p>
            {(entries as AuditEntry[]).length} événement{(entries as AuditEntry[]).length !== 1 ? 's' : ''} enregistré{(entries as AuditEntry[]).length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="audit-timeline__filters">
        <Select
          allowClear
          placeholder="Trimestre"
          value={trimesterFilter}
          onChange={(v) => setTrimesterFilter(v ?? null)}
          style={{ width: 120 }}
          options={[
            { value: 1, label: 'T1' },
            { value: 2, label: 'T2' },
            { value: 3, label: 'T3' },
          ]}
        />
        <Select
          allowClear
          placeholder="Action"
          value={actionFilter}
          onChange={(v) => setActionFilter(v ?? null)}
          style={{ flex: 1 }}
          options={[
            { value: 'GRADE_ENTERED', label: 'Note saisie' },
            { value: 'GRADE_CORRECTED', label: 'Note corrigée' },
            { value: 'GRADE_PUBLISHED', label: 'Notes publiées' },
            { value: 'AVERAGE_CALCULATED', label: 'Moyenne calculée' },
            { value: 'AVERAGE_OVERRIDDEN', label: 'Moyenne modifiée' },
            { value: 'AVERAGE_PUBLISHED', label: 'Moyenne publiée' },
            { value: 'TRIMESTER_LOCKED', label: 'Verrouillé' },
            { value: 'TRIMESTER_UNLOCKED', label: 'Déverrouillé' },
            { value: 'APPEAL_CREATED', label: 'Recours créé' },
            { value: 'APPEAL_ACCEPTED', label: 'Recours accepté' },
            { value: 'APPEAL_REJECTED', label: 'Recours rejeté' },
          ]}
        />
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="audit-timeline__empty">
          <Spin size="large" />
        </div>
      ) : (entries as AuditEntry[]).length === 0 ? (
        <div className="audit-timeline__empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Aucun événement trouvé"
          />
        </div>
      ) : (
        <div className="audit-timeline">
          {(entries as AuditEntry[]).map((entry) => {
            const colors = ACTION_COLORS[entry.action] || { dot: '', tag: 'default' };
            const emoji = ACTION_EMOJI[entry.action] || '';

            return (
              <div className="audit-item" key={entry.id}>
                {/* dot */}
                <span className={`audit-item__dot audit-item__dot--${colors.dot}`} />

                {/* date */}
                <div className="audit-item__date">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {formatDate(entry.created_at)}
                </div>

                {/* action */}
                <div className="audit-item__action">
                  {emoji}{' '}
                  <Tag color={colors.tag} style={{ marginLeft: 4 }}>
                    {entry.action_label}
                  </Tag>
                </div>

                {/* actor */}
                <div className="audit-item__actor">
                  {entry.performed_by_name}
                  {entry.exam_name ? ` — ${entry.exam_name}` : ''}
                  {entry.subject_name ? ` (${entry.subject_name})` : ''}
                </div>

                {/* values */}
                {(entry.old_value != null || entry.new_value != null) && (
                  <div className="audit-item__detail">
                    <span className="audit-item__values">
                      {entry.old_value != null && (
                        <span className="audit-item__old-val">{entry.old_value}</span>
                      )}
                      {entry.old_value != null && entry.new_value != null && (
                        <span className="audit-item__arrow">→</span>
                      )}
                      {entry.new_value != null && (
                        <span className="audit-item__new-val">{entry.new_value}/20</span>
                      )}
                    </span>
                  </div>
                )}

                {/* reason */}
                {entry.reason && (
                  <div className="audit-item__reason">
                    « {entry.reason} »
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

export default GradeAuditTimeline;
