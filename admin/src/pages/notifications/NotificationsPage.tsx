import React, { useState } from 'react';
import { Card, Button, Tag, Empty, Spin, Badge, Tooltip, Popconfirm } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNotifications, useMarkNotificationRead } from '../../hooks/useApi';

const typeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  info: { color: 'blue', icon: <InfoCircleOutlined /> },
  warning: { color: 'orange', icon: <WarningOutlined /> },
  success: { color: 'green', icon: <CheckCircleOutlined /> },
  error: { color: 'red', icon: <WarningOutlined /> },
};

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  notification_type?: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { data, isLoading, refetch } = useNotifications({ page_size: 50 });
  const markRead = useMarkNotificationRead();

  const notifications = (data?.results || []) as unknown as NotificationRecord[];
  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    notifications
      .filter((n) => !n.is_read)
      .forEach((n) => markRead.mutate(n.id));
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>
            <BellOutlined style={{ marginRight: 10 }} />
            Notifications
          </h1>
          <p>
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes les notifications sont lues'}
          </p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleMarkAllRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-row">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <Button
            key={f}
            type={filter === f ? 'primary' : 'default'}
            size="small"
            onClick={() => setFilter(f)}
          >
            {f === 'all' && `Toutes (${notifications.length})`}
            {f === 'unread' && (
              <>Non lues <Badge count={unreadCount} size="small" /></>
            )}
            {f === 'read' && 'Lues'}
          </Button>
        ))}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="loading-center">
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          />
        </Card>
      ) : (
        <div className="flex-col gap-8">
          {filtered.map((notif) => {
            const nType = notif.notification_type || notif.type || 'info';
            const cfg = typeConfig[nType] || typeConfig.info;
            const borderColor = nType === 'warning' ? 'var(--warning)' : nType === 'success' ? 'var(--success)' : nType === 'error' ? 'var(--danger)' : 'var(--primary)';
            return (
              <Card
                key={notif.id}
                size="small"
                className={`card-interactive notif-card ${notif.is_read ? 'notif-card--read' : ''}`}
                style={{ borderLeft: `4px solid ${borderColor}` }}
              >
                <div className="notif-card__row">
                  <div className={`notif-card__icon notif-card__icon--${nType}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="notif-card__header">
                      <span className="font-semibold">{notif.title || 'Notification'}</span>
                      {!notif.is_read && <Badge status="processing" />}
                      <Tag color={cfg.color} className="notif-card__type-tag">{nType}</Tag>
                    </div>
                    <div className="notif-card__message">{notif.message || ''}</div>
                    <div className="notif-card__time">
                      <ClockCircleOutlined />
                      {notif.created_at
                        ? new Date(notif.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </div>
                  </div>
                  <div className="notif-card__actions">
                    {!notif.is_read && (
                      <Tooltip title="Marquer comme lu">
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleMarkRead(notif.id)}
                          loading={markRead.isPending}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
