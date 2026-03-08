/**
 * AppealsTab — list and manage grade appeals/recourses.
 * Filter by status and type, accept/reject with corrected value.
 */
import React, { useState } from 'react';
import { Select, Empty, Badge, Space, Tag, Spin } from 'antd';
import type { GradeFilters, GradeAppeal, AppealRespondPayload, AppealStatus, AppealType } from '../../../types/grades';
import AppealCard from '../components/AppealCard';
import {
  useGradeAppeals, useRespondAppeal, usePendingAppealsCount,
} from '../../../hooks/useApi';

interface AppealsTabProps {
  filters: GradeFilters;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'UNDER_REVIEW', label: 'En cours d\'examen' },
  { value: 'ACCEPTED', label: 'Accepté' },
  { value: 'REJECTED', label: 'Rejeté' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'EXAM_GRADE', label: 'Note d\'examen' },
  { value: 'SUBJECT_AVERAGE', label: 'Moyenne matière' },
  { value: 'TRIMESTER_AVERAGE', label: 'Moyenne trimestre' },
];

const AppealsTab: React.FC<AppealsTabProps> = ({ filters }) => {
  const { classroomId, trimester } = filters;

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Build query params
  const params: Record<string, unknown> = {};
  if (classroomId) params.classroom_id = classroomId;
  if (trimester) params.trimester = trimester;
  if (statusFilter) params.status = statusFilter;
  if (typeFilter) params.appeal_type = typeFilter;

  const { data: appealsData, isLoading } = useGradeAppeals(
    Object.keys(params).length > 0 ? params : undefined,
  );
  const appeals: GradeAppeal[] = (appealsData?.results || []) as GradeAppeal[];

  const { data: pendingCount } = usePendingAppealsCount();

  const respondAppeal = useRespondAppeal();

  const handleRespond = (id: string, payload: AppealRespondPayload) => {
    respondAppeal.mutate({ id, data: { ...payload } as Record<string, unknown> });
  };

  // Group by status for summary
  const pending = appeals.filter(a => a.status === 'PENDING' || a.status === 'UNDER_REVIEW');
  const resolved = appeals.filter(a => a.status === 'ACCEPTED' || a.status === 'REJECTED');

  return (
    <div>
      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 200 }}
          options={STATUS_OPTIONS}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 200 }}
          options={TYPE_OPTIONS}
        />
        <div style={{ flex: 1 }} />
        <Space>
          <Badge count={pendingCount || 0} overflowCount={99}>
            <Tag color="red" style={{ padding: '4px 12px', fontSize: 13 }}>
              En attente
            </Tag>
          </Badge>
          <Tag color="green" style={{ padding: '4px 12px', fontSize: 13 }}>
            Résolus: {resolved.length}
          </Tag>
          <Tag style={{ padding: '4px 12px', fontSize: 13 }}>
            Total: {appeals.length}
          </Tag>
        </Space>
      </div>

      {/* Appeals list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : appeals.length === 0 ? (
        <Empty description={
          statusFilter || typeFilter
            ? 'Aucun recours ne correspond aux filtres sélectionnés'
            : 'Aucun recours pour le moment'
        } />
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 4 }}>
          {/* Pending first */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#EF4444',
                marginBottom: 8, paddingBottom: 4,
                borderBottom: '2px solid #EF4444',
              }}>
                En attente de traitement ({pending.length})
              </div>
              {pending.map(appeal => (
                <AppealCard
                  key={appeal.id}
                  appeal={appeal}
                  onRespond={handleRespond}
                  loading={respondAppeal.isPending}
                />
              ))}
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#4A5568',
                marginBottom: 8, paddingBottom: 4,
                borderBottom: '2px solid #E2E8F0',
              }}>
                Traités ({resolved.length})
              </div>
              {resolved.map(appeal => (
                <AppealCard
                  key={appeal.id}
                  appeal={appeal}
                  onRespond={handleRespond}
                  loading={respondAppeal.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppealsTab;
