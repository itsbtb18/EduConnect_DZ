import React from 'react';
import { Card, Tag, Spin, Button, Descriptions, Progress } from 'antd';
import {
  HeartOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ThunderboltOutlined,
  HddOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useSystemHealth } from '../../hooks/useApi';

const statusIcon = (ok: boolean | undefined) =>
  ok ? <CheckCircleOutlined className="color-success" /> : <CloseCircleOutlined className="color-danger" />;

const statusTag = (ok: boolean | undefined, label?: string) =>
  ok ? <Tag color="green" icon={<CheckCircleOutlined />}>{label || 'Opérationnel'}</Tag>
     : <Tag color="red" icon={<CloseCircleOutlined />}>{label || 'En panne'}</Tag>;

const SystemHealthPage: React.FC = () => {
  const { data, isLoading, refetch } = useSystemHealth();
  const health = data as Record<string, unknown> | null;

  const db = health?.database as Record<string, unknown> | undefined;
  const redis = health?.redis as Record<string, unknown> | undefined;
  const celery = health?.celery as Record<string, unknown> | undefined;
  const storage = health?.storage as Record<string, unknown> | undefined;
  const overallOk = health?.status === 'healthy' || health?.status === 'ok';

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><HeartOutlined className="page-header__icon" /> Santé du système</h1>
          <p>
            {isLoading ? 'Vérification...' : (
              overallOk
                ? <Tag color="green" icon={<CheckCircleOutlined />}>Tous les services sont opérationnels</Tag>
                : health
                  ? <Tag color="red" icon={<WarningOutlined />}>Certains services sont en panne</Tag>
                  : <Tag color="default">Données non disponibles</Tag>
            )}
          </p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Vérifier
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-center"><Spin size="large" /></div>
      ) : !health ? (
        <Card>
          <div className="empty-state">
            <div className="empty-state__icon"><WarningOutlined /></div>
            <div className="empty-state__title">Endpoint non disponible</div>
            <div className="empty-state__desc">
              L'endpoint /auth/system-health/ n'est pas encore configuré sur le backend.
              Ajoutez-le pour voir le statut en temps réel.
            </div>
          </div>
        </Card>
      ) : (
        <div className="stats-grid stats-grid--2 stagger-children">
          {/* Database */}
          <Card
            title={<span><DatabaseOutlined className="health-card-icon" /> Base de données (PostgreSQL)</span>}
            className="health-card"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Statut">{statusTag(db?.status === 'ok' || db?.connected === true)}</Descriptions.Item>
              <Descriptions.Item label="Connexions">{(db?.connections as number) ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Temps de réponse">{db?.response_time ? `${db.response_time}ms` : '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Redis */}
          <Card
            title={<span><CloudServerOutlined className="health-card-icon" /> Cache (Redis)</span>}
            className="health-card"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Statut">{statusTag(redis?.status === 'ok' || redis?.connected === true)}</Descriptions.Item>
              <Descriptions.Item label="Mémoire utilisée">{(redis?.used_memory as string) || '—'}</Descriptions.Item>
              <Descriptions.Item label="Clients connectés">{(redis?.connected_clients as number) ?? '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Celery */}
          <Card
            title={<span><ThunderboltOutlined className="health-card-icon" /> File d'attente (Celery)</span>}
            className="health-card"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Statut">{statusTag(celery?.status === 'ok' || celery?.connected === true)}</Descriptions.Item>
              <Descriptions.Item label="Workers actifs">{(celery?.active_workers as number) ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tâches en attente">{(celery?.pending_tasks as number) ?? '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Storage */}
          <Card
            title={<span><HddOutlined className="health-card-icon" /> Stockage</span>}
            className="health-card"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Statut">{statusTag(storage?.status === 'ok' || storage?.available === true)}</Descriptions.Item>
              <Descriptions.Item label="Espace utilisé">
                {storage?.used_percent != null ? (
                  <Progress percent={storage.used_percent as number} size="small" status={((storage.used_percent as number) > 90) ? 'exception' : 'normal'} />
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Espace total">{(storage?.total as string) || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SystemHealthPage;
