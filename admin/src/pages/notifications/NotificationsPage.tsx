import React, { useState, useMemo } from 'react';
import { Button, Input, Select, Radio, Badge, Tooltip, Modal, message } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckOutlined,
  SendOutlined,
  PlusOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNotifications, useMarkNotificationRead, useSchools } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  DataCard,
  LoadingSkeleton,
  EmptyState,
  SectionHeader,
} from '../../components/ui';
import './NotificationsPage.css';

const typeConfig: Record<string, { color: string; borderColor: string; icon: React.ReactNode }> = {
  info:    { color: '#3B82F6', borderColor: '#3B82F6', icon: <InfoCircleOutlined /> },
  warning: { color: '#F59E0B', borderColor: '#F59E0B', icon: <WarningOutlined /> },
  success: { color: '#10B981', borderColor: '#10B981', icon: <CheckCircleOutlined /> },
  error:   { color: '#EF4444', borderColor: '#EF4444', icon: <WarningOutlined /> },
  urgent:  { color: '#EF4444', borderColor: '#EF4444', icon: <WarningOutlined /> },
  PAYMENT: { color: '#F59E0B', borderColor: '#F59E0B', icon: <DollarOutlined /> },
  ATTENDANCE: { color: '#3B82F6', borderColor: '#3B82F6', icon: <CheckCircleOutlined /> },
  HOMEWORK: { color: '#8B5CF6', borderColor: '#8B5CF6', icon: <InfoCircleOutlined /> },
  GRADE: { color: '#10B981', borderColor: '#10B981', icon: <CheckCircleOutlined /> },
  ANNOUNCEMENT: { color: '#06B6D4', borderColor: '#06B6D4', icon: <BellOutlined /> },
};

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  notification_type?: string;
  type?: string;
  related_object_type?: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { data, isLoading, refetch } = useNotifications({ page_size: 50 });
  const markRead = useMarkNotificationRead();
  const { data: schoolsData } = useSchools(isSuperAdmin ? { page_size: 100 } : undefined);

  const notifications = (data?.results || []) as unknown as NotificationRecord[];
  const filtered = useMemo(() => notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  }), [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  /* ── Send notification modal (super admin only) ── */
  const [sendOpen, setSendOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ title: '', message: '', target: 'all_admins' as string, priority: 'normal' as string, school_id: '' });

  const handleSendNotif = () => {
    if (!sendForm.title || !sendForm.message) {
      message.warning('Veuillez remplir le titre et le message');
      return;
    }
    // TODO: call API to send notification
    message.success('Notification envoyée avec succès');
    setSendOpen(false);
    setSendForm({ title: '', message: '', target: 'all_admins', priority: 'normal', school_id: '' });
  };

  const handleMarkRead = (id: string) => markRead.mutate(id);

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.is_read).forEach((n) => markRead.mutate(n.id));
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  if (isLoading && !notifications.length) return <LoadingSkeleton variant="table" rows={6} />;

  const schools = (schoolsData?.results || []) as { id: string; name: string }[];

  return (
    <div className="sa-page nf-page">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
        icon={<BellOutlined />}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
            {unreadCount > 0 && (
              <Button type="primary" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
                Tout marquer lu
              </Button>
            )}
            {isSuperAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setSendOpen(true)}>
                Envoyer
              </Button>
            )}
          </div>
        }
      />

      {/* ── Send Notification (super admin) ── */}
      {isSuperAdmin && (
        <DataCard title="Envoyer une notification" icon={<SendOutlined />}>
          <div className="nf-send-form">
            <div className="nf-send-row">
              <label>Titre *</label>
              <Input
                placeholder="Titre de la notification"
                value={sendForm.title}
                onChange={(e) => setSendForm((f) => ({ ...f, title: e.target.value }))}
                size="large"
              />
            </div>
            <div className="nf-send-row">
              <label>Message *</label>
              <Input.TextArea
                placeholder="Contenu du message..."
                rows={3}
                value={sendForm.message}
                onChange={(e) => setSendForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <div className="nf-send-row nf-send-row--inline">
              <div>
                <label>Cible</label>
                <Radio.Group
                  value={sendForm.target}
                  onChange={(e) => setSendForm((f) => ({ ...f, target: e.target.value }))}
                >
                  <Radio.Button value="all_admins">Tous les admins</Radio.Button>
                  <Radio.Button value="specific_school">École spécifique</Radio.Button>
                  <Radio.Button value="super_admins">Super admins</Radio.Button>
                </Radio.Group>
              </div>
              {sendForm.target === 'specific_school' && (
                <div>
                  <label>École</label>
                  <Select
                    placeholder="Sélectionner une école"
                    style={{ minWidth: 220 }}
                    value={sendForm.school_id || undefined}
                    onChange={(v) => setSendForm((f) => ({ ...f, school_id: v }))}
                    options={schools.map((s) => ({ value: s.id, label: s.name }))}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  />
                </div>
              )}
              <div>
                <label>Priorité</label>
                <Radio.Group
                  value={sendForm.priority}
                  onChange={(e) => setSendForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  <Radio.Button value="normal">Normal</Radio.Button>
                  <Radio.Button value="urgent" className="nf-urgent-btn">Urgente</Radio.Button>
                </Radio.Group>
              </div>
            </div>
            <div className="nf-send-actions">
              <Button type="primary" icon={<SendOutlined />} onClick={handleSendNotif} size="large">
                Envoyer la notification
              </Button>
            </div>
          </div>
        </DataCard>
      )}

      {/* ── Filter tabs ── */}
      <SectionHeader
        title="Historique des notifications"
        action={
          <div className="nf-filter-tabs">
            {([
              { key: 'all' as const, label: `Toutes (${notifications.length})`, badge: 0 },
              { key: 'unread' as const, label: 'Non lues', badge: unreadCount },
              { key: 'read' as const, label: 'Lues', badge: 0 },
            ]).map((f) => (
              <button
                key={f.key}
                className={`an-date-btn ${filter === f.key ? 'an-date-btn--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.badge > 0 ? <Badge count={f.badge} size="small" style={{ marginLeft: 6 }} /> : null}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Notification list ── */}
      {filtered.length === 0 ? (
        <DataCard>
          <EmptyState
            icon={<BellOutlined />}
            title={filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            description="Vous serez notifié des événements importants ici."
          />
        </DataCard>
      ) : (
        <div className="nf-list">
          {filtered.map((notif) => {
            const nType = notif.notification_type || notif.type || 'info';
            const cfg = typeConfig[nType] || typeConfig.info;
            const handleCardClick = () => {
              if (!notif.is_read) handleMarkRead(notif.id);
              if (nType === 'PAYMENT') {
                const target = notif.related_object_type === 'payment_expired'
                  ? '/financial?status=expire'
                  : '/financial';
                navigate(target);
              } else if (nType === 'ATTENDANCE') {
                navigate('/attendance');
              } else if (nType === 'HOMEWORK') {
                navigate('/homework');
              } else if (nType === 'GRADE') {
                navigate('/grades');
              }
            };
            return (
              <div
                key={notif.id}
                className={`nf-card ${notif.is_read ? 'nf-card--read' : ''}`}
                style={{ borderLeftColor: cfg.borderColor, cursor: 'pointer' }}
                onClick={handleCardClick}
              >
                <div className="nf-card__icon" style={{ color: cfg.color, background: `${cfg.color}15` }}>
                  {cfg.icon}
                </div>
                <div className="nf-card__body">
                  <div className="nf-card__header">
                    <span className="nf-card__title">{notif.title || 'Notification'}</span>
                    {!notif.is_read && <span className="nf-card__dot" />}
                  </div>
                  <div className="nf-card__message">{notif.message || ''}</div>
                  <div className="nf-card__time">
                    <ClockCircleOutlined />
                    <Tooltip title={new Date(notif.created_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })}>
                      <span>{formatRelativeTime(notif.created_at)}</span>
                    </Tooltip>
                  </div>
                </div>
                <div className="nf-card__actions">
                  {!notif.is_read && (
                    <Tooltip title="Marquer comme lu">
                      <button className="nf-card__mark-btn" onClick={() => handleMarkRead(notif.id)}>
                        <CheckCircleOutlined />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
