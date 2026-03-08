import React, { useState } from 'react';
import { Card, Select, Spin, Alert, Table, Tag, Row, Col, Statistic, Progress } from 'antd';
import { BarChartOutlined, FileTextOutlined } from '@ant-design/icons';
import { useInfirmerieReports } from '../../hooks/useApi';

const REASON_LABELS: Record<string, string> = {
  HEADACHE: 'Maux de tête', STOMACH: 'Maux de ventre', FEVER: 'Fièvre',
  INJURY: 'Blessure', ALLERGY_REACTION: 'Réaction allergique', ASTHMA: 'Crise d\'asthme',
  DIABETES: 'Malaise diabétique', EPILEPSY: 'Épilepsie', NAUSEA: 'Nausée',
  DIZZINESS: 'Vertige', EYE: 'Oculaire', DENTAL: 'Dentaire', SKIN: 'Cutané',
  PSYCHOLOGICAL: 'Psychologique', MEDICATION_ADMIN: 'Médicament', FOLLOW_UP: 'Suivi', OTHER: 'Autre',
};
const OUTCOME_LABELS: Record<string, string> = {
  RETURNED_CLASS: 'Retour en classe', REST_INFIRMARY: 'Repos infirmerie',
  CONTACT_PARENT: 'Parent contacté', SENT_HOME: 'Renvoyé', EMERGENCY: 'Urgence',
  HOSPITAL: 'Hôpital', FOLLOW_UP_NEEDED: 'Suivi nécessaire',
};

interface ReportData {
  period: string;
  total_consultations: number;
  consultations_by_reason: { reason: string; count: number }[];
  consultations_by_outcome: { outcome: string; count: number }[];
  allergy_summary: { allergy_type: string; count: number; anaphylactic_count: number }[];
  vaccination_coverage: number;
  epidemic_summary: { disease_name: string; case_count: number; is_resolved: boolean }[];
}

const MONTHS = [
  { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' },
];

const InfirmeryReportsPage: React.FC = () => {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const params: Record<string, string> = { period, year };
  if (period === 'monthly') params.month = month;

  const { data, isLoading, error } = useInfirmerieReports(params);
  const report = data as ReportData | undefined;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><BarChartOutlined className="page-header__icon" /> Rapports Infirmerie</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Select
          value={period}
          onChange={(v) => setPeriod(v)}
          style={{ width: 140 }}
          options={[
            { value: 'monthly', label: 'Mensuel' },
            { value: 'annual', label: 'Annuel' },
          ]}
        />
        <Select
          value={year}
          onChange={(v) => setYear(v)}
          style={{ width: 100 }}
          options={[
            { value: (parseInt(currentYear) - 1).toString(), label: (parseInt(currentYear) - 1).toString() },
            { value: currentYear, label: currentYear },
          ]}
        />
        {period === 'monthly' && (
          <Select value={month} onChange={(v) => setMonth(v)} style={{ width: 150 }} options={MONTHS} />
        )}
      </div>

      {isLoading && <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />}
      {error && <Alert type="error" message="Erreur de chargement des rapports" />}

      {report && (
        <>
          {/* Summary */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="Total consultations" value={report.total_consultations} prefix={<FileTextOutlined />} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic title="Couverture vaccinale" value={report.vaccination_coverage} suffix="%" />
                <Progress
                  percent={report.vaccination_coverage}
                  status={report.vaccination_coverage >= 80 ? 'success' : 'exception'}
                  showInfo={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Consultations by reason */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Consultations par motif" size="small">
                <Table
                  dataSource={report.consultations_by_reason}
                  rowKey="reason"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Motif', dataIndex: 'reason', render: (v: string) => REASON_LABELS[v] || v },
                    { title: 'Nombre', dataIndex: 'count', sorter: (a: { count: number }, b: { count: number }) => a.count - b.count },
                  ]}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Consultations par issue" size="small">
                <Table
                  dataSource={report.consultations_by_outcome}
                  rowKey="outcome"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Issue', dataIndex: 'outcome', render: (v: string) => OUTCOME_LABELS[v] || v },
                    { title: 'Nombre', dataIndex: 'count', sorter: (a: { count: number }, b: { count: number }) => a.count - b.count },
                  ]}
                />
              </Card>
            </Col>
          </Row>

          {/* Allergy summary */}
          <Card title="Résumé des allergies" style={{ marginTop: 16 }} size="small">
            <Table
              dataSource={report.allergy_summary}
              rowKey="allergy_type"
              pagination={false}
              size="small"
              columns={[
                { title: 'Type', dataIndex: 'allergy_type' },
                { title: 'Total', dataIndex: 'count' },
                {
                  title: 'Anaphylactiques',
                  dataIndex: 'anaphylactic_count',
                  render: (v: number) => v > 0 ? <Tag color="magenta">{v}</Tag> : '0',
                },
              ]}
            />
          </Card>

          {/* Epidemic summary */}
          {report.epidemic_summary?.length > 0 && (
            <Card title="Résumé épidémique" style={{ marginTop: 16 }} size="small">
              <Table
                dataSource={report.epidemic_summary}
                rowKey="disease_name"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Maladie', dataIndex: 'disease_name' },
                  { title: 'Cas', dataIndex: 'case_count' },
                  {
                    title: 'Statut',
                    dataIndex: 'is_resolved',
                    render: (v: boolean) => v ? <Tag color="green">Résolu</Tag> : <Tag color="red">Actif</Tag>,
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default InfirmeryReportsPage;
