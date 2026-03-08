import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, DatePicker, Spin, Button, message, Modal, Form, InputNumber, Input } from 'antd';
import {
  BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, BellOutlined,
} from '@ant-design/icons';
import {
  useTransportReport, useTransportLines, useNotifyDelay, useNotifyArrival,
} from '../../hooks/useApi';
import type { TransportReport, TransportLineList } from '../../types';

const TransportReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<[string?, string?]>([]);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyLineId, setNotifyLineId] = useState<string>('');
  const [notifyForm] = Form.useForm();

  const { data, isLoading } = useTransportReport({
    ...(dateRange[0] ? { date_from: dateRange[0] } : {}),
    ...(dateRange[1] ? { date_to: dateRange[1] } : {}),
  });
  const { data: linesData } = useTransportLines({ active: true });
  const notifyDelay = useNotifyDelay();
  const notifyArrival = useNotifyArrival();

  const report = data as TransportReport | undefined;
  const lines = (linesData?.results || []) as TransportLineList[];

  const handleNotifyDelay = async () => {
    try {
      const values = await notifyForm.validateFields();
      await notifyDelay.mutateAsync({ lineId: notifyLineId, ...values });
      message.success('Notification de retard envoyée');
      setNotifyModalOpen(false);
      notifyForm.resetFields();
    } catch { /* validation */ }
  };

  const handleNotifyArrival = async (lineId: string) => {
    await notifyArrival.mutateAsync(lineId);
    message.success('Notification d\'arrivée envoyée');
  };

  if (isLoading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><BarChartOutlined className="page-header__icon" /> Rapports transport</h1>
          <p>Performance et ponctualité du réseau</p>
        </div>
        <div className="page-header__actions">
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            onChange={(dates) => {
              setDateRange([
                dates?.[0]?.format('YYYY-MM-DD'),
                dates?.[1]?.format('YYYY-MM-DD'),
              ]);
            }}
          />
        </div>
      </div>

      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #3B82F6' }}>
            <Statistic title="Total trajets" value={report?.total_trips || 0} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #10B981' }}>
            <Statistic title="À l'heure" value={report?.on_time_count || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10B981' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #F59E0B' }}>
            <Statistic title="En retard" value={report?.delayed_count || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#F59E0B' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #EF4444' }}>
            <Statistic title="Retard moyen" value={report?.avg_delay_minutes || 0} suffix="min" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card style={{ borderLeft: '4px solid #00C9A7' }}>
            <Statistic title="Taux ponctualité" value={report?.on_time_rate || 0} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderLeft: '4px solid #8B5CF6' }}>
            <Statistic title="Passagers / trajet (moy.)" value={report?.avg_passengers || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderLeft: '4px solid #EF4444' }}>
            <Statistic title="Annulés" value={report?.cancelled_count || 0} />
          </Card>
        </Col>
      </Row>

      {/* Per-line breakdown */}
      <Card title="📊 Performance par ligne" className="card card--table" style={{ marginBottom: 24 }}>
        <Table
          dataSource={report?.lines || []}
          rowKey="line_id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Ligne', dataIndex: 'line_name', key: 'name' },
            { title: 'Trajets', dataIndex: 'total_trips', key: 'trips', align: 'center' as const },
            {
              title: 'À l\'heure', dataIndex: 'on_time_count', key: 'ontime',
              render: (v: number) => <Tag color="green">{v}</Tag>,
            },
            {
              title: 'Ponctualité', dataIndex: 'on_time_rate', key: 'rate',
              render: (v: number) => (
                <Tag color={v >= 90 ? 'green' : v >= 70 ? 'orange' : 'red'}>{v}%</Tag>
              ),
            },
          ]}
        />
      </Card>

      {/* Notification actions */}
      <Card title={<><BellOutlined /> Notifications rapides</>}>
        <Table
          dataSource={lines}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Ligne', dataIndex: 'name', key: 'name' },
            { title: 'Chauffeur', dataIndex: 'driver_name', key: 'driver' },
            {
              title: 'Actions', key: 'actions',
              render: (_: unknown, r: TransportLineList) => (
                <span style={{ display: 'flex', gap: 8 }}>
                  <Button size="small" icon={<WarningOutlined />}
                    onClick={() => { setNotifyLineId(r.id); setNotifyModalOpen(true); }}>
                    Signaler retard
                  </Button>
                  <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                    onClick={() => handleNotifyArrival(r.id)}
                    loading={notifyArrival.isPending}>
                    Arrivée confirmée
                  </Button>
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* Delay notification modal */}
      <Modal title="Signaler un retard" open={notifyModalOpen}
        onOk={handleNotifyDelay} onCancel={() => setNotifyModalOpen(false)}
        confirmLoading={notifyDelay.isPending}
        okText="Envoyer la notification" cancelText="Annuler"
      >
        <Form form={notifyForm} layout="vertical">
          <Form.Item label="Retard (minutes)" name="delay_minutes" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber style={{ width: '100%' }} min={1} max={120} />
          </Form.Item>
          <Form.Item label="Message (optionnel)" name="message">
            <Input.TextArea rows={2} placeholder="Ex: Embouteillage route nationale..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransportReports;
