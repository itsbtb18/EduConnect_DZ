/**
 * Step 1 — Profil de l'école
 * Logo upload + school information form
 */
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, Card, Row, Col } from 'antd';
import { UploadOutlined, CameraOutlined } from '@ant-design/icons';
import { wilayas } from '../../../data/mockData';
import type { ProfileData } from '../../../types/wizard';

/** Convert an absolute logo URL to a relative path usable by the browser */
const normalizeLogoUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname;           // e.g. /media/schools/logos/pic.png
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
};

interface Props {
  data: ProfileData;
  onChange: (data: Partial<ProfileData>) => void;
}

const Step1Profile: React.FC<Props> = ({ data, onChange }) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    if (typeof data.logo === 'string') return normalizeLogoUrl(data.logo);
    return null;
  });

  // Sync logoPreview when data.logo changes from outside (e.g. API loaded after mount)
  useEffect(() => {
    if (typeof data.logo === 'string' && data.logo) {
      setLogoPreview(normalizeLogoUrl(data.logo));
    }
  }, [data.logo]);

  const handleLogoChange = (info: { file: File }) => {
    const file = info.file;
    if (file) {
      onChange({ logo: file });
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <h2>Profil de l'établissement</h2>
        <p>Configurez les informations de base de votre école</p>
      </div>

      <Row gutter={32}>
        <Col xs={24} md={8}>
          <Card className="logo-upload-card">
            <div className="logo-upload-area">
              {logoPreview ? (
                <div className="logo-preview">
                  <img src={logoPreview} alt="Logo" />
                  <div className="logo-overlay">
                    <CameraOutlined />
                    <span>Changer</span>
                  </div>
                </div>
              ) : (
                <div className="logo-placeholder">
                  <CameraOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  <p>Logo de l'école</p>
                </div>
              )}
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleLogoChange({ file });
                  return false;
                }}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} style={{ marginTop: 12 }}>
                  {logoPreview ? 'Changer le logo' : 'Télécharger'}
                </Button>
              </Upload>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card className="profile-form-card">
            <Form layout="vertical" size="large">
              <Form.Item label="Nom de l'établissement" required>
                <Input
                  value={data.name}
                  onChange={e => onChange({ name: e.target.value })}
                  placeholder="Ex: École Privée El Nour"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Wilaya" required>
                    <Select
                      value={data.wilaya || undefined}
                      onChange={val => onChange({ wilaya: val })}
                      placeholder="Sélectionnez la wilaya"
                      showSearch
                      optionFilterProp="label"
                      options={wilayas.map(w => ({ label: w, value: w }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Adresse">
                    <Input
                      value={data.address}
                      onChange={e => onChange({ address: e.target.value })}
                      placeholder="Rue, quartier, commune..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Téléphone">
                    <Input
                      value={data.phone}
                      onChange={e => onChange({ phone: e.target.value })}
                      placeholder="0XX XX XX XX"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Email">
                    <Input
                      value={data.email}
                      onChange={e => onChange({ email: e.target.value })}
                      placeholder="contact@ecole.dz"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Site web">
                    <Input
                      value={data.website}
                      onChange={e => onChange({ website: e.target.value })}
                      placeholder="https://www.ecole.dz"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Devise / Slogan">
                    <Input
                      value={data.motto}
                      onChange={e => onChange({ motto: e.target.value })}
                      placeholder="Pour un avenir meilleur..."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Step1Profile;
