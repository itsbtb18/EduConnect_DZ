import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Typography, Space, Tag, Modal, message, Row, Col, Empty,
} from 'antd';
import {
  MobileOutlined, DesktopOutlined, DeleteOutlined, ReloadOutlined,
  SafetyCertificateOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { devicesAPI } from '../../api/securityService';

const { Title, Text } = Typography;

interface TrustedDevice {
  id: string;
  device_name: string;
  device_os: string;
  last_ip: string | null;
  last_used: string | null;
  created_at: string;
}

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await devicesAPI.list();
      setDevices(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleRevoke = (device: TrustedDevice) => {
    Modal.confirm({
      title: 'Révoquer cet appareil ?',
      icon: <ExclamationCircleOutlined />,
      content: `L'appareil "${device.device_name}" ne sera plus considéré comme de confiance. Vous devrez vérifier votre identité lors de la prochaine connexion depuis cet appareil.`,
      okText: 'Révoquer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await devicesAPI.revoke(device.id);
          message.success('Appareil révoqué');
          fetchDevices();
        } catch {
          message.error('Erreur lors de la révocation');
        }
      },
    });
  };

  const getDeviceIcon = (os: string) => {
    const lower = os?.toLowerCase() || '';
    if (lower.includes('android') || lower.includes('ios') || lower.includes('mobile')) {
      return <MobileOutlined style={{ fontSize: 20 }} />;
    }
    return <DesktopOutlined style={{ fontSize: 20 }} />;
  };

  const columns: ColumnsType<TrustedDevice> = [
    {
      title: 'Appareil',
      dataIndex: 'device_name',
      render: (name: string, record) => (
        <Space>
          {getDeviceIcon(record.device_os)}
          <div>
            <Text strong>{name || 'Appareil inconnu'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.device_os || '-'}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Dernière IP',
      dataIndex: 'last_ip',
      width: 140,
      render: (ip: string | null) => ip || '-',
    },
    {
      title: 'Dernière utilisation',
      dataIndex: 'last_used',
      width: 180,
      render: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Ajouté le',
      dataIndex: 'created_at',
      width: 150,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Statut',
      width: 100,
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
            <SafetyCertificateOutlined style={{ marginRight: 8 }} />
            Appareils de confiance
          </Title>
          <Text type="secondary">
            Gérez les appareils autorisés à se connecter sans vérification supplémentaire
          </Text>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={fetchDevices}>Actualiser</Button>
        </Col>
      </Row>

      <Card>
        {devices.length === 0 && !loading ? (
          <Empty description="Aucun appareil de confiance enregistré" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={devices}
            loading={loading}
            pagination={false}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
};

export default DevicesPage;
