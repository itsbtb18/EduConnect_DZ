import React, { useState } from 'react';
import { Table, Button, Tag, DatePicker, Select, message, Modal, Form, Input } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAttendance, useMarkAttendance } from '../../hooks/useApi';

const statusMap: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  present: { color: 'green', icon: <CheckCircleOutlined />, label: 'Present' },
  absent: { color: 'red', icon: <CloseCircleOutlined />, label: 'Absent' },
  late: { color: 'orange', icon: <ClockCircleOutlined />, label: 'En retard' },
};

const AttendancePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useAttendance({ page, page_size: 20 });
  const markAttendance = useMarkAttendance();

  const handleMark = async () => {
    try {
      const values = await form.validateFields();
      await markAttendance.mutateAsync(values);
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation
    }
  };

  const columns = [
    {
      title: 'Eleve',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (v: string, r: Record<string, unknown>) =>
        <span className="font-semibold">{v || (r.student as string) || '—'}</span>,
    },
    {
      title: 'Classe',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (v: string) => v ? <Tag>{v}</Tag> : '—',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (v: string) => v || '—',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const info = statusMap[v] || statusMap.present;
        return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
      },
    },
    {
      title: 'Justifie',
      dataIndex: 'excused',
      key: 'excused',
      render: (v: boolean) => v ? <Tag color="blue">Oui</Tag> : <Tag>Non</Tag>,
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Suivi des absences</h1>
          <p>{data?.count ?? 0} enregistrements</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Marquer la presence
          </Button>
        </div>
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={data?.results || []}
          loading={isLoading}
          rowKey={(r: Record<string, any>) => (r.id as string) || String(Math.random())}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.count || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'Aucun enregistrement d\'absence' }}
        />
      </div>

      <Modal
        title="Marquer la presence"
        open={modalOpen}
        onOk={handleMark}
        onCancel={() => setModalOpen(false)}
        confirmLoading={markAttendance.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Eleve" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="ID de l'eleve" />
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Requis' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Statut" name="status" rules={[{ required: true, message: 'Requis' }]}>
            <Select placeholder="Selectionner le statut">
              <Select.Option value="present">Present</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
              <Select.Option value="late">En retard</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendancePage;
