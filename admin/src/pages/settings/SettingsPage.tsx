import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Switch, Divider, message, Tabs, Select } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BellOutlined,
  GlobalOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useUpdateProfile, useChangePassword } from '../../hooks/useApi';

const NOTIF_STORAGE_KEY = 'madrassa_notification_prefs';

interface NotifPrefs {
  email: boolean;
  sms: boolean;
  enrollments: boolean;
  payments: boolean;
  absences: boolean;
}

const defaultNotifPrefs: NotifPrefs = {
  email: true,
  sms: true,
  enrollments: true,
  payments: true,
  absences: true,
};

const GENERAL_STORAGE_KEY = 'madrassa_general_settings';

interface GeneralSettings {
  language: string;
  timezone: string;
  academic_year: string;
}

const defaultGeneralSettings: GeneralSettings = {
  language: 'fr',
  timezone: 'africa_algiers',
  academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
};

// Generate academic year options dynamically
function getAcademicYears(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear + 1; y >= currentYear - 3; y--) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [generalForm] = Form.useForm();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  // --- Notification preferences with persistence ---
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(() => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      return saved ? { ...defaultNotifPrefs, ...JSON.parse(saved) } : defaultNotifPrefs;
    } catch { return defaultNotifPrefs; }
  });

  const handleNotifToggle = useCallback((key: keyof NotifPrefs, checked: boolean) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: checked };
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      message.success('Préférence enregistrée');
      return updated;
    });
  }, []);

  // --- General settings with persistence ---
  const [generalSettings] = useState<GeneralSettings>(() => {
    try {
      const saved = localStorage.getItem(GENERAL_STORAGE_KEY);
      return saved ? { ...defaultGeneralSettings, ...JSON.parse(saved) } : defaultGeneralSettings;
    } catch { return defaultGeneralSettings; }
  });

  useEffect(() => {
    generalForm.setFieldsValue(generalSettings);
  }, [generalForm, generalSettings]);

  const handleGeneralSave = async () => {
    try {
      const values = await generalForm.validateFields();
      localStorage.setItem(GENERAL_STORAGE_KEY, JSON.stringify(values));
      message.success('Paramètres généraux enregistrés');
    } catch { /* validation */ }
  };

  const handleProfileSave = async () => {
    try {
      const values = await profileForm.validateFields();
      if (!user?.id) {
        message.error('Utilisateur non identifié');
        return;
      }
      await updateProfile.mutateAsync({ id: user.id, ...values });
    } catch {
      // validation
    }
  };

  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.new_password !== values.confirm_password) {
        message.error('Les mots de passe ne correspondent pas');
        return;
      }
      await changePassword.mutateAsync({
        old_password: values.current_password,
        new_password: values.new_password,
      });
      passwordForm.resetFields();
    } catch {
      // validation
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span className="settings-tab-label">
          <UserOutlined /> Profil
        </span>
      ),
      children: (
        <Card>
          <div className="settings-profile-header">
            <div className="avatar avatar--lg avatar--primary">
              {(user?.first_name?.[0] || 'A').toUpperCase()}
              {(user?.last_name?.[0] || 'D').toUpperCase()}
            </div>
            <div>
              <h3 className="settings-profile-name">
                {user ? `${user.first_name} ${user.last_name}`.trim() || 'Admin' : 'Admin'}
              </h3>
              <span className="settings-profile-role">{user?.role || 'superadmin'}</span>
            </div>
          </div>

          <Form
            form={profileForm}
            layout="vertical"
            initialValues={{
              first_name: user?.first_name || '',
              last_name: user?.last_name || '',
              email: user?.email || '',
              phone_number: user?.phone_number || '',
            }}
          >
            <div className="grid-2col">
              <Form.Item label="Prénom" name="first_name">
                <Input />
              </Form.Item>
              <Form.Item label="Nom" name="last_name">
                <Input />
              </Form.Item>
            </div>
            <div className="grid-2col">
              <Form.Item label="Email" name="email">
                <Input />
              </Form.Item>
              <Form.Item label="Téléphone" name="phone_number">
                <Input disabled />
              </Form.Item>
            </div>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleProfileSave} loading={updateProfile.isPending}>
              Enregistrer
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span className="settings-tab-label">
          <LockOutlined /> Sécurité
        </span>
      ),
      children: (
        <Card>
          <h3 className="settings-section-title">Changer le mot de passe</h3>
          <Form form={passwordForm} layout="vertical" className="settings-form--narrow">
            <Form.Item label="Mot de passe actuel" name="current_password" rules={[{ required: true, message: 'Requis' }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item label="Nouveau mot de passe" name="new_password" rules={[{ required: true, message: 'Requis' }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item label="Confirmer" name="confirm_password" rules={[{ required: true, message: 'Requis' }]}>
              <Input.Password />
            </Form.Item>
            <Button type="primary" icon={<LockOutlined />} onClick={handlePasswordChange} loading={changePassword.isPending}>
              Modifier le mot de passe
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span className="settings-tab-label">
          <BellOutlined /> Notifications
        </span>
      ),
      children: (
        <Card>
          <h3 className="settings-section-title">Préférences de notification</h3>
          <div className="settings-notif-list">
            {([
              { key: 'email' as const, label: 'Notifications par email', desc: 'Recevoir les notifications importantes par email' },
              { key: 'sms' as const, label: 'Notifications SMS', desc: 'Recevoir les alertes urgentes par SMS' },
              { key: 'enrollments' as const, label: 'Nouvelles inscriptions', desc: 'Notifier lors de nouvelles inscriptions' },
              { key: 'payments' as const, label: 'Paiements', desc: 'Notifier lors de nouveaux paiements' },
              { key: 'absences' as const, label: 'Absences', desc: "Alertes d'absences non justifiées" },
            ]).map((item) => (
              <div key={item.key} className="settings-notif-item">
                <div>
                  <div className="settings-notif-label">{item.label}</div>
                  <div className="settings-notif-desc">{item.desc}</div>
                </div>
                <Switch
                  checked={notifPrefs[item.key]}
                  onChange={(checked) => handleNotifToggle(item.key, checked)}
                />
              </div>
            ))}
          </div>
        </Card>
      ),
    },
    {
      key: 'general',
      label: (
        <span className="settings-tab-label">
          <GlobalOutlined /> Général
        </span>
      ),
      children: (
        <Card>
          <h3 className="settings-section-title">Paramètres généraux</h3>
          <Form form={generalForm} layout="vertical" className="settings-form--narrow">
            <Form.Item label="Langue" name="language">
              <Select>
                <Select.Option value="fr">Français</Select.Option>
                <Select.Option value="ar">Arabe</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Fuseau horaire" name="timezone">
              <Select>
                <Select.Option value="africa_algiers">Afrique/Alger (UTC+1)</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Année scolaire" name="academic_year">
              <Select>
                {getAcademicYears().map((y) => (
                  <Select.Option key={y} value={y}>{y}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleGeneralSave}>
              Enregistrer
            </Button>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Paramètres</h1>
          <p>Configuration de votre compte et de l'application</p>
        </div>
      </div>

      <Tabs items={tabItems} tabPosition="left" style={{ minHeight: 400 }} />
    </div>
  );
};

export default SettingsPage;
