import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import {
  SafetyCertificateOutlined,
  TeamOutlined,
  BarChartOutlined,
  MessageOutlined,
  LockOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { otpAPI } from '../../api/securityService';
import ilmiLogo from '../../assets/ilmi-logo.png';
import './LoginPage.css';

type LoginStep = 'credentials' | 'otp' | 'totp';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-step state
  const [step, setStep] = useState<LoginStep>('credentials');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Lockout state
  const [lockedUntil, setLockedUntil] = useState<number>(0); // seconds remaining
  const lockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (lockedUntil > 0) {
      lockIntervalRef.current = setInterval(() => {
        setLockedUntil((prev) => {
          if (prev <= 1) {
            if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    };
  }, [lockedUntil]);

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to={isSuperAdmin ? '/platform/dashboard' : '/dashboard'} replace />;

  const onFinishCredentials = async (values: { phone_number: string; password: string }) => {
    setLoading(true);
    setError('');
    setRemainingAttempts(null);
    try {
      await login(values.phone_number, values.password);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 423) {
          // Account locked
          const remaining = data?.remaining_seconds || 1800;
          setLockedUntil(remaining);
          setError(data?.detail || 'Compte temporairement verrouillé');
          return;
        }

        if (status === 200 || status === 202) {
          // Should not reach here via catch, but handle just in case
        }

        if (data?.requires_otp) {
          setPhoneNumber(values.phone_number);
          setStep('otp');
          setError('');
          return;
        }

        if (data?.requires_totp) {
          setPhoneNumber(values.phone_number);
          setStep('totp');
          setError('');
          return;
        }

        if (status === 401) {
          const attempts = data?.remaining_attempts;
          if (typeof attempts === 'number') {
            setRemainingAttempts(attempts);
          }
          setError(data?.detail || 'Numéro de téléphone ou mot de passe incorrect');
        } else if (status === 429) {
          setError('Trop de tentatives. Veuillez réessayer plus tard.');
        } else {
          setError(data?.detail || 'Erreur de connexion. Veuillez réessayer.');
        }
      } else {
        setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle login response that may require OTP/TOTP
  const handleLoginResponse = async (values: { phone_number: string; password: string }) => {
    setLoading(true);
    setError('');
    setRemainingAttempts(null);
    try {
      const { authAPI } = await import('../../api/services');
      const { data } = await authAPI.login(values.phone_number, values.password);

      if (data.requires_otp) {
        setPhoneNumber(values.phone_number);
        setStep('otp');
        return;
      }
      if (data.requires_totp) {
        setPhoneNumber(values.phone_number);
        setStep('totp');
        return;
      }

      // Normal login — store tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      window.location.reload();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const respData = err.response?.data;

        if (status === 423) {
          setLockedUntil(respData?.remaining_seconds || 1800);
          setError(respData?.detail || 'Compte temporairement verrouillé');
        } else if (respData?.requires_otp) {
          setPhoneNumber(values.phone_number);
          setStep('otp');
        } else if (respData?.requires_totp) {
          setPhoneNumber(values.phone_number);
          setStep('totp');
        } else if (status === 401) {
          if (typeof respData?.remaining_attempts === 'number') {
            setRemainingAttempts(respData.remaining_attempts);
          }
          setError(respData?.detail || 'Identifiants incorrects');
        } else if (status === 429) {
          setError('Trop de tentatives.');
        } else {
          setError(respData?.detail || 'Erreur de connexion.');
        }
      } else {
        setError('Erreur de connexion au serveur.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishOTP = async (values: { code: string }) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await otpAPI.verifyOtp({ phone_number: phoneNumber, code: values.code });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      window.location.reload();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Code OTP invalide');
      } else {
        setError('Erreur de vérification');
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishTOTP = async (values: { code: string }) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await otpAPI.verifyTotp({ phone_number: phoneNumber, code: values.code });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      window.location.reload();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Code TOTP invalide');
      } else {
        setError('Erreur de vérification');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (step === 'otp') {
      return (
        <>
          <h2 className="login-card__title">Vérification SMS</h2>
          <p className="login-card__sub">
            Un code de vérification a été envoyé à votre numéro de téléphone
          </p>
          {error && <div className="login-error">{error}</div>}
          <Form layout="vertical" onFinish={onFinishOTP} autoComplete="off" size="large">
            <Form.Item
              label="Code de vérification"
              name="code"
              rules={[
                { required: true, message: 'Entrez le code à 6 chiffres' },
                { len: 6, message: 'Le code doit contenir 6 chiffres' },
              ]}
            >
              <Input
                placeholder="000000"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Vérifier
              </Button>
            </Form.Item>
            <Button type="link" onClick={() => { setStep('credentials'); setError(''); }}>
              ← Retour à la connexion
            </Button>
          </Form>
        </>
      );
    }

    if (step === 'totp') {
      return (
        <>
          <h2 className="login-card__title">
            <LockOutlined style={{ marginRight: 8 }} />
            Authentification 2FA
          </h2>
          <p className="login-card__sub">
            Entrez le code de votre application d'authentification (Google Authenticator)
          </p>
          {error && <div className="login-error">{error}</div>}
          <Form layout="vertical" onFinish={onFinishTOTP} autoComplete="off" size="large">
            <Form.Item
              label="Code TOTP"
              name="code"
              rules={[
                { required: true, message: 'Entrez le code à 6 chiffres' },
                { len: 6, message: 'Le code doit contenir 6 chiffres' },
              ]}
            >
              <Input
                placeholder="000000"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Vérifier
              </Button>
            </Form.Item>
            <Button type="link" onClick={() => { setStep('credentials'); setError(''); }}>
              ← Retour à la connexion
            </Button>
          </Form>
        </>
      );
    }

    // Default: credentials step
    return (
      <>
        <h2 className="login-card__title">Connexion</h2>
        <p className="login-card__sub">Connectez-vous a votre espace administrateur</p>

        {lockedUntil > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<LockOutlined />}
            message="Compte verrouillé"
            description={`Trop de tentatives échouées. Réessayez dans ${formatCountdown(lockedUntil)}.`}
            style={{ marginBottom: 16 }}
          />
        )}

        {error && !lockedUntil && <div className="login-error">{error}</div>}

        {remainingAttempts !== null && remainingAttempts <= 3 && (
          <Alert
            type="warning"
            showIcon
            message={`${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''} avant le verrouillage du compte`}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical" onFinish={handleLoginResponse} autoComplete="off" size="large">
          <Form.Item
            label="Numero de telephone"
            name="phone_number"
            rules={[{ required: true, message: 'Veuillez entrer votre numero' }]}
          >
            <Input placeholder="Entrez votre numéro" disabled={lockedUntil > 0} />
          </Form.Item>

          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[{ required: true, message: 'Veuillez entrer votre mot de passe' }]}
          >
            <Input.Password placeholder="Votre mot de passe" disabled={lockedUntil > 0} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} disabled={lockedUntil > 0} block>
              Se connecter
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  };

  return (
    <div className="login-page">
      {/* Left branding */}
      <div className="login-brand">
        <div className="login-brand__logo">
          <img src={ilmiLogo} alt="ILMI Platform" className="login-brand__logo-img" />
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
          <div className="login-card__logo">
            <img src={ilmiLogo} alt="ILMI" className="login-card__logo-img" />
          </div>
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
