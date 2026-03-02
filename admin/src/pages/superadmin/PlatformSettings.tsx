import React, { useState, useEffect } from 'react';
import { Card, Switch, Button, Tag, Divider, message, Select, InputNumber } from 'antd';
import {
  SettingOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  BellOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MailOutlined,
  LockOutlined,
  CheckCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { usePlatformStats, usePlatformSettings, useUpdatePlatformSettings } from '../../hooks/useApi';
import './SuperAdmin.css';

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

const PlatformSettings: React.FC = () => {
  const { data: stats } = usePlatformStats();
  const { data: apiConfig } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();

  const [config, setConfig] = useState<PlatformConfig>(loadConfig);
  const [dirty, setDirty] = useState(false);

  // Sync from API when available
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
    // Save to localStorage as fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Try API save
    try {
      await updateSettings.mutateAsync(config as unknown as Record<string, unknown>);
    } catch {
      // API save failed, localStorage already saved
      message.success('Configuration sauvegardée localement');
    }
    setDirty(false);
  };

  const handleTestEmail = () => {
    message.info('Test d\'email envoyé (simulation). Configurez votre serveur SMTP pour l\'envoi réel.');
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>
            <SettingOutlined style={{ marginRight: 10 }} />
            Paramètres de la plateforme
          </h1>
          <p>Configuration globale de la plateforme ILMI</p>
        </div>
        <div className="page-header__actions">
          {dirty && (
            <Tag color="warning">Modifications non sauvegardées</Tag>
          )}
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
      </div>

      <div className="sa-settings-grid">
        {/* General settings */}
        <Card
          title={
            <span className="section-title">
              <GlobalOutlined /> Général
            </span>
          }
          className="sa-setting-card"
        >
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Mode maintenance</h4>
              <p>Désactiver l&apos;accès à la plateforme temporairement</p>
            </div>
            <Switch
              checked={config.maintenanceMode}
              onChange={(v) => update('maintenanceMode', v)}
            />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Inscription ouverte</h4>
              <p>Permettre aux nouvelles écoles de s&apos;inscrire</p>
            </div>
            <Switch
              checked={config.openRegistration}
              onChange={(v) => update('openRegistration', v)}
            />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Langue par défaut</h4>
              <p>Langue de l&apos;interface pour les nouveaux utilisateurs</p>
            </div>
            <Select
              value={config.defaultLanguage}
              onChange={(v) => update('defaultLanguage', v)}
              style={{ width: 140 }}
              options={[
                { value: 'fr', label: '🇫🇷 Français' },
                { value: 'ar', label: '🇩🇿 العربية' },
                { value: 'en', label: '🇬🇧 English' },
              ]}
            />
          </div>
        </Card>

        {/* Security */}
        <Card
          title={
            <span className="section-title">
              <LockOutlined /> Sécurité
            </span>
          }
          className="sa-setting-card"
        >
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Authentification à deux facteurs</h4>
              <p>Exiger 2FA pour les administrateurs</p>
            </div>
            <Switch
              checked={config.require2FA}
              onChange={(v) => update('require2FA', v)}
            />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Verrouillage après échecs</h4>
              <p>Bloquer après tentatives échouées</p>
            </div>
            <Switch
              checked={config.lockAfterFailures}
              onChange={(v) => update('lockAfterFailures', v)}
            />
          </div>
          {config.lockAfterFailures && (
            <div className="sa-setting-item">
              <div className="sa-setting-item__info">
                <h4>Tentatives maximales</h4>
                <p>Nombre de tentatives avant verrouillage</p>
              </div>
              <InputNumber
                min={3}
                max={10}
                value={config.maxLoginAttempts}
                onChange={(v) => update('maxLoginAttempts', v ?? 5)}
                style={{ width: 80 }}
              />
            </div>
          )}
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Durée de session JWT</h4>
              <p>Durée de validité du token d&apos;accès (minutes)</p>
            </div>
            <InputNumber
              min={5}
              max={120}
              value={config.sessionDurationMinutes}
              onChange={(v) => update('sessionDurationMinutes', v ?? 30)}
              style={{ width: 80 }}
              addonAfter="min"
            />
          </div>
        </Card>

        {/* Notifications */}
        <Card
          title={
            <span className="section-title">
              <BellOutlined /> Notifications
            </span>
          }
          className="sa-setting-card"
        >
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Notifications par email</h4>
              <p>Envoyer des emails aux administrateurs</p>
            </div>
            <Switch
              checked={config.emailNotifications}
              onChange={(v) => update('emailNotifications', v)}
            />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Notifications push</h4>
              <p>Notifications mobiles via Firebase</p>
            </div>
            <Switch
              checked={config.pushNotifications}
              onChange={(v) => update('pushNotifications', v)}
            />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Alertes d&apos;abonnement</h4>
              <p>Alerter avant expiration des abonnements</p>
            </div>
            <Switch
              checked={config.subscriptionAlerts}
              onChange={(v) => update('subscriptionAlerts', v)}
            />
          </div>
          {config.subscriptionAlerts && (
            <div className="sa-setting-item">
              <div className="sa-setting-item__info">
                <h4>Jours avant alerte</h4>
                <p>Délai d&apos;alerte avant expiration</p>
              </div>
              <InputNumber
                min={1}
                max={30}
                value={config.alertDaysBeforeExpiry}
                onChange={(v) => update('alertDaysBeforeExpiry', v ?? 7)}
                style={{ width: 80 }}
                addonAfter="jours"
              />
            </div>
          )}
        </Card>

        {/* System info */}
        <Card
          title={
            <span className="section-title">
              <DatabaseOutlined /> Système
            </span>
          }
          className="sa-setting-card"
        >
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Version de la plateforme</h4>
              <p>ILMI v2.0.0</p>
            </div>
            <Tag color="green" icon={<CheckCircleOutlined />}>Stable</Tag>
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Écoles enregistrées</h4>
              <p>Nombre total d&apos;établissements</p>
            </div>
            <Tag color="blue">{stats?.total_schools ?? stats?.schools?.total ?? 0}</Tag>
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Utilisateurs actifs</h4>
              <p>Nombre total d&apos;utilisateurs actifs</p>
            </div>
            <Tag color="blue">{stats?.total_users ?? stats?.users?.total ?? 0}</Tag>
          </div>

          <Divider />

          <div className="sa-settings-actions">
            <Button
              icon={<CloudOutlined />}
              onClick={handleSave}
              loading={updateSettings.isPending}
              disabled={!dirty}
            >
              Sauvegarder la configuration
            </Button>
            <Button icon={<MailOutlined />} onClick={handleTestEmail}>
              Tester les emails
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformSettings;
