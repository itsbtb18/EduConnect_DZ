import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Descriptions, Tag, Spin, Card, Table } from 'antd';
import { ArrowLeftOutlined, EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useStudent, useGrades, useAttendance } from '../../hooks/useApi';

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, isError } = useStudent(id || '');
  const { data: gradesData } = useGrades({ student: id });
  const { data: attendanceData } = useAttendance({ student: id });

  if (isLoading) {
    return (
      <div className="page loading-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="page animate-fade-in">
        <div className="empty-state">
          <div className="empty-state__title">Eleve introuvable</div>
          <div className="empty-state__desc">Cet eleve n'existe pas ou a ete supprime.</div>
          <Button type="primary" onClick={() => navigate('/students')} className="mt-16">
            Retour a la liste
          </Button>
        </div>
      </div>
    );
  }

  const s = student as Record<string, unknown>;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info flex-row flex-center gap-16">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>
            Retour
          </Button>
          <div>
            <h1>{(s.first_name as string) || ''} {(s.last_name as string) || ''}</h1>
            <p>Detail de l'eleve</p>
          </div>
        </div>
        <div className="page-header__actions">
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/students?edit=${id}`)}>
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid-main">
        <Card>
          <div className="flex-row flex-center gap-20 mb-24">
            <div className="avatar avatar--lg avatar--primary">
              {((s.first_name as string)?.[0] || '').toUpperCase()}
              {((s.last_name as string)?.[0] || '').toUpperCase()}
            </div>
            <div>
              <h2 className="detail-name lg">
                {(s.first_name as string) || ''} {(s.last_name as string) || ''}
              </h2>
              <Tag color={(s.is_active as boolean) !== false ? 'green' : 'red'} className="mt-4">
                {(s.is_active as boolean) !== false ? 'Actif' : 'Inactif'}
              </Tag>
            </div>
          </div>

          <Descriptions column={2} bordered size="small" labelStyle={{ fontWeight: 600, fontSize: 12 }}>
            <Descriptions.Item label="Prenom">{(s.first_name as string) || '—'}</Descriptions.Item>
            <Descriptions.Item label="Nom">{(s.last_name as string) || '—'}</Descriptions.Item>
            <Descriptions.Item label={<><PhoneOutlined /> Telephone</>}>{(s.phone_number as string) || '—'}</Descriptions.Item>
            <Descriptions.Item label={<><MailOutlined /> Email</>}>{(s.email as string) || '—'}</Descriptions.Item>
            <Descriptions.Item label="Classe">{(s.class_name as string) || '—'}</Descriptions.Item>
            <Descriptions.Item label="Role">{(s.role as string) || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ecole">{(s.school as string) || '—'}</Descriptions.Item>
            <Descriptions.Item label="Inscription">{(s.created_at as string)?.slice(0, 10) || '—'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <div className="flex-col gap-20">
          <Card title="Notes recentes">
            {gradesData?.results?.length ? (
              <Table
                dataSource={gradesData.results.slice(0, 10)}
                rowKey={(r: Record<string, any>) => r.id || `grade-${r.subject_name}-${r.trimester}`}
                pagination={false}
                size="small"
                columns={[
                  { title: 'Matiere', dataIndex: 'subject_name', key: 'subject_name', render: (v: string) => v || '—' },
                  { title: 'Note', dataIndex: 'score', key: 'score', render: (v: number) => v != null ? `${v}/20` : '—' },
                  { title: 'Trimestre', dataIndex: 'trimester', key: 'trimester', render: (v: string) => v || '—' },
                  { title: 'Statut', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v || '—'}</Tag> },
                ]}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state__desc">Aucune note enregistree</div>
              </div>
            )}
          </Card>
          <Card title="Absences">
            {attendanceData?.results?.length ? (
              <Table
                dataSource={attendanceData.results.slice(0, 10)}
                rowKey={(r: Record<string, any>) => r.id || `att-${r.date}-${r.status}`}
                pagination={false}
                size="small"
                columns={[
                  { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v?.slice(0, 10) || '—' },
                  { title: 'Statut', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'PRESENT' ? 'green' : v === 'ABSENT' ? 'red' : 'orange'}>{v || '—'}</Tag> },
                  { title: 'Justifie', dataIndex: 'excused', key: 'excused', render: (v: boolean) => v ? <Tag color="blue">Oui</Tag> : <Tag>Non</Tag> },
                ]}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state__desc">Aucune absence enregistree</div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
