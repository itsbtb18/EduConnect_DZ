/**
 * Center Setup — Step 6: Initial Data Import (Trainers + Learners)
 */
import React, { useState } from 'react';
import { Card, Table, Button, Input, Select, Form, Modal, Upload, message, Tag, Tabs, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { CenterTrainerImportEntry, CenterLearnerImportEntry } from '../../../types/formation';
import { CONTRACT_TYPE_OPTIONS } from '../../../constants/training-center';

interface Props {
  trainers: CenterTrainerImportEntry[];
  learners: CenterLearnerImportEntry[];
  onTrainersChange: (trainers: CenterTrainerImportEntry[]) => void;
  onLearnersChange: (learners: CenterLearnerImportEntry[]) => void;
}

const CenterStep6Import: React.FC<Props> = ({ trainers, learners, onTrainersChange, onLearnersChange }) => {
  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [learnerModalOpen, setLearnerModalOpen] = useState(false);
  const [trainerForm] = Form.useForm();
  const [learnerForm] = Form.useForm();

  // Trainers
  const addTrainer = async () => {
    try {
      const values = await trainerForm.validateFields();
      onTrainersChange([...trainers, values]);
      trainerForm.resetFields();
      setTrainerModalOpen(false);
    } catch { /* validation */ }
  };

  const removeTrainer = (idx: number) => {
    onTrainersChange(trainers.filter((_, i) => i !== idx));
  };

  // Learners
  const addLearner = async () => {
    try {
      const values = await learnerForm.validateFields();
      onLearnersChange([...learners, values]);
      learnerForm.resetFields();
      setLearnerModalOpen(false);
    } catch { /* validation */ }
  };

  const removeLearner = (idx: number) => {
    onLearnersChange(learners.filter((_, i) => i !== idx));
  };

  // Excel import placeholder
  const handleExcelUpload = (type: 'trainers' | 'learners') => {
    message.info(`Import Excel pour les ${type === 'trainers' ? 'formateurs' : 'apprenants'} — bientôt disponible`);
    return false;
  };

  const trainerColumns = [
    { title: 'Prénom', dataIndex: 'first_name', key: 'first_name' },
    { title: 'Nom', dataIndex: 'last_name', key: 'last_name' },
    { title: 'Téléphone', dataIndex: 'phone_number', key: 'phone_number' },
    { title: 'Contrat', dataIndex: 'contract_type', key: 'contract_type',
      render: (v: string) => CONTRACT_TYPE_OPTIONS.find(c => c.value === v)?.label || v },
    { title: 'Taux/h', dataIndex: 'hourly_rate', key: 'hourly_rate',
      render: (v: number) => v ? `${v} DA` : '—' },
    {
      title: '', key: 'actions', width: 50,
      render: (_: unknown, __: unknown, idx: number) => (
        <Button icon={<DeleteOutlined />} size="small" danger onClick={() => removeTrainer(idx)} />
      ),
    },
  ];

  const learnerColumns = [
    { title: 'Prénom', dataIndex: 'first_name', key: 'first_name' },
    { title: 'Nom', dataIndex: 'last_name', key: 'last_name' },
    { title: 'Téléphone', dataIndex: 'phone_number', key: 'phone_number' },
    { title: 'Objectif', dataIndex: 'objective', key: 'objective',
      render: (v: string) => v || '—' },
    {
      title: '', key: 'actions', width: 50,
      render: (_: unknown, __: unknown, idx: number) => (
        <Button icon={<DeleteOutlined />} size="small" danger onClick={() => removeLearner(idx)} />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ marginBottom: 4, color: '#0f172a' }}>
        <UploadOutlined style={{ marginRight: 8 }} />
        Import initial des données
      </h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Ajoutez vos formateurs et apprenants manuellement ou via import Excel
      </p>

      <Tabs items={[
        {
          key: 'trainers',
          label: <span><UserOutlined /> Formateurs ({trainers.length})</span>,
          children: (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { trainerForm.resetFields(); setTrainerModalOpen(true); }}>
                  Ajouter un formateur
                </Button>
                <Upload beforeUpload={() => handleExcelUpload('trainers')} showUploadList={false} accept=".xlsx,.xls,.csv">
                  <Button icon={<UploadOutlined />}>Import Excel</Button>
                </Upload>
              </div>
              {trainers.length > 0 ? (
                <Table dataSource={trainers.map((t, i) => ({ ...t, key: i }))} columns={trainerColumns} size="small" pagination={false} />
              ) : (
                <Empty description="Aucun formateur ajouté" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          ),
        },
        {
          key: 'learners',
          label: <span><TeamOutlined /> Apprenants ({learners.length})</span>,
          children: (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { learnerForm.resetFields(); setLearnerModalOpen(true); }}>
                  Ajouter un apprenant
                </Button>
                <Upload beforeUpload={() => handleExcelUpload('learners')} showUploadList={false} accept=".xlsx,.xls,.csv">
                  <Button icon={<UploadOutlined />}>Import Excel</Button>
                </Upload>
              </div>
              {learners.length > 0 ? (
                <Table dataSource={learners.map((l, i) => ({ ...l, key: i }))} columns={learnerColumns} size="small" pagination={false} />
              ) : (
                <Empty description="Aucun apprenant ajouté" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          ),
        },
      ]} />

      {/* Trainer Modal */}
      <Modal title="Ajouter un formateur" open={trainerModalOpen} onCancel={() => setTrainerModalOpen(false)} onOk={addTrainer} okText="Ajouter" cancelText="Annuler">
        <Form form={trainerForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="first_name" label="Prénom" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Nom" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="phone_number" label="Téléphone" rules={[{ required: true }]}>
            <Input placeholder="05XXXXXXXX" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="specialization" label="Spécialité">
            <Input placeholder="Ex: Anglais, Mathématiques..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="contract_type" label="Type de contrat" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={CONTRACT_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="hourly_rate" label="Taux horaire (DA)" style={{ flex: 1 }}>
              <Input type="number" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Learner Modal */}
      <Modal title="Ajouter un apprenant" open={learnerModalOpen} onCancel={() => setLearnerModalOpen(false)} onOk={addLearner} okText="Ajouter" cancelText="Annuler">
        <Form form={learnerForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="first_name" label="Prénom" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Nom" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="phone_number" label="Téléphone" rules={[{ required: true }]}>
            <Input placeholder="05XXXXXXXX" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="residence" label="Résidence">
            <Input />
          </Form.Item>
          <Form.Item name="parent_phone" label="Téléphone parent (si mineur)">
            <Input />
          </Form.Item>
          <Form.Item name="declared_level" label="Niveau scolaire déclaré">
            <Input placeholder="Ex: 3ème année moyenne" />
          </Form.Item>
          <Form.Item name="objective" label="Objectif">
            <Input.TextArea rows={2} placeholder="Ex: Préparer le BEM, Améliorer l'anglais..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CenterStep6Import;
