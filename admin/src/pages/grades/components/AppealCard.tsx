/**
 * AppealCard — displays a single grade appeal with action buttons.
 */
import React, { useState } from 'react';
import { Card, Tag, Button, Space, Modal, InputNumber, Input, Checkbox, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { GradeAppeal, AppealRespondPayload } from '../../../types/grades';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; emoji: string }> = {
  PENDING:      { color: 'red',     icon: <ExclamationCircleOutlined />, emoji: '🔴' },
  UNDER_REVIEW: { color: 'orange',  icon: <ClockCircleOutlined />,      emoji: '🟠' },
  ACCEPTED:     { color: 'green',   icon: <CheckCircleOutlined />,      emoji: '🟢' },
  REJECTED:     { color: 'default', icon: <CloseCircleOutlined />,      emoji: '⚫' },
};

interface AppealCardProps {
  appeal: GradeAppeal;
  onRespond: (id: string, payload: AppealRespondPayload) => void;
  loading?: boolean;
}

const AppealCard: React.FC<AppealCardProps> = ({ appeal, onRespond, loading }) => {
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [correctedValue, setCorrectedValue] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [autoRecalc, setAutoRecalc] = useState(true);

  const cfg = STATUS_CONFIG[appeal.status] || STATUS_CONFIG.PENDING;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Il y a ${days}j`;
  };

  const handleAccept = () => {
    onRespond(appeal.id, {
      status: 'ACCEPTED',
      response: responseText,
      corrected_value: correctedValue,
    });
    setAcceptModalOpen(false);
    setResponseText('');
    setCorrectedValue(null);
  };

  const handleReject = () => {
    onRespond(appeal.id, {
      status: 'REJECTED',
      response: responseText,
    });
    setRejectModalOpen(false);
    setResponseText('');
  };

  const isPending = appeal.status === 'PENDING' || appeal.status === 'UNDER_REVIEW';

  return (
    <>
      <Card
        size="small"
        style={{
          borderLeft: `4px solid ${cfg.color === 'default' ? '#d9d9d9' : cfg.color === 'red' ? '#EF4444' : cfg.color === 'orange' ? '#F59E0B' : '#10B981'}`,
          marginBottom: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <Tag color={cfg.color} icon={cfg.icon}>
              {cfg.emoji} {appeal.status_display}
            </Tag>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2044', marginLeft: 8 }}>
              Recours sur : {appeal.appeal_type_display}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#999' }}>
            {timeAgo(appeal.created_at)}
          </span>
        </div>

        {/* Student info */}
        <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 8 }}>
          <strong>{appeal.student_name}</strong>
          {appeal.assigned_teacher_name && (
            <span style={{ color: '#888' }}> — Enseignant: {appeal.assigned_teacher_name}</span>
          )}
        </div>

        {/* Reason */}
        <div style={{
          background: '#F7F9FC',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 8,
          fontSize: 13,
          color: '#333',
          borderLeft: '3px solid #E2E8F0',
        }}>
          <strong>Raison :</strong> « {appeal.reason} »
          {appeal.student_comment && (
            <div style={{ marginTop: 4, fontStyle: 'italic', color: '#666' }}>
              {appeal.student_comment}
            </div>
          )}
        </div>

        {/* Contested value */}
        {appeal.original_value != null && (
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            Valeur contestée : <strong style={{ color: '#EF4444' }}>{appeal.original_value}/20</strong>
            {appeal.corrected_value != null && (
              <span>
                {' → '}
                <strong style={{ color: '#10B981' }}>{appeal.corrected_value}/20</strong>
              </span>
            )}
          </div>
        )}

        {/* Response */}
        {appeal.response && (
          <div style={{
            background: '#F0FFF4',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 8,
            fontSize: 12,
            color: '#333',
            borderLeft: '3px solid #10B981',
          }}>
            <strong>Réponse :</strong> {appeal.response}
            {appeal.responded_at && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                {new Date(appeal.responded_at).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isPending && (
          <Space style={{ marginTop: 4 }}>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ background: '#10B981', borderColor: '#10B981' }}
              onClick={() => setAcceptModalOpen(true)}
              loading={loading}
            >
              Accepter + Corriger
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => setRejectModalOpen(true)}
              loading={loading}
            >
              Rejeter
            </Button>
            <Tooltip title="Répondre sans décision">
              <Button size="small" icon={<MessageOutlined />} disabled>
                Répondre
              </Button>
            </Tooltip>
          </Space>
        )}
      </Card>

      {/* Accept modal */}
      <Modal
        title="✅ Accepter le recours + Corriger"
        open={acceptModalOpen}
        onCancel={() => setAcceptModalOpen(false)}
        onOk={handleAccept}
        okText="Confirmer"
        cancelText="Annuler"
        okButtonProps={{ disabled: !responseText.trim() }}
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Nouvelle valeur :</label>
          <InputNumber
            min={0}
            max={20}
            step={0.25}
            precision={2}
            value={correctedValue}
            onChange={(v) => setCorrectedValue(v as number | null)}
            style={{ width: '100%' }}
            placeholder="Laisser vide si pas de correction"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Commentaire de réponse :</label>
          <Input.TextArea
            rows={3}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Expliquez la décision..."
          />
        </div>
        <Checkbox checked={autoRecalc} onChange={(e) => setAutoRecalc(e.target.checked)}>
          Recalculer et republier automatiquement
        </Checkbox>
      </Modal>

      {/* Reject modal */}
      <Modal
        title="❌ Rejeter le recours"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
        okText="Rejeter"
        cancelText="Annuler"
        okButtonProps={{ danger: true, disabled: !responseText.trim() }}
      >
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Motif du rejet :</label>
          <Input.TextArea
            rows={3}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Expliquez pourquoi le recours est rejeté..."
          />
        </div>
      </Modal>
    </>
  );
};

export default AppealCard;
