import React, { useState } from 'react';
import { Row, Col, Table, Tag, Input, Select, Avatar, Modal, Form, Button, Progress, Space, Card, InputNumber } from 'antd';
import {
  ScanOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useEnrolledStudents, useFingerprintEnroll, useManualFallback } from '../../hooks/useApi';
import type { StudentEnrollmentStatus } from '../../types';

const FINGER_LABELS: Record<number, string> = {
  0: 'Pouce droit',
  1: 'Index droit',
  2: 'Majeur droit',
  3: 'Annulaire droit',
  4: 'Auriculaire droit',
  5: 'Pouce gauche',
  6: 'Index gauche',
  7: 'Majeur gauche',
  8: 'Annulaire gauche',
  9: 'Auriculaire gauche',
};

const FingerprintEnrollment: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [enrollModal, setEnrollModal] = useState(false);
  const [fallbackModal, setFallbackModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollmentStatus | null>(null);
  const [enrollForm] = Form.useForm();
  const [fallbackForm] = Form.useForm();

  const { data, isLoading, refetch } = useEnrolledStudents({
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const enrollMutation = useFingerprintEnroll();
  const fallbackMutation = useManualFallback();

  const students = (Array.isArray(data) ? data : []) as StudentEnrollmentStatus[];

  const statusTag = (s: string) => {
    if (s === 'enrolled') return <Tag icon={<CheckCircleOutlined />} color="success">Inscrit</Tag>;
    if (s === 'partial') return <Tag icon={<ExclamationCircleOutlined />} color="warning">Partiel</Tag>;
    return <Tag icon={<CloseCircleOutlined />} color="default">Non inscrit</Tag>;
  };

  const columns = [
    {
      title: 'Élève',
      key: 'student',
      render: (_: unknown, r: StudentEnrollmentStatus) => (
        <Space>
          <Avatar src={r.student_photo || undefined} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{r.student_name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.class_name}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Doigts inscrits',
      dataIndex: 'fingers_enrolled',
      key: 'fingers',
      render: (v: number) => (
        <Progress
          percent={Math.min((v / 2) * 100, 100)}
          steps={2}
          size="small"
          format={() => `${v}/2`}
          strokeColor={v >= 2 ? '#10B981' : '#F59E0B'}
        />
      ),
    },
    {
      title: 'Captures',
      dataIndex: 'total_captures',
      key: 'captures',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => statusTag(v),
    },
    {
      title: 'Dernière inscription',
      dataIndex: 'last_enrolled',
      key: 'last_enrolled',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('fr-FR') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, r: StudentEnrollmentStatus) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<ScanOutlined />}
            onClick={() => {
              setSelectedStudent(r);
              enrollForm.resetFields();
              setEnrollModal(true);
            }}
          >
            Inscrire
          </Button>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedStudent(r);
              fallbackForm.resetFields();
              setFallbackModal(true);
            }}
          >
            Manuel
          </Button>
        </Space>
      ),
    },
  ];

  const handleEnroll = async (values: { finger_index: number; captures: string; quality?: number }) => {
    if (!selectedStudent) return;
    const captures = values.captures.split(',').map(c => c.trim()).filter(Boolean);
    await enrollMutation.mutateAsync({
      student_id: selectedStudent.student_id,
      finger_index: values.finger_index,
      captures,
      quality_scores: values.quality ? [values.quality] : undefined,
    });
    setEnrollModal(false);
    refetch();
  };

  const handleFallback = async (values: { event_type: string }) => {
    if (!selectedStudent) return;
    await fallbackMutation.mutateAsync({
      student_id: selectedStudent.student_id,
      event_type: values.event_type,
    });
    setFallbackModal(false);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Inscriptions biométriques"
        subtitle="Gérer les empreintes des élèves"
        icon={<ScanOutlined />}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher un élève..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Statut"
              value={statusFilter || undefined}
              onChange={v => setStatusFilter(v || '')}
              allowClear
              options={[
                { value: 'enrolled', label: 'Inscrit' },
                { value: 'partial', label: 'Partiel' },
                { value: 'not_enrolled', label: 'Non inscrit' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<ScanOutlined />}
          title="Aucun élève trouvé"
          description="Aucun élève ne correspond aux critères de recherche."
        />
      ) : (
        <Table
          dataSource={students}
          columns={columns}
          rowKey="student_id"
          pagination={{ pageSize: 15 }}
          scroll={{ x: 700 }}
        />
      )}

      {/* Enroll Modal */}
      <Modal
        title={`Inscrire — ${selectedStudent?.student_name ?? ''}`}
        open={enrollModal}
        onCancel={() => setEnrollModal(false)}
        footer={null}
        width={520}
      >
        <Form form={enrollForm} layout="vertical" onFinish={handleEnroll}>
          {selectedStudent?.student_photo && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar size={80} src={selectedStudent.student_photo} icon={<UserOutlined />} />
            </div>
          )}
          <Form.Item name="finger_index" label="Doigt" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner un doigt">
              {Object.entries(FINGER_LABELS).map(([k, v]) => (
                <Select.Option key={k} value={Number(k)}>{v}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="captures"
            label="Captures (base64, séparées par des virgules)"
            rules={[{ required: true }]}
            extra="Jusqu'à 3 captures par doigt pour plus de fiabilité"
          >
            <Input.TextArea rows={3} placeholder="capture1,capture2,capture3" />
          </Form.Item>
          <Form.Item name="quality" label="Score qualité (0-100)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={enrollMutation.isPending} block>
              Enregistrer l'empreinte
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Fallback Modal */}
      <Modal
        title={`Présence manuelle — ${selectedStudent?.student_name ?? ''}`}
        open={fallbackModal}
        onCancel={() => setFallbackModal(false)}
        footer={null}
        width={400}
      >
        <Form form={fallbackForm} layout="vertical" onFinish={handleFallback}>
          <Form.Item name="event_type" label="Type" rules={[{ required: true }]}>
            <Select placeholder="Arrivée / Départ">
              <Select.Option value="CHECK_IN">Arrivée</Select.Option>
              <Select.Option value="CHECK_OUT">Départ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={fallbackMutation.isPending} block>
              Marquer la présence
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FingerprintEnrollment;
