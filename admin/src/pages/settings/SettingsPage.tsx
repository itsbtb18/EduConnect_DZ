import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Switch, Divider, message, Tabs, Select } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BellOutlined,
  GlobalOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useUpdateProfile, useChangePassword } from '../../hooks/useApi';

const NOTIF_STORAGE_KEY = 'ilmi_notification_prefs';

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

const GENERAL_STORAGE_KEY = 'ilmi_general_settings';

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
  const { t, i18n } = useTranslation();
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
      message.success(t('settings.prefSaved'));
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
      if (values.language && values.language !== i18n.language) {
        i18n.changeLanguage(values.language);
      }
      message.success(t('settings.generalSaved'));
    } catch { /* validation */ }
  };

  const handleProfileSave = async () => {
    try {
      const values = await profileForm.validateFields();
      if (!user?.id) {
        message.error(t('settings.userNotFound'));
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
        message.error(t('settings.passwordMismatch'));
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
          <UserOutlined /> {t('settings.profile')}
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
              <Form.Item label={t('settings.firstName')} name="first_name">
                <Input />
              </Form.Item>
              <Form.Item label={t('settings.lastName')} name="last_name">
                <Input />
              </Form.Item>
            </div>
            <div className="grid-2col">
              <Form.Item label={t('settings.email')} name="email">
                <Input />
              </Form.Item>
              <Form.Item label={t('settings.phone')} name="phone_number">
                <Input disabled />
              </Form.Item>
            </div>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleProfileSave} loading={updateProfile.isPending}>
              {t('common.save')}
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span className="settings-tab-label">
          <LockOutlined /> {t('settings.security')}
        </span>
      ),
      children: (
        <Card>
          <h3 className="settings-section-title">{t('settings.changePassword')}</h3>
          <Form form={passwordForm} layout="vertical" className="settings-form--narrow">
            <Form.Item label={t('settings.currentPassword')} name="current_password" rules={[{ required: true, message: t('common.required') }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item label={t('settings.newPassword')} name="new_password" rules={[{ required: true, message: t('common.required') }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item label={t('settings.confirmPassword')} name="confirm_password" rules={[{ required: true, message: t('common.required') }]}>
              <Input.Password />
            </Form.Item>
            <Button type="primary" icon={<LockOutlined />} onClick={handlePasswordChange} loading={changePassword.isPending}>
              {t('settings.changePassword')}
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span className="settings-tab-label">
          <BellOutlined /> {t('settings.notifications')}
        </span>
      ),
      children: (
        <Card>
          <h3 className="settings-section-title">{t('settings.notificationPrefs')}</h3>
          <div className="settings-notif-list">
            {([
              { key: 'email' as const, label: t('settings.emailNotif'), desc: t('settings.emailNotifDesc') },
              { key: 'sms' as const, label: t('settings.smsNotif'), desc: t('settings.smsNotifDesc') },
              { key: 'enrollments' as const, label: t('settings.enrollmentNotif'), desc: t('settings.enrollmentNotifDesc') },
              { key: 'payments' as const, label: t('settings.paymentNotif'), desc: t('settings.paymentNotifDesc') },
              { key: 'absences' as const, label: t('settings.absenceNotif'), desc: t('settings.absenceNotifDesc') },
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
          <GlobalOutlined /> {t('settings.general')}
        </span>
      ),
      children: (
        <Card>
          <h3 className="settings-section-title">{t('settings.generalSettings')}</h3>
          <Form form={generalForm} layout="vertical" className="settings-form--narrow">
            <Form.Item label={t('settings.language')} name="language">
              <Select>
                <Select.Option value="fr">{t('settings.french')}</Select.Option>
                <Select.Option value="ar">{t('settings.arabic')}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label={t('settings.timezone')} name="timezone">
              <Select>
                <Select.Option value="africa_algiers">{t('settings.algiersTimezone')}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label={t('settings.academicYear')} name="academic_year">
              <Select>
                {getAcademicYears().map((y) => (
                  <Select.Option key={y} value={y}>{y}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleGeneralSave}>
              {t('common.save')}
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
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </div>

      <Tabs items={tabItems} tabPosition="left" style={{ minHeight: 400 }} />
    </div>
  );
};

export default SettingsPage;
