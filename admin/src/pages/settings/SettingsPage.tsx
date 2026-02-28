import React, { useState } from 'react';
import { Card, Form, Input, Button, Switch, Divider, message, Tabs, Select } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BellOutlined,
  GlobalOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async () => {
    try {
      await profileForm.validateFields();
      setSaving(true);
      // API call would go here
      setTimeout(() => {
        message.success('Profil mis a jour');
        setSaving(false);
      }, 500);
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
      message.success('Mot de passe modifie');
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
              <Form.Item label="Prenom" name="first_name">
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
              <Form.Item label="Telephone" name="phone_number">
                <Input disabled />
              </Form.Item>
            </div>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleProfileSave} loading={saving}>
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
          <LockOutlined /> Securite
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
            <Button type="primary" icon={<LockOutlined />} onClick={handlePasswordChange}>
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
          <h3 className="settings-section-title">Preferences de notification</h3>
          <div className="settings-notif-list">
            {[
              { label: 'Notifications par email', desc: 'Recevoir les notifications importantes par email' },
              { label: 'Notifications SMS', desc: 'Recevoir les alertes urgentes par SMS' },
              { label: 'Nouvelles inscriptions', desc: 'Notifier lors de nouvelles inscriptions' },
              { label: 'Paiements', desc: 'Notifier lors de nouveaux paiements' },
              { label: 'Absences', desc: 'Alertes d\'absences non justifiees' },
            ].map((item) => (
              <div key={item.label} className="settings-notif-item">
                <div>
                  <div className="settings-notif-label">{item.label}</div>
                  <div className="settings-notif-desc">{item.desc}</div>
                </div>
                <Switch defaultChecked />
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
          <GlobalOutlined /> General
        </span>
      ),
      children: (
        <Card>
          <h3 className="settings-section-title">Parametres generaux</h3>
          <Form layout="vertical" className="settings-form--narrow">
            <Form.Item label="Langue">
              <Select defaultValue="fr">
                <Select.Option value="fr">Francais</Select.Option>
                <Select.Option value="ar">Arabe</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Fuseau horaire">
              <Select defaultValue="africa_algiers">
                <Select.Option value="africa_algiers">Afrique/Alger (UTC+1)</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Annee scolaire">
              <Select defaultValue="2024-2025">
                <Select.Option value="2024-2025">2024-2025</Select.Option>
                <Select.Option value="2023-2024">2023-2024</Select.Option>
              </Select>
            </Form.Item>
            <Button type="primary" icon={<SaveOutlined />}>
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
          <h1>Parametres</h1>
          <p>Configuration de votre compte et de l'application</p>
        </div>
      </div>

      <Tabs items={tabItems} tabPosition="left" style={{ minHeight: 400 }} />
    </div>
  );
};

export default SettingsPage;
