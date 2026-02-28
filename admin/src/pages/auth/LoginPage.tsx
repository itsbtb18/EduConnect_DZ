import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Form, Input, Button } from 'antd';
import {
  SafetyCertificateOutlined,
  TeamOutlined,
  BarChartOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to={isSuperAdmin ? '/platform/dashboard' : '/dashboard'} replace />;

  const onFinish = async (values: { phone_number: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      await login(values.phone_number, values.password);
      // Redirect is handled by the isAuthenticated check above on re-render
    } catch {
      setError('Numéro de téléphone ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left branding */}
      <div className="login-brand">
        <div className="login-brand__logo">
          <div className="login-brand__mark">EC</div>
          <div className="login-brand__name">
            Edu<span>Connect</span>
          </div>
        </div>

        <h1 className="login-brand__headline">
          Gestion scolaire<br />
          <span>intelligente</span>
        </h1>
        <p className="login-brand__sub">
          Plateforme complete de gestion pour les etablissements scolaires algeriens.
          Simplifiez vos processus administratifs et pedagogiques.
        </p>

        <div className="login-brand__features">
          <div className="login-brand__feature">
            <div className="login-brand__feature-icon"><TeamOutlined /></div>
            Gestion des eleves et enseignants
          </div>
          <div className="login-brand__feature">
            <div className="login-brand__feature-icon"><BarChartOutlined /></div>
            Suivi des notes et absences en temps reel
          </div>
          <div className="login-brand__feature">
            <div className="login-brand__feature-icon"><MessageOutlined /></div>
            Communication parents-ecole integree
          </div>
          <div className="login-brand__feature">
            <div className="login-brand__feature-icon"><SafetyCertificateOutlined /></div>
            Securite et confidentialite des donnees
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="login-form-panel">
        <div className="login-card">
          <h2 className="login-card__title">Connexion</h2>
          <p className="login-card__sub">Connectez-vous a votre espace administrateur</p>

          {error && <div className="login-error">{error}</div>}

          <Form layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
            <Form.Item
              label="Numero de telephone"
              name="phone_number"
              rules={[{ required: true, message: 'Veuillez entrer votre numero' }]}
            >
              <Input placeholder="0550000000" />
            </Form.Item>

            <Form.Item
              label="Mot de passe"
              name="password"
              rules={[{ required: true, message: 'Veuillez entrer votre mot de passe' }]}
            >
              <Input.Password placeholder="Votre mot de passe" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Se connecter
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
