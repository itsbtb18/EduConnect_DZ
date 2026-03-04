/**
 * Step 2 — Année Scolaire & Trimestres
 * Academic year with trimester date configuration
 */
import React from 'react';
import { Card, Form, Input, DatePicker, Row, Col, Divider, Tag } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { AcademicYearData, TrimesterConfig } from '../../../types/wizard';

interface Props {
  data: AcademicYearData;
  onChange: (data: Partial<AcademicYearData>) => void;
}

const TRIMESTER_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const Step2AcademicYear: React.FC<Props> = ({ data, onChange }) => {
  const handleTrimesterChange = (idx: number, field: keyof TrimesterConfig, value: string) => {
    const trimesters = [...data.trimesters];
    trimesters[idx] = { ...trimesters[idx], [field]: value };
    onChange({ trimesters });
  };

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <h2>Année Scolaire</h2>
        <p>Définissez l'année académique et la période de chaque trimestre</p>
      </div>

      <Card className="academic-year-card">
        <Form layout="vertical" size="large">
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item label="Nom de l'année scolaire" required>
                <Input
                  value={data.name}
                  onChange={e => onChange({ name: e.target.value })}
                  placeholder="2024/2025"
                  prefix={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Date de début" required>
                <DatePicker
                  value={data.startDate ? dayjs(data.startDate) : null}
                  onChange={(d) => onChange({ startDate: d?.format('YYYY-MM-DD') || '' })}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="01/09/2024"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Date de fin" required>
                <DatePicker
                  value={data.endDate ? dayjs(data.endDate) : null}
                  onChange={(d) => onChange({ endDate: d?.format('YYYY-MM-DD') || '' })}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="30/06/2025"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Divider>
        <CalendarOutlined /> Configuration des Trimestres
      </Divider>

      <Row gutter={16}>
        {data.trimesters.map((tri, idx) => (
          <Col xs={24} md={8} key={tri.number}>
            <Card
              className="trimester-card"
              style={{ borderTop: `3px solid ${TRIMESTER_COLORS[idx]}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Tag color={TRIMESTER_COLORS[idx]} style={{ fontWeight: 600 }}>
                  T{tri.number}
                </Tag>
                <span style={{ fontWeight: 600 }}>{tri.label}</span>
              </div>
              <Form layout="vertical" size="middle">
                <Form.Item label="Début">
                  <DatePicker
                    value={tri.startDate ? dayjs(tri.startDate) : null}
                    onChange={(d) =>
                      handleTrimesterChange(idx, 'startDate', d?.format('YYYY-MM-DD') || '')
                    }
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
                <Form.Item label="Fin">
                  <DatePicker
                    value={tri.endDate ? dayjs(tri.endDate) : null}
                    onChange={(d) =>
                      handleTrimesterChange(idx, 'endDate', d?.format('YYYY-MM-DD') || '')
                    }
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Step2AcademicYear;
