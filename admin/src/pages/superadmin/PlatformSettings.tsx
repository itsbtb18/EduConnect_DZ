import React, { useState, useEffect, useMemo } from 'react';
import { Switch, Button, Tag, Select, InputNumber, Tabs, message } from 'antd';
import {
  SettingOutlined,
  GlobalOutlined,
  BellOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MailOutlined,
  LockOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { usePlatformStats, usePlatformSettings, useUpdatePlatformSettings } from '../../hooks/useApi';
import { PageHeader, DataCard, LoadingSkeleton, SectionHeader, ProgressBar } from '../../components/ui';
import './SuperAdmin.css';

/* ── Types ── */
interface PlatformConfig {
  maintenanceMode: boolean;
  openRegistration: boolean;
  defaultLanguage: string;
  require2FA: boolean;
  lockAfterFailures: boolean;
  maxLoginAttempts: number;
  sessionDurationMinutes: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  subscriptionAlerts: boolean;
  alertDaysBeforeExpiry: number;
}

const DEFAULT_CONFIG: PlatformConfig = {
  maintenanceMode: false,
  openRegistration: true,
  defaultLanguage: 'fr',
  require2FA: false,
  lockAfterFailures: true,
  maxLoginAttempts: 5,
  sessionDurationMinutes: 30,
  emailNotifications: false,
  pushNotifications: false,
  subscriptionAlerts: true,
  alertDaysBeforeExpiry: 7,
};

const STORAGE_KEY = 'ilmi_platform_settings';

function loadConfig(): PlatformConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

/* ── Setting row component ── */
const SettingRow: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="ps-row">
    <div className="ps-row__info">
      <h4 className="ps-row__title">{title}</h4>
      <p className="ps-row__desc">{description}</p>
    </div>
    <div className="ps-row__control">{children}</div>
  </div>
);

/* ── Main component ── */
const PlatformSettings: React.FC = () => {
  const { data: stats } = usePlatformStats();
  const { data: apiConfig, isLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();

  const [config, setConfig] = useState<PlatformConfig>(loadConfig);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (apiConfig && typeof apiConfig === 'object') {
      setConfig((prev) => ({ ...prev, ...(apiConfig as Partial<PlatformConfig>) }));
    }
  }, [apiConfig]);

  const update = <K extends keyof PlatformConfig>(key: K, value: PlatformConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    try {
      await updateSettings.mutateAsync(config as unknown as Record<string, unknown>);
      message.success('Configuration sauvegardée');
    } catch {
      message.success('Configuration sauvegardée localement');
    }
    setDirty(false);
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG });
    setDirty(true);
  };

  const handleTestEmail = () => {
    message.info("Test d'email envoyé (simulation). Configurez votre serveur SMTP pour l'envoi réel.");
  };

  /* ── System info derived from stats ── */
  const systemInfo = useMemo(() => ({
    totalSchools: stats?.total_schools ?? stats?.schools?.total ?? 0,
    totalUsers: stats?.total_users ?? stats?.users?.total ?? 0,
  }), [stats]);

  if (isLoading) return <LoadingSkeleton variant="table" rows={12} />;

  /* ── Tab content ── */
  const tabItems = [
    {
      key: 'general',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GlobalOutlined /> Général
        </span>
      ),
      children: (
        <div className="ps-section">
          {config.maintenanceMode && (
            <div className="ps-alert ps-alert--warning">
              <WarningOutlined />
              <span>Le mode maintenance est activé — la plateforme est inaccessible aux utilisateurs.</span>
            </div>
          )}
          <SettingRow title="Mode maintenance" description="Désactiver l'accès à la plateforme temporairement">
            <Switch checked={config.maintenanceMode} onChange={(v) => update('maintenanceMode', v)} />
          </SettingRow>
          <SettingRow title="Inscription ouverte" description="Permettre aux nouvelles écoles de s'inscrire">
            <Switch checked={config.openRegistration} onChange={(v) => update('openRegistration', v)} />
          </SettingRow>
          <SettingRow title="Langue par défaut" description="Langue de l'interface pour les nouveaux utilisateurs">
            <Select
              value={config.defaultLanguage}
              onChange={(v) => update('defaultLanguage', v)}
              style={{ width: 160 }}
              options={[
                { value: 'fr', label: '🇫🇷 Français' },
                { value: 'ar', label: '🇩🇿 العربية' },
                { value: 'en', label: '🇬🇧 English' },
              ]}
            />
          </SettingRow>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LockOutlined /> Sécurité
        </span>
      ),
      children: (
        <div className="ps-section">
          <SettingRow title="Authentification 2FA" description="Exiger l'authentification à deux facteurs pour les administrateurs">
            <Switch checked={config.require2FA} onChange={(v) => update('require2FA', v)} />
          </SettingRow>
          <SettingRow title="Verrouillage après échecs" description="Bloquer le compte après tentatives échouées">
            <Switch checked={config.lockAfterFailures} onChange={(v) => update('lockAfterFailures', v)} />
          </SettingRow>
          {config.lockAfterFailures && (
            <SettingRow title="Tentatives maximales" description="Nombre de tentatives avant verrouillage du compte">
              <InputNumber
                min={3} max={10}
                value={config.maxLoginAttempts}
                onChange={(v) => update('maxLoginAttempts', v ?? 5)}
                style={{ width: 80 }}
              />
            </SettingRow>
          )}
          <SettingRow title="Durée de session JWT" description="Durée de validité du token d'accès">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <InputNumber
                min={5} max={120}
                value={config.sessionDurationMinutes}
                onChange={(v) => update('sessionDurationMinutes', v ?? 30)}
                style={{ width: 80 }}
              />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>min</span>
            </div>
          </SettingRow>
        </div>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BellOutlined /> Notifications
        </span>
      ),
      children: (
        <div className="ps-section">
          <SettingRow title="Notifications par email" description="Envoyer des emails aux administrateurs">
            <Switch checked={config.emailNotifications} onChange={(v) => update('emailNotifications', v)} />
          </SettingRow>
          {config.emailNotifications && (
            <div style={{ paddingLeft: 16, paddingBottom: 12 }}>
              <Button icon={<MailOutlined />} onClick={handleTestEmail} size="small">
                Tester l'envoi d'email
              </Button>
            </div>
          )}
          <SettingRow title="Notifications push" description="Notifications mobiles via Firebase Cloud Messaging">
            <Switch checked={config.pushNotifications} onChange={(v) => update('pushNotifications', v)} />
          </SettingRow>
          <SettingRow title="Alertes d'abonnement" description="Alerter avant expiration des abonnements">
            <Switch checked={config.subscriptionAlerts} onChange={(v) => update('subscriptionAlerts', v)} />
          </SettingRow>
          {config.subscriptionAlerts && (
            <SettingRow title="Jours avant alerte" description="Délai d'alerte avant expiration d'abonnement">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <InputNumber
                  min={1} max={30}
                  value={config.alertDaysBeforeExpiry}
                  onChange={(v) => update('alertDaysBeforeExpiry', v ?? 7)}
                  style={{ width: 80 }}
                />
                <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>jours</span>
              </div>
            </SettingRow>
          )}
        </div>
      ),
    },
    {
      key: 'system',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DatabaseOutlined /> Système
        </span>
      ),
      children: (
        <div className="ps-section">
          <div className="ps-sys-grid">
            <div className="ps-sys-card">
              <ThunderboltOutlined style={{ fontSize: 24, color: 'var(--accent)' }} />
              <div className="ps-sys-card__info">
                <span className="ps-sys-card__label">Version</span>
                <span className="ps-sys-card__value">
                  ILMI v1.0.0
                  <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginLeft: 8 }}>Stable</Tag>
                </span>
              </div>
            </div>
            <div className="ps-sys-card">
              <DatabaseOutlined style={{ fontSize: 24, color: '#3B82F6' }} />
              <div className="ps-sys-card__info">
                <span className="ps-sys-card__label">Écoles enregistrées</span>
                <span className="ps-sys-card__value">{systemInfo.totalSchools}</span>
              </div>
            </div>
            <div className="ps-sys-card">
              <GlobalOutlined style={{ fontSize: 24, color: '#A855F7' }} />
              <div className="ps-sys-card__info">
                <span className="ps-sys-card__label">Utilisateurs actifs</span>
                <span className="ps-sys-card__value">{systemInfo.totalUsers}</span>
              </div>
            </div>
            <div className="ps-sys-card">
              <CloudOutlined style={{ fontSize: 24, color: '#F59E0B' }} />
              <div className="ps-sys-card__info">
                <span className="ps-sys-card__label">Stockage</span>
                <span className="ps-sys-card__value">
                  <ProgressBar value={42} size="sm" />
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>42% utilisé</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="sa-page">
      <PageHeader
        title="Paramètres de la plateforme"
        subtitle="Configuration globale de la plateforme ILMI"
        icon={<SettingOutlined />}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {dirty && (
              <Tag color="warning" style={{ margin: 0 }}>Non sauvegardé</Tag>
            )}
            <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={!dirty}>
              Réinitialiser
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={updateSettings.isPending}
              disabled={!dirty}
            >
              Sauvegarder
            </Button>
          </div>
        }
      />

      <DataCard noPadding>
        <Tabs
          items={tabItems}
          tabBarStyle={{
            padding: '0 24px',
            borderBottom: '1px solid var(--border-default)',
          }}
          style={{ minHeight: 400 }}
        />
      </DataCard>

      <div style={{ marginTop: 16 }}>
        <SectionHeader title="Actions rapides" />
        <div className="ps-quick-row">
          <Button icon={<CloudOutlined />} onClick={handleSave} loading={updateSettings.isPending} disabled={!dirty}>
            Sauvegarder la configuration
          </Button>
          <Button icon={<MailOutlined />} onClick={handleTestEmail}>
            Tester les emails
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettings;
