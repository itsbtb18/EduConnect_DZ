import React from 'react';
import { Card, Switch, Button, Tag, Divider } from 'antd';
import {
  SettingOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  BellOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { usePlatformStats } from '../../hooks/useApi';
import './SuperAdmin.css';

const PlatformSettings: React.FC = () => {
  const { data: stats } = usePlatformStats();

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Paramètres de la plateforme</h1>
          <p>Configuration globale de la plateforme EduConnect Algeria</p>
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
            <Switch defaultChecked={false} />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Inscription ouverte</h4>
              <p>Permettre aux nouvelles écoles de s&apos;inscrire</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Langue par défaut</h4>
              <p>Langue de l&apos;interface pour les nouveaux utilisateurs</p>
            </div>
            <Tag color="blue">Français</Tag>
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
            <Switch defaultChecked={false} />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Verrouillage après échecs</h4>
              <p>Bloquer après 5 tentatives échouées (30 min)</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Durée de session JWT</h4>
              <p>Durée de validité du token d&apos;accès</p>
            </div>
            <Tag>30 minutes</Tag>
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
            <Switch defaultChecked={false} />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Notifications push</h4>
              <p>Notifications mobiles via Firebase</p>
            </div>
            <Switch defaultChecked={false} />
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Alertes d&apos;abonnement</h4>
              <p>Alerter avant expiration des abonnements</p>
            </div>
            <Switch defaultChecked={true} />
          </div>
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
              <p>EduConnect Algeria v1.0.0</p>
            </div>
            <Tag color="green">Stable</Tag>
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Écoles enregistrées</h4>
              <p>Nombre total d&apos;établissements</p>
            </div>
            <Tag color="blue">{stats?.schools?.total ?? 0}</Tag>
          </div>
          <div className="sa-setting-item">
            <div className="sa-setting-item__info">
              <h4>Utilisateurs actifs</h4>
              <p>Nombre total d&apos;utilisateurs actifs</p>
            </div>
            <Tag color="blue">{stats?.users?.total ?? 0}</Tag>
          </div>

          <Divider />

          <div className="sa-settings-actions">
            <Button icon={<CloudOutlined />} disabled>
              Sauvegarder la configuration
            </Button>
            <Button icon={<MailOutlined />} disabled>
              Tester les emails
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformSettings;
