import React, { useState, useMemo } from 'react';
import { Button, Select, Radio, Badge, Tooltip, Tag, Switch, TimePicker, Drawer, message } from 'antd';
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
  SettingOutlined,
  ThunderboltOutlined,
  BookOutlined,
  CarOutlined,
  CoffeeOutlined,
  MedicineBoxOutlined,
  MessageOutlined,
  DesktopOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useNotificationStats,
  useSchools,
} from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  DataCard,
  StatCard,
  LoadingSkeleton,
  EmptyState,
  SectionHeader,
} from '../../components/ui';
import type { NotificationPreference, NotificationStats } from '../../types';
import './NotificationsPage.css';

const typeConfig: Record<string, { color: string; borderColor: string; icon: React.ReactNode }> = {
  info:    { color: '#3B82F6', borderColor: '#3B82F6', icon: <InfoCircleOutlined /> },
  warning: { color: '#F59E0B', borderColor: '#F59E0B', icon: <WarningOutlined /> },
  success: { color: '#10B981', borderColor: '#10B981', icon: <CheckCircleOutlined /> },
  error:   { color: '#EF4444', borderColor: '#EF4444', icon: <WarningOutlined /> },
  urgent:  { color: '#EF4444', borderColor: '#EF4444', icon: <ThunderboltOutlined /> },
  PAYMENT: { color: '#F59E0B', borderColor: '#F59E0B', icon: <DollarOutlined /> },
  ATTENDANCE: { color: '#3B82F6', borderColor: '#3B82F6', icon: <CheckCircleOutlined /> },
  HOMEWORK: { color: '#8B5CF6', borderColor: '#8B5CF6', icon: <InfoCircleOutlined /> },
  GRADE: { color: '#10B981', borderColor: '#10B981', icon: <CheckCircleOutlined /> },
  ANNOUNCEMENT: { color: '#06B6D4', borderColor: '#06B6D4', icon: <BellOutlined /> },
  LIBRARY: { color: '#D97706', borderColor: '#D97706', icon: <BookOutlined /> },
  TRANSPORT: { color: '#0EA5E9', borderColor: '#0EA5E9', icon: <CarOutlined /> },
  CANTEEN: { color: '#84CC16', borderColor: '#84CC16', icon: <CoffeeOutlined /> },
  INFIRMERIE: { color: '#EC4899', borderColor: '#EC4899', icon: <MedicineBoxOutlined /> },
  SMS: { color: '#6366F1', borderColor: '#6366F1', icon: <MessageOutlined /> },
  SYSTEM: { color: '#64748B', borderColor: '#64748B', icon: <DesktopOutlined /> },
};

const priorityConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  URGENT:    { color: '#EF4444', label: 'Urgente', icon: <ThunderboltOutlined /> },
  IMPORTANT: { color: '#F59E0B', label: 'Importante', icon: <WarningOutlined /> },
  INFO:      { color: '#3B82F6', label: 'Information', icon: <InfoCircleOutlined /> },
};

const categoryOptions = [
  { value: '', label: 'Toutes catégories' },
  { value: 'ACADEMIC', label: 'Académique' },
  { value: 'ATTENDANCE', label: 'Présence' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'LIBRARY', label: 'Bibliothèque' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'CANTEEN', label: 'Cantine' },
  { value: 'MESSAGE', label: 'Messages' },
  { value: 'SYSTEM', label: 'Système' },
];

const priorityOptions = [
  { value: '', label: 'Toutes priorités' },
  { value: 'URGENT', label: '🔴 Urgente' },
  { value: 'IMPORTANT', label: '🟡 Importante' },
  { value: 'INFO', label: '🔵 Information' },
];

const prefCategories: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'academic', label: 'Académique', icon: <BookOutlined /> },
  { key: 'attendance', label: 'Présence', icon: <CheckCircleOutlined /> },
  { key: 'finance', label: 'Finance', icon: <DollarOutlined /> },
  { key: 'library', label: 'Bibliothèque', icon: <BookOutlined /> },
  { key: 'transport', label: 'Transport', icon: <CarOutlined /> },
  { key: 'canteen', label: 'Cantine', icon: <CoffeeOutlined /> },
  { key: 'messages', label: 'Messages', icon: <MessageOutlined /> },
  { key: 'system', label: 'Système', icon: <DesktopOutlined /> },
];

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  notification_type?: string;
  type?: string;
  priority?: string;
  priority_display?: string;
  category?: string;
  category_display?: string;
  related_object_type?: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [prefsOpen, setPrefsOpen] = useState(false);

  const { data, isLoading, refetch } = useNotifications({ page_size: 100 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { data: prefsData } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const { data: statsData } = useNotificationStats();
  const { data: schoolsData } = useSchools(isSuperAdmin ? { page_size: 100 } : undefined);

  const prefs = prefsData as NotificationPreference | undefined;
  const stats = statsData as NotificationStats | undefined;
  const notifications = (data?.results || []) as unknown as NotificationRecord[];

  const filtered = useMemo(() => notifications.filter((n) => {
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'read' && !n.is_read) return false;
    if (priorityFilter && n.priority !== priorityFilter) return false;
    if (categoryFilter && n.category !== categoryFilter) return false;
    return true;
  }), [notifications, filter, priorityFilter, categoryFilter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = (id: string) => markRead.mutate(id);
  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => { message.success('Toutes les notifications marquées comme lues'); refetch(); },
    });
  };

  const handlePrefChange = (key: string, value: boolean) => {
    updatePrefs.mutate({ [key]: value });
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

  const _schools = (schoolsData?.results || []) as { id: string; name: string }[];
  void _schools; // available for super admin send form if needed

  return (
    <div className="sa-page nf-page">
      <PageHeader
        title="Centre de notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
        icon={<BellOutlined />}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<SettingOutlined />} onClick={() => setPrefsOpen(true)}>Préférences</Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
            {unreadCount > 0 && (
              <Button type="primary" icon={<CheckOutlined />} onClick={handleMarkAllRead} loading={markAllRead.isPending}>
                Tout marquer lu
              </Button>
            )}
          </div>
        }
      />

      {/* ── Stats cards ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total (30j)" value={stats.total} icon={<BellOutlined />} variant="info" />
          <StatCard label="Non lues" value={stats.unread} icon={<InfoCircleOutlined />} variant="warning" />
          <StatCard label="Taux de lecture" value={`${stats.read_rate}%`} icon={<CheckCircleOutlined />} variant="success" />
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
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
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <Select
            prefix={<FilterOutlined />}
            options={priorityOptions}
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 170 }}
          />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
          />
        </div>
      </div>

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
            const pCfg = notif.priority ? priorityConfig[notif.priority] : null;
            const handleCardClick = () => {
              if (!notif.is_read) handleMarkRead(notif.id);
              if (nType === 'PAYMENT') {
                navigate(notif.related_object_type === 'payment_expired' ? '/financial?status=expire' : '/financial');
              } else if (nType === 'ATTENDANCE') navigate('/attendance');
              else if (nType === 'HOMEWORK') navigate('/homework');
              else if (nType === 'GRADE') navigate('/grades');
              else if (nType === 'LIBRARY') navigate('/library');
              else if (nType === 'TRANSPORT') navigate('/transport');
              else if (nType === 'CANTEEN') navigate('/cantine');
            };
            return (
              <div
                key={notif.id}
                className={`nf-card ${notif.is_read ? 'nf-card--read' : ''} ${notif.priority === 'URGENT' ? 'nf-card--urgent' : ''}`}
                style={{ borderLeftColor: cfg.borderColor, cursor: 'pointer' }}
                onClick={handleCardClick}
              >
                <div className="nf-card__icon" style={{ color: cfg.color, background: `${cfg.color}15` }}>
                  {cfg.icon}
                </div>
                <div className="nf-card__body">
                  <div className="nf-card__header">
                    <span className="nf-card__title">{notif.title || 'Notification'}</span>
                    {pCfg && (
                      <Tag color={pCfg.color} style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>
                        {pCfg.icon} {pCfg.label}
                      </Tag>
                    )}
                    {notif.category_display && (
                      <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>{notif.category_display}</Tag>
                    )}
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
                      <button className="nf-card__mark-btn" onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}>
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

      {/* ── Preferences Drawer ── */}
      <Drawer
        title="Préférences de notifications"
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        width={460}
      >
        {prefs ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Per-category toggles */}
            <div>
              <h4 style={{ marginBottom: 12, fontWeight: 600 }}>Notifications push par catégorie</h4>
              {prefCategories.map((cat) => (
                <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-default, #E2E8F0)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cat.icon} {cat.label}
                  </span>
                  <Switch
                    size="small"
                    checked={prefs[`push_${cat.key}` as keyof NotificationPreference] as boolean}
                    onChange={(v) => handlePrefChange(`push_${cat.key}`, v)}
                  />
                </div>
              ))}
            </div>

            {/* SMS toggles */}
            <div>
              <h4 style={{ marginBottom: 12, fontWeight: 600 }}>Notifications SMS par catégorie</h4>
              {prefCategories.filter(c => c.key !== 'system').map((cat) => (
                <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-default, #E2E8F0)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cat.icon} {cat.label}
                  </span>
                  <Switch
                    size="small"
                    checked={prefs[`sms_${cat.key}` as keyof NotificationPreference] as boolean}
                    onChange={(v) => handlePrefChange(`sms_${cat.key}`, v)}
                  />
                </div>
              ))}
            </div>

            {/* Silent mode */}
            <div>
              <h4 style={{ marginBottom: 12, fontWeight: 600 }}>
                <ClockCircleOutlined /> Mode silencieux
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Activer le mode silencieux</span>
                <Switch
                  checked={prefs.silent_mode_enabled}
                  onChange={(v) => handlePrefChange('silent_mode_enabled', v)}
                />
              </div>
              {prefs.silent_mode_enabled && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>De</span>
                  <TimePicker
                    format="HH:mm"
                    placeholder="Début"
                    onChange={(_time, timeStr) => updatePrefs.mutate({ silent_start_time: timeStr as string })}
                    style={{ width: 100 }}
                  />
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>à</span>
                  <TimePicker
                    format="HH:mm"
                    placeholder="Fin"
                    onChange={(_time, timeStr) => updatePrefs.mutate({ silent_end_time: timeStr as string })}
                    style={{ width: 100 }}
                  />
                </div>
              )}
            </div>

            {/* Weekly summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-default, #E2E8F0)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Résumé hebdomadaire</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Recevez un résumé chaque dimanche</div>
              </div>
              <Switch
                checked={prefs.weekly_summary_enabled}
                onChange={(v) => handlePrefChange('weekly_summary_enabled', v)}
              />
            </div>
          </div>
        ) : (
          <LoadingSkeleton variant="card" rows={8} />
        )}
      </Drawer>
    </div>
  );
};

export default NotificationsPage;
