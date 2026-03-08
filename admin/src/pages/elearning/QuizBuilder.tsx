import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Form, Input, Select, InputNumber, Switch, Space,
  Table, Tag, Popconfirm, Modal, Row, Col, Divider, Radio, Tooltip,
  Alert, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  SaveOutlined, EyeOutlined, QuestionCircleOutlined, CopyOutlined,
} from '@ant-design/icons';
import type { Quiz, QuizQuestion, QuizQuestionType, QuizListItem } from '../../types';
import {
  useQuizzes, useQuiz, useCreateQuiz, useUpdateQuiz, useDeleteQuiz,
} from '../../hooks/useApi';

const QUESTION_TYPES: { value: QuizQuestionType; label: string }[] = [
  { value: 'MCQ', label: 'QCM' },
  { value: 'TRUE_FALSE', label: 'Vrai / Faux' },
  { value: 'FREE_TEXT', label: 'Texte libre' },
];

interface QuestionFormData {
  key: string;
  question_type: QuizQuestionType;
  text: string;
  options: string[];
  correct_answer: string | string[];
  points: number;
  explanation: string;
  order: number;
}

const newQuestion = (order: number): QuestionFormData => ({
  key: crypto.randomUUID(),
  question_type: 'MCQ',
  text: '',
  options: ['', '', '', ''],
  correct_answer: [],
  points: 1,
  explanation: '',
  order,
});

export default function QuizBuilder() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list');
  const [quizForm] = Form.useForm();
  const [questions, setQuestions] = useState<QuestionFormData[]>([newQuestion(1)]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: quizzes, isLoading: loadingList } = useQuizzes();
  const { data: quizDetail } = useQuiz(selectedQuizId ?? '');
  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();
  const deleteMutation = useDeleteQuiz();

  // Load quiz detail into form when editing
  useEffect(() => {
    if (formMode === 'edit' && quizDetail) {
      const q = quizDetail as Quiz;
      quizForm.setFieldsValue({
        title: q.title,
        description: q.description,
        subject: q.subject,
        level: q.level,
        chapter: q.chapter,
        duration_minutes: q.duration_minutes,
        allow_retake: q.allow_retake,
        show_correction_immediately: q.show_correction_immediately,
        is_published: q.is_published,
      });
      setQuestions(
        q.questions.map((qn: QuizQuestion, i: number) => ({
          key: qn.id || crypto.randomUUID(),
          question_type: qn.question_type,
          text: qn.text,
          options: (qn.options as string[] | undefined) || ['', '', '', ''],
          correct_answer: (qn.correct_answer as string | string[]) ?? '',
          points: qn.points,
          explanation: qn.explanation || '',
          order: i + 1,
        }))
      );
    }
  }, [formMode, quizDetail, quizForm]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, newQuestion(prev.length + 1)]);
  };

  const removeQuestion = (key: string) => {
    setQuestions(prev => prev.filter(q => q.key !== key).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    setQuestions(prev => {
      const arr = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr.map((q, i) => ({ ...q, order: i + 1 }));
    });
  };

  const updateQuestion = useCallback((key: string, field: string, value: unknown) => {
    setQuestions(prev => prev.map(q => q.key === key ? { ...q, [field]: value } : q));
  }, []);

  const updateOption = (key: string, optIndex: number, value: string) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.key !== key) return q;
        const opts = [...q.options];
        opts[optIndex] = value;
        return { ...q, options: opts };
      })
    );
  };

  const addOption = (key: string) => {
    setQuestions(prev =>
      prev.map(q => q.key === key ? { ...q, options: [...q.options, ''] } : q)
    );
  };

  const removeOption = (key: string, optIndex: number) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.key !== key) return q;
        const opts = q.options.filter((_, i) => i !== optIndex);
        return { ...q, options: opts };
      })
    );
  };

  const handleSave = async () => {
    const values = await quizForm.validateFields();
    const payload = {
      ...values,
      questions: questions.map(q => ({
        question_type: q.question_type,
        text: q.text,
        options: q.question_type === 'MCQ' ? q.options.filter(Boolean) : [],
        correct_answer: q.question_type === 'TRUE_FALSE'
          ? q.correct_answer
          : q.question_type === 'MCQ'
            ? (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer])
            : q.correct_answer,
        points: q.points,
        explanation: q.explanation,
        order: q.order,
      })),
    };

    if (formMode === 'edit' && selectedQuizId) {
      await updateMutation.mutateAsync({ id: selectedQuizId, data: payload });
      message.success('Quiz mis à jour');
    } else {
      await createMutation.mutateAsync(payload);
      message.success('Quiz créé');
    }
    setFormMode('list');
    setSelectedQuizId(null);
    setQuestions([newQuestion(1)]);
    quizForm.resetFields();
  };

  const openEdit = (id: string) => {
    setSelectedQuizId(id);
    setFormMode('edit');
  };

  const openCreate = () => {
    setSelectedQuizId(null);
    quizForm.resetFields();
    setQuestions([newQuestion(1)]);
    setFormMode('create');
  };

  const totalPoints = questions.reduce((s, q) => s + q.points, 0);

  // ─── LIST VIEW ───────────────────────────────────────────
  if (formMode === 'list') {
    const quizColumns = [
      { title: 'Titre', dataIndex: 'title', key: 'title', ellipsis: true },
      {
        title: 'Matière', dataIndex: 'subject_name', key: 'subject', width: 130,
        render: (v: string) => v || '—',
      },
      {
        title: 'Questions', dataIndex: 'question_count', key: 'questions', width: 90,
        render: (v: number) => <Tag>{v}</Tag>,
      },
      {
        title: 'Durée', dataIndex: 'duration_minutes', key: 'duration', width: 90,
        render: (v: number | null) => v ? `${v} min` : '—',
      },
      {
        title: 'Publié', dataIndex: 'is_published', key: 'published', width: 80,
        render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Oui' : 'Non'}</Tag>,
      },
      {
        title: 'Tentatives', dataIndex: 'attempt_count', key: 'attempts', width: 100,
        render: (v: number) => v ?? 0,
      },
      {
        title: 'Actions', key: 'actions', width: 150,
        render: (_: unknown, r: QuizListItem) => (
          <Space size="small">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openEdit(r.id)} />
            <Popconfirm title="Supprimer ce quiz ?" onConfirm={() => deleteMutation.mutate(r.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div style={{ padding: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <h2>Constructeur de Quiz</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nouveau Quiz
          </Button>
        </Row>
        <Table
          dataSource={quizzes as QuizListItem[] | undefined}
          columns={quizColumns}
          rowKey="id"
          loading={loadingList}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </div>
    );
  }

  // ─── CREATE / EDIT VIEW ──────────────────────────────────
  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <h2>{formMode === 'edit' ? 'Modifier le Quiz' : 'Nouveau Quiz'}</h2>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Aperçu</Button>
          <Button onClick={() => { setFormMode('list'); quizForm.resetFields(); }}>Annuler</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            Enregistrer
          </Button>
        </Space>
      </Row>

      {/* Quiz metadata */}
      <Card title="Informations du Quiz" size="small" style={{ marginBottom: 16 }}>
        <Form form={quizForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="Titre" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="subject" label="Matière (ID)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="level" label="Niveau (ID)">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="chapter" label="Chapitre">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="duration_minutes" label="Durée (min)">
                <InputNumber style={{ width: '100%' }} min={1} max={180} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="allow_retake" label="Reprise" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="show_correction_immediately" label="Correction immédiate" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="is_published" label="Publié" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Card>

      {/* Stats bar */}
      <Alert
        type="info"
        showIcon
        icon={<QuestionCircleOutlined />}
        message={`${questions.length} question(s) — ${totalPoints} point(s) au total`}
        style={{ marginBottom: 16 }}
      />

      {/* Questions */}
      {questions.map((q, index) => (
        <Card
          key={q.key}
          size="small"
          title={`Question ${index + 1}`}
          style={{ marginBottom: 12 }}
          extra={
            <Space size="small">
              <Tooltip title="Monter">
                <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
                  onClick={() => moveQuestion(index, 'up')} />
              </Tooltip>
              <Tooltip title="Descendre">
                <Button size="small" icon={<ArrowDownOutlined />} disabled={index === questions.length - 1}
                  onClick={() => moveQuestion(index, 'down')} />
              </Tooltip>
              <Tooltip title="Dupliquer">
                <Button size="small" icon={<CopyOutlined />} onClick={() => {
                  const dup = { ...q, key: crypto.randomUUID(), order: questions.length + 1 };
                  setQuestions(prev => [...prev, dup].map((qq, i) => ({ ...qq, order: i + 1 })));
                }} />
              </Tooltip>
              {questions.length > 1 && (
                <Popconfirm title="Supprimer cette question ?" onConfirm={() => removeQuestion(q.key)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </Space>
          }
        >
          <Row gutter={12}>
            <Col span={14}>
              <Input.TextArea
                placeholder="Énoncé de la question"
                rows={2}
                value={q.text}
                onChange={e => updateQuestion(q.key, 'text', e.target.value)}
              />
            </Col>
            <Col span={5}>
              <Select
                style={{ width: '100%' }}
                value={q.question_type}
                options={QUESTION_TYPES}
                onChange={v => {
                  updateQuestion(q.key, 'question_type', v);
                  if (v === 'TRUE_FALSE') {
                    updateQuestion(q.key, 'options', ['Vrai', 'Faux']);
                    updateQuestion(q.key, 'correct_answer', 'true');
                  } else if (v === 'FREE_TEXT') {
                    updateQuestion(q.key, 'options', []);
                    updateQuestion(q.key, 'correct_answer', '');
                  } else {
                    updateQuestion(q.key, 'options', ['', '', '', '']);
                    updateQuestion(q.key, 'correct_answer', []);
                  }
                }}
              />
            </Col>
            <Col span={5}>
              <InputNumber
                style={{ width: '100%' }}
                value={q.points}
                min={1}
                max={100}
                addonAfter="pt(s)"
                onChange={v => updateQuestion(q.key, 'points', v ?? 1)}
              />
            </Col>
          </Row>

          {/* MCQ options */}
          {q.question_type === 'MCQ' && (
            <div style={{ marginTop: 12 }}>
              <Divider style={{ margin: '8px 0' }}>Options</Divider>
              {q.options.map((opt, oi) => (
                <Row key={oi} gutter={8} style={{ marginBottom: 6 }} align="middle">
                  <Col flex="auto">
                    <Input
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={e => updateOption(q.key, oi, e.target.value)}
                      addonBefore={
                        <input
                          type="checkbox"
                          checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(opt)}
                          onChange={e => {
                            const arr = Array.isArray(q.correct_answer) ? [...q.correct_answer] : [];
                            if (e.target.checked) {
                              arr.push(opt);
                            } else {
                              const idx = arr.indexOf(opt);
                              if (idx >= 0) arr.splice(idx, 1);
                            }
                            updateQuestion(q.key, 'correct_answer', arr);
                          }}
                          title="Bonne réponse"
                        />
                      }
                    />
                  </Col>
                  <Col>
                    {q.options.length > 2 && (
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeOption(q.key, oi)} />
                    )}
                  </Col>
                </Row>
              ))}
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addOption(q.key)}>
                Ajouter une option
              </Button>
            </div>
          )}

          {/* True/False */}
          {q.question_type === 'TRUE_FALSE' && (
            <div style={{ marginTop: 12 }}>
              <Radio.Group
                value={q.correct_answer}
                onChange={e => updateQuestion(q.key, 'correct_answer', e.target.value)}
              >
                <Radio value="true">Vrai</Radio>
                <Radio value="false">Faux</Radio>
              </Radio.Group>
            </div>
          )}

          {/* Free text */}
          {q.question_type === 'FREE_TEXT' && (
            <div style={{ marginTop: 12 }}>
              <Input
                placeholder="Réponse attendue (référence pour correction)"
                value={typeof q.correct_answer === 'string' ? q.correct_answer : ''}
                onChange={e => updateQuestion(q.key, 'correct_answer', e.target.value)}
              />
            </div>
          )}

          {/* Explanation */}
          <div style={{ marginTop: 8 }}>
            <Input
              placeholder="Explication (optionnel)"
              value={q.explanation}
              onChange={e => updateQuestion(q.key, 'explanation', e.target.value)}
            />
          </div>
        </Card>
      ))}

      <Button type="dashed" block icon={<PlusOutlined />} onClick={addQuestion} style={{ marginBottom: 24 }}>
        Ajouter une question
      </Button>

      {/* Preview modal */}
      <Modal
        title="Aperçu du Quiz"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={700}
      >
        <h3>{quizForm.getFieldValue('title') || 'Sans titre'}</h3>
        <p>{quizForm.getFieldValue('description')}</p>
        <Divider />
        {questions.map((q, i) => (
          <Card key={q.key} size="small" style={{ marginBottom: 8 }}>
            <strong>Q{i + 1}.</strong> {q.text || '(vide)'}{' '}
            <Tag>{QUESTION_TYPES.find(t => t.value === q.question_type)?.label}</Tag>
            <Tag color="blue">{q.points} pt(s)</Tag>
            {q.question_type === 'MCQ' && (
              <ul style={{ margin: '8px 0 0' }}>
                {q.options.filter(Boolean).map((o, j) => (
                  <li key={j} style={{
                    color: Array.isArray(q.correct_answer) && q.correct_answer.includes(o) ? '#52c41a' : undefined
                  }}>
                    {o} {Array.isArray(q.correct_answer) && q.correct_answer.includes(o) && '✓'}
                  </li>
                ))}
              </ul>
            )}
            {q.question_type === 'TRUE_FALSE' && (
              <div style={{ marginTop: 4 }}>Réponse : <Tag color="green">{q.correct_answer === 'true' ? 'Vrai' : 'Faux'}</Tag></div>
            )}
            {q.explanation && <div style={{ marginTop: 4, fontStyle: 'italic', color: '#888' }}>💡 {q.explanation}</div>}
          </Card>
        ))}
      </Modal>
    </div>
  );
}
