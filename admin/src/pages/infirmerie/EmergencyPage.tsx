import React, { useState, useEffect, useRef } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, Card, Row, Col,
  Spin, Alert, List, Steps, Descriptions, Badge,
} from 'antd';
import {
  AlertOutlined, ThunderboltOutlined, ClockCircleOutlined,
  CheckCircleOutlined, PlusOutlined, ReloadOutlined, PhoneOutlined,
} from '@ant-design/icons';
import {
  useEmergencyProtocols, useEmergencyEvents, useTriggerEmergency, useCloseEmergency,
} from '../../hooks/useApi';

const EVENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'En cours', color: 'red' },
  RESOLVED: { label: 'Résolu', color: 'green' },
  TRANSFERRED: { label: 'Transféré', color: 'orange' },
};

const EMERGENCY_TYPES: Record<string, string> = {
  ANAPHYLAXIS: 'Anaphylaxie',
  ASTHMA_ATTACK: 'Crise d\'asthme',
  EPILEPTIC_SEIZURE: 'Crise d\'épilepsie',
  DIABETIC_CRISIS: 'Crise diabétique',
  CARDIAC: 'Cardiaque',
  TRAUMA: 'Traumatisme',
  HEMORRHAGE: 'Hémorragie',
  FRACTURE: 'Fracture suspectée',
  BURN: 'Brûlure',
  POISONING: 'Intoxication',
  OTHER: 'Autre',
};

interface Protocol {
  id: string;
  title: string;
  emergency_type: string;
  protocol_steps: string[];
  triggers: string;
  is_active: boolean;
}

interface EmergencyEvent {
  id: string;
  student_name?: string;
  student?: string;
  protocol_name?: string;
  protocol?: string;
  status: string;
  started_at: string;
  ended_at?: string;
  actions_taken?: string[];
  duration_seconds?: number;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const EmergencyPage: React.FC = () => {
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [form] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: protocolsData, isLoading: protocolsLoading } = useEmergencyProtocols();
  const { data: eventsData, isLoading: eventsLoading, refetch } = useEmergencyEvents();
  const triggerEmergency = useTriggerEmergency();
  const closeEmergency = useCloseEmergency();

  const protocols = (protocolsData?.results || protocolsData || []) as Protocol[];
  const events = (eventsData?.results || eventsData || []) as EmergencyEvent[];
  const activeEvents = events.filter((e) => e.status === 'IN_PROGRESS');

  // Timer for active emergencies
  useEffect(() => {
    if (activeEvents.length > 0) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeEvents.length]);

  const handleTrigger = async () => {
    try {
      const values = await form.validateFields();
      await triggerEmergency.mutateAsync(values);
      setTriggerModalOpen(false);
      form.resetFields();
      setElapsedSeconds(0);
    } catch { /* validation */ }
  };

  const handleClose = async () => {
    if (!selectedEvent) return;
    try {
      const values = await closeForm.validateFields();
      await closeEmergency.mutateAsync({ id: selectedEvent.id, data: values });
      setCloseModalOpen(false);
      closeForm.resetFields();
      setSelectedEvent(null);
    } catch { /* validation */ }
  };

  const eventColumns = [
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => {
        const s = EVENT_STATUS_MAP[v];
        return <Tag color={s?.color || 'default'}>{s?.label || v}</Tag>;
      },
    },
    {
      title: 'Élève',
      key: 'student',
      render: (_: unknown, r: EmergencyEvent) => r.student_name || r.student || '—',
    },
    {
      title: 'Protocole',
      key: 'protocol',
      render: (_: unknown, r: EmergencyEvent) => r.protocol_name || r.protocol || '—',
    },
    {
      title: 'Début',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (v: string) => new Date(v).toLocaleString('fr-FR'),
    },
    {
      title: 'Durée',
      key: 'duration',
      render: (_: unknown, r: EmergencyEvent) => {
        if (r.status === 'IN_PROGRESS') {
          const start = new Date(r.started_at).getTime();
          const now = Date.now() + elapsedSeconds * 0;
          const secs = Math.floor((now - start) / 1000);
          return <Tag color="red"><ClockCircleOutlined /> {formatDuration(secs)}</Tag>;
        }
        return r.duration_seconds ? formatDuration(r.duration_seconds) : '—';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, r: EmergencyEvent) =>
        r.status === 'IN_PROGRESS' ? (
          <Button
            type="primary"
            danger
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => { setSelectedEvent(r); setCloseModalOpen(true); }}
          >
            Clôturer
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><AlertOutlined className="page-header__icon" style={{ color: '#ff4d4f' }} /> Urgences</h1>
          {activeEvents.length > 0 && (
            <Badge count={activeEvents.length} style={{ backgroundColor: '#ff4d4f' }}>
              <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>
                {activeEvents.length} urgence(s) en cours
              </Tag>
            </Badge>
          )}
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            danger
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={() => { form.resetFields(); setTriggerModalOpen(true); }}
            style={{ fontWeight: 'bold' }}
          >
            🚨 DÉCLENCHER UNE URGENCE
          </Button>
        </div>
      </div>

      {/* Active emergencies alert */}
      {activeEvents.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<AlertOutlined />}
          message="Urgences actives"
          description={
            <List
              size="small"
              dataSource={activeEvents}
              renderItem={(ev) => (
                <List.Item
                  actions={[
                    <Button
                      key="close"
                      type="primary"
                      danger
                      size="small"
                      onClick={() => { setSelectedEvent(ev); setCloseModalOpen(true); }}
                    >
                      Clôturer
                    </Button>,
                  ]}
                >
                  <strong>{ev.student_name || ev.student}</strong> — {ev.protocol_name || 'Urgence'}
                </List.Item>
              )}
            />
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Protocols reference */}
      <Card title="Protocoles d'urgence" style={{ marginBottom: 24 }} loading={protocolsLoading}>
        <Row gutter={[16, 16]}>
          {protocols.filter((p) => p.is_active).map((protocol) => (
            <Col xs={24} sm={12} md={8} key={protocol.id}>
              <Card
                size="small"
                hoverable
                onClick={() => setSelectedProtocol(protocol)}
                style={{ borderLeft: '4px solid #ff4d4f' }}
              >
                <strong>{EMERGENCY_TYPES[protocol.emergency_type] || protocol.emergency_type}</strong>
                <br />
                <span style={{ color: '#888' }}>{protocol.title}</span>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Events table */}
      <Card title="Historique des urgences">
        <Table
          columns={eventColumns}
          dataSource={events}
          loading={eventsLoading}
          rowKey="id"
          locale={{ emptyText: 'Aucun événement d\'urgence' }}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} événements` }}
        />
      </Card>

      {/* Trigger modal */}
      <Modal
        title={<span style={{ color: '#ff4d4f' }}>🚨 Déclencher une urgence</span>}
        open={triggerModalOpen}
        onOk={handleTrigger}
        onCancel={() => setTriggerModalOpen(false)}
        confirmLoading={triggerEmergency.isPending}
        okText="DÉCLENCHER"
        okButtonProps={{ danger: true }}
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="UUID de l'élève" />
          </Form.Item>
          <Form.Item label="Protocole" name="protocol">
            <Select
              placeholder="Sélectionner un protocole (optionnel)"
              allowClear
              options={protocols.filter((p) => p.is_active).map((p) => ({
                value: p.id,
                label: `${EMERGENCY_TYPES[p.emergency_type] || p.emergency_type} — ${p.title}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Décrire la situation..." />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            icon={<PhoneOutlined />}
            message="Rappel : Appeler le SAMU (115) si nécessaire"
            style={{ marginBottom: 0 }}
          />
        </Form>
      </Modal>

      {/* Close emergency modal */}
      <Modal
        title="Clôturer l'urgence"
        open={closeModalOpen}
        onOk={handleClose}
        onCancel={() => { setCloseModalOpen(false); setSelectedEvent(null); }}
        confirmLoading={closeEmergency.isPending}
        okText="Clôturer"
        cancelText="Annuler"
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item label="Statut final" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'RESOLVED', label: 'Résolu' },
                { value: 'TRANSFERRED', label: 'Transféré (hôpital)' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Rapport de liaison" name="liaison_report">
            <Input.TextArea rows={4} placeholder="Rapport final..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Protocol detail modal */}
      <Modal
        title={selectedProtocol ? `Protocole: ${selectedProtocol.title}` : 'Protocole'}
        open={!!selectedProtocol}
        onCancel={() => setSelectedProtocol(null)}
        footer={null}
        width={600}
      >
        {selectedProtocol && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Type">
                {EMERGENCY_TYPES[selectedProtocol.emergency_type] || selectedProtocol.emergency_type}
              </Descriptions.Item>
              <Descriptions.Item label="Déclencheurs">{selectedProtocol.triggers}</Descriptions.Item>
            </Descriptions>
            <h4>Étapes du protocole :</h4>
            <Steps
              direction="vertical"
              size="small"
              current={-1}
              items={selectedProtocol.protocol_steps.map((step, i) => ({
                title: `Étape ${i + 1}`,
                description: step,
              }))}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default EmergencyPage;
