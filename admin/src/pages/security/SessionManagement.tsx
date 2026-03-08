import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Typography, Space, Tag, Modal, message, Row, Col, Empty, Alert,
} from 'antd';
import {
  ApiOutlined, DeleteOutlined, ReloadOutlined, StopOutlined,
  ExclamationCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { sessionsAPI } from '../../api/securityService';

const { Title, Text } = Typography;

interface ActiveSession {
  id: string;
  device_name: string | null;
  device_os: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string | null;
}

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sessionsAPI.list();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleRevoke = (session: ActiveSession) => {
    Modal.confirm({
      title: 'Révoquer cette session ?',
      icon: <ExclamationCircleOutlined />,
      content: 'L\'appareil concerné sera déconnecté immédiatement.',
      okText: 'Révoquer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await sessionsAPI.revoke(session.id);
          message.success('Session révoquée');
          fetchSessions();
        } catch {
          message.error('Erreur lors de la révocation');
        }
      },
    });
  };

  const handleRevokeAll = () => {
    Modal.confirm({
      title: 'Révoquer toutes les sessions ?',
      icon: <ExclamationCircleOutlined />,
      content: 'Tous vos appareils seront déconnectés (sauf la session courante si vous fournissez le JTI). Vous devrez vous reconnecter partout.',
      okText: 'Tout révoquer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await sessionsAPI.revokeAll();
          message.success('Toutes les sessions ont été révoquées');
          fetchSessions();
        } catch {
          message.error('Erreur lors de la révocation');
        }
      },
    });
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return dayjs(expiresAt).diff(dayjs(), 'hour') < 2;
  };

  const columns: ColumnsType<ActiveSession> = [
    {
      title: 'Appareil',
      key: 'device',
      render: (_: unknown, record) => (
        <div>
          <Text strong>{record.device_name || 'Inconnu'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.device_os || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'Adresse IP',
      dataIndex: 'ip_address',
      width: 140,
      render: (ip: string | null) => ip || '-',
    },
    {
      title: 'Créée le',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Expire',
      dataIndex: 'expires_at',
      width: 160,
      render: (v: string | null) => {
        if (!v) return '-';
        return (
          <Space>
            <ClockCircleOutlined />
            <Text type={isExpiringSoon(v) ? 'warning' : undefined}>
              {dayjs(v).format('DD/MM/YYYY HH:mm')}
            </Text>
            {isExpiringSoon(v) && <Tag color="warning">Bientôt</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Statut',
      width: 90,
      render: () => <Tag color="green">Actif</Tag>,
    },
    {
      title: '',
      width: 100,
      render: (_: unknown, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRevoke(record)}
        >
          Révoquer
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <ApiOutlined style={{ marginRight: 8 }} />
            Sessions actives
          </Title>
          <Text type="secondary">
            Gérez vos sessions de connexion actives sur tous vos appareils
          </Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchSessions}>Actualiser</Button>
            {sessions.length > 1 && (
              <Button danger icon={<StopOutlined />} onClick={handleRevokeAll}>
                Tout révoquer
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {sessions.length > 3 && (
        <Alert
          message="Sessions multiples détectées"
          description="Vous avez plusieurs sessions actives. Si vous ne reconnaissez pas certains appareils, révoquez-les immédiatement."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        {sessions.length === 0 && !loading ? (
          <Empty description="Aucune session active" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={sessions}
            loading={loading}
            pagination={false}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
};

export default SessionManagement;
