/**
 * Step 7 — Élèves
 * Add students with name, phone, parent phone, class assignment
 */
import React from 'react';
import {
  Card, Form, Input, Button, Table, Tag, Popconfirm, Row, Col, Select, Empty, Statistic,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import ImportButtons from '../../../components/ui/ImportButtons';
import { CYCLE_COLORS, type CycleType } from '../../../constants/algerian-curriculum';
import type { StudentEntry, LevelConfig } from '../../../types/wizard';

interface Props {
  students: StudentEntry[];
  levels: LevelConfig[];
  onAdd: (student: StudentEntry) => void;
  onRemove: (tempId: string) => void;
}

const Step7Students: React.FC<Props> = ({ students, levels, onAdd, onRemove }) => {
  const [form] = Form.useForm();

  // Build available class names from enabled levels
  const classOptions: { value: string; label: string; cycle: CycleType }[] = [];
  for (const level of levels) {
    if (!level.enabled) continue;
    if (level.enabledStreams.length > 0) {
      for (const sc of level.enabledStreams) {
        const count = level.streamClasses[sc] || 1;
        for (let i = 1; i <= count; i++) {
          const name = `${level.code}-${sc.replace('TC_', '')}-${i}`;
          classOptions.push({ value: name, label: name, cycle: level.cycle });
        }
      }
    } else {
      for (let i = 1; i <= level.classCount; i++) {
        const name = `${level.code}-${i}`;
        classOptions.push({ value: name, label: name, cycle: level.cycle });
      }
    }
  }

  const handleAdd = () => {
    form.validateFields().then(values => {
      const entry: StudentEntry = {
        tempId: `student_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || '',
        parentPhone: values.parentPhone || '',
        classAssignment: values.classAssignment || '',
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
      };
      onAdd(entry);
      form.resetFields();
    });
  };

  const columns = [
    {
      title: 'Élève',
      key: 'name',
      render: (_: unknown, record: StudentEntry) => (
        <strong>{record.lastName} {record.firstName}</strong>
      ),
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
      render: (val: string) => val || <Tag>—</Tag>,
    },
    {
      title: 'Parent',
      dataIndex: 'parentPhone',
      key: 'parentPhone',
      render: (val: string) => val || <Tag>—</Tag>,
    },
    {
      title: 'Classe',
      dataIndex: 'classAssignment',
      key: 'class',
      render: (val: string) => {
        if (!val) return <Tag>Non assigné</Tag>;
        // Detect cycle from class name
        const opt = classOptions.find(o => o.value === val);
        const colors = opt ? CYCLE_COLORS[opt.cycle] : null;
        return <Tag color={colors?.bg}>{val}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: StudentEntry) => (
        <Popconfirm title="Supprimer ?" onConfirm={() => onRemove(record.tempId)}>
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <h2>Élèves</h2>
        <p>Ajoutez vos élèves. Cette étape est optionnelle — vous pourrez en ajouter plus tard.</p>
      </div>

      {/* ── Import Buttons (Design Only — Coming Soon) ── */}
      <Row gutter={12} style={{ marginBottom: 16 }} align="middle">
        <Col>
          <ImportButtons templateType="students" />
        </Col>
        <Col flex="auto" />
        <Col>
          <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #bae0ff' }}>
            <Statistic title="Élèves ajoutés" value={students.length} prefix={<UserOutlined />} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Card title="Ajouter un élève" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" size="middle">
          <Row gutter={16}>
            <Col xs={24} md={5}>
              <Form.Item name="lastName" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Nom de famille" />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item name="firstName" label="Prénom" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Prénom" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="phone" label="Téléphone">
                <Input placeholder="0XX XX XX XX" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="parentPhone" label="Tél. Parent">
                <Input placeholder="0XX XX XX XX" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="classAssignment" label="Classe">
                <Select
                  placeholder="Classe"
                  options={classOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={2} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}

              />
            </Col>
          </Row>
        </Form>
      </Card>

      {students.length > 0 ? (
        <Card>
          <Table
            dataSource={students}
            columns={columns}
            rowKey="tempId"
            pagination={students.length > 10 ? { pageSize: 10 } : false}
            size="small"
          />
        </Card>
      ) : (
        <Empty
          description="Aucun élève ajouté"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <p style={{ color: '#999', fontSize: 13 }}>
            Vous pourrez importer ou ajouter des élèves après la configuration
          </p>
        </Empty>
      )}
    </div>
  );
};

export default Step7Students;
