import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Switch, Tag, Space, Tabs,
  Card, Row, Col, Divider, Spin, message, Badge, Tooltip, InputNumber,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CalendarOutlined, ReloadOutlined, CoffeeOutlined, WarningOutlined,
} from '@ant-design/icons';
import {
  useCanteenMenus, useCreateCanteenMenu, useUpdateCanteenMenu, useDeleteCanteenMenu,
  usePublishCanteenMenu, useCanteenMenuItems, useCreateCanteenMenuItem,
  useUpdateCanteenMenuItem, useDeleteCanteenMenuItem, useCanteenMenu,
} from '../../hooks/useApi';
import type { CanteenMenuList, CanteenMenu, CanteenMenuItem, MenuPeriod, DayOfWeek } from '../../types';
import dayjs from 'dayjs';

const PERIOD_OPTIONS: { value: MenuPeriod; label: string; color: string }[] = [
  { value: 'WEEKLY', label: 'Hebdomadaire', color: 'blue' },
  { value: 'MONTHLY', label: 'Mensuel', color: 'green' },
  { value: 'TRIMESTER', label: 'Trimestriel', color: 'purple' },
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  SUN: 'Dimanche', MON: 'Lundi', TUE: 'Mardi', WED: 'Mercredi', THU: 'Jeudi',
};

const DAY_COLORS: Record<string, string> = {
  SUN: '#FF6B6B', MON: '#4ECDC4', TUE: '#45B7D1', WED: '#F7DC6F', THU: '#BB8FCE',
};

const MenuManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [publishedFilter, setPublishedFilter] = useState<boolean>();
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editMenuId, setEditMenuId] = useState<string | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [menuForm] = Form.useForm();
  const [itemForm] = Form.useForm();

  const { data: menusData, isLoading, refetch } = useCanteenMenus({
    page, published: publishedFilter,
  });
  const createMenu = useCreateCanteenMenu();
  const updateMenu = useUpdateCanteenMenu();
  const deleteMenu = useDeleteCanteenMenu();
  const publishMenu = usePublishCanteenMenu();

  const { data: menuDetail } = useCanteenMenu(selectedMenuId || '');
  const { data: itemsData, refetch: refetchItems } = useCanteenMenuItems(selectedMenuId || '');
  const createItem = useCreateCanteenMenuItem();
  const updateItem = useUpdateCanteenMenuItem();
  const deleteItem = useDeleteCanteenMenuItem();

  const menus = (menusData?.results || []) as CanteenMenuList[];
  const total = (menusData as Record<string, unknown>)?.count as number ?? menus.length;
  const items = ((itemsData as Record<string, unknown>)?.results || itemsData || []) as CanteenMenuItem[];
  const menu = menuDetail as CanteenMenu | undefined;

  const openEditMenu = (record: CanteenMenuList) => {
    setEditMenuId(record.id);
    menuForm.setFieldsValue({
      ...record,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
    });
    setMenuModalOpen(true);
  };

  const handleMenuSubmit = async () => {
    try {
      const values = await menuForm.validateFields();
      const payload = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      };
      if (editMenuId) {
        await updateMenu.mutateAsync({ id: editMenuId, ...payload });
        message.success('Menu mis à jour');
      } else {
        await createMenu.mutateAsync(payload);
        message.success('Menu créé');
      }
      setMenuModalOpen(false);
      menuForm.resetFields();
      setEditMenuId(null);
    } catch { /* validation */ }
  };

  const handleDeleteMenu = (id: string) => {
    Modal.confirm({
      title: 'Supprimer ce menu ?', okText: 'Supprimer', cancelText: 'Annuler', okType: 'danger',
      onOk: async () => { await deleteMenu.mutateAsync(id); message.success('Menu supprimé'); },
    });
  };

  const handlePublish = async (id: string) => {
    await publishMenu.mutateAsync(id);
    message.success('Menu publié ✓');
    refetch();
  };

  const openItemForm = (item?: CanteenMenuItem) => {
    if (item) {
      setEditItemId(item.id);
      itemForm.setFieldsValue({ ...item, date: dayjs(item.date) });
    } else {
      setEditItemId(null);
      itemForm.resetFields();
    }
    setItemModalOpen(true);
  };

  const handleItemSubmit = async () => {
    try {
      const values = await itemForm.validateFields();
      const payload = { ...values, date: values.date?.format('YYYY-MM-DD') };
      if (editItemId) {
        await updateItem.mutateAsync({ id: editItemId, ...payload });
        message.success('Plat mis à jour');
      } else if (selectedMenuId) {
        await createItem.mutateAsync({ menuId: selectedMenuId, ...payload });
        message.success('Plat ajouté');
      }
      setItemModalOpen(false);
      itemForm.resetFields();
      setEditItemId(null);
      refetchItems();
    } catch { /* validation */ }
  };

  const handleDeleteItem = (id: string) => {
    Modal.confirm({
      title: 'Supprimer ce plat ?', okText: 'Supprimer', cancelText: 'Annuler', okType: 'danger',
      onOk: async () => {
        await deleteItem.mutateAsync(id);
        message.success('Plat supprimé');
        refetchItems();
      },
    });
  };

  const menuColumns = [
    { title: 'Titre', dataIndex: 'title', key: 'title' },
    {
      title: 'Période', dataIndex: 'period_type', key: 'period',
      render: (v: MenuPeriod) => {
        const opt = PERIOD_OPTIONS.find((o) => o.value === v);
        return <Tag color={opt?.color}>{opt?.label || v}</Tag>;
      },
    },
    {
      title: 'Dates', key: 'dates',
      render: (_: unknown, r: CanteenMenuList) =>
        `${dayjs(r.start_date).format('DD/MM')} — ${dayjs(r.end_date).format('DD/MM/YYYY')}`,
    },
    { title: 'Plats', dataIndex: 'items_count', key: 'items', align: 'center' as const },
    {
      title: 'Statut', dataIndex: 'is_published', key: 'published',
      render: (v: boolean) => v
        ? <Badge status="success" text="Publié" />
        : <Badge status="default" text="Brouillon" />,
    },
    {
      title: '', key: 'actions', width: 180,
      render: (_: unknown, r: CanteenMenuList) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setSelectedMenuId(r.id)}>Détails</Button>
          {!r.is_published && (
            <Tooltip title="Publier">
              <Button type="text" size="small" icon={<CheckCircleOutlined style={{ color: '#10B981' }} />}
                onClick={() => handlePublish(r.id)} />
            </Tooltip>
          )}
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditMenu(r)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteMenu(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><CoffeeOutlined className="page-header__icon" /> Gestion des menus</h1>
          <p>Planification et gestion des plats</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { menuForm.resetFields(); setEditMenuId(null); setMenuModalOpen(true); }}>
            Nouveau menu
          </Button>
        </div>
      </div>

      <Tabs
        activeKey={selectedMenuId ? 'detail' : 'list'}
        onChange={(key) => { if (key === 'list') setSelectedMenuId(null); }}
        items={[
          {
            key: 'list', label: '📋 Liste des menus',
            children: (
              <>
                <div className="filter-row" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <Select placeholder="Filtrer par statut" value={publishedFilter} onChange={(v) => { setPublishedFilter(v); setPage(1); }}
                    allowClear style={{ width: 200 }}>
                    <Select.Option value={true}>Publiés</Select.Option>
                    <Select.Option value={false}>Brouillons</Select.Option>
                  </Select>
                </div>
                <div className="card card--table">
                  <Table columns={menuColumns} dataSource={menus} loading={isLoading} rowKey="id"
                    pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} menus` }}
                    locale={{ emptyText: 'Aucun menu' }}
                  />
                </div>
              </>
            ),
          },
          {
            key: 'detail', label: menu ? `📅 ${menu.title}` : '📅 Détails',
            disabled: !selectedMenuId,
            children: selectedMenuId ? (
              <div>
                <Button type="link" onClick={() => setSelectedMenuId(null)}>← Retour à la liste</Button>
                {menu && (
                  <Card style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={6}><strong>Période:</strong> {menu.period_type_display}</Col>
                      <Col span={8}><strong>Du</strong> {dayjs(menu.start_date).format('DD/MM/YYYY')} <strong>au</strong> {dayjs(menu.end_date).format('DD/MM/YYYY')}</Col>
                      <Col span={4}>{menu.is_published ? <Tag color="green">Publié</Tag> : <Tag>Brouillon</Tag>}</Col>
                      <Col span={6}>{menu.notes}</Col>
                    </Row>
                  </Card>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Plats du menu ({items.length})</h3>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemForm()}>Ajouter un plat</Button>
                </div>

                <Row gutter={[16, 16]}>
                  {items.map((item) => (
                    <Col xs={24} md={12} lg={8} key={item.id}>
                      <Card
                        size="small"
                        title={
                          <span style={{ color: DAY_COLORS[item.day_of_week] || '#333' }}>
                            <CalendarOutlined /> {item.day_of_week_display} — {dayjs(item.date).format('DD/MM')}
                          </span>
                        }
                        extra={
                          <Space size="small">
                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openItemForm(item)} />
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(item.id)} />
                          </Space>
                        }
                      >
                        <p>🥗 <strong>Entrée:</strong> {item.starter || '—'}</p>
                        <p>🍖 <strong>Plat:</strong> {item.main_course}</p>
                        <p>🥦 <strong>Garniture:</strong> {item.side_dish || '—'}</p>
                        <p>🍰 <strong>Dessert:</strong> {item.dessert || '—'}</p>
                        {item.allergens && (
                          <Tag icon={<WarningOutlined />} color="magenta">{item.allergens}</Tag>
                        )}
                        <div style={{ marginTop: 8 }}>
                          {item.suitable_for_diabetic && <Tag color="blue">Diabétique ✓</Tag>}
                          {item.suitable_for_celiac && <Tag color="orange">Cœliaque ✓</Tag>}
                          {item.calories_approx && <Tag>{item.calories_approx} kcal</Tag>}
                        </div>
                      </Card>
                    </Col>
                  ))}
                  {items.length === 0 && (
                    <Col span={24}><Card><p style={{ textAlign: 'center', color: '#999' }}>Aucun plat pour ce menu. Ajoutez-en un !</p></Card></Col>
                  )}
                </Row>
              </div>
            ) : null,
          },
        ]}
      />

      {/* Menu modal */}
      <Modal title={editMenuId ? 'Modifier le menu' : 'Nouveau menu'} open={menuModalOpen}
        onOk={handleMenuSubmit} onCancel={() => { setMenuModalOpen(false); setEditMenuId(null); }}
        confirmLoading={createMenu.isPending || updateMenu.isPending}
        okText={editMenuId ? 'Mettre à jour' : 'Créer'} cancelText="Annuler" width={600}
      >
        <Form form={menuForm} layout="vertical">
          <Form.Item label="Titre" name="title" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Menu semaine du 12 janvier" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Période" name="period_type" initialValue="WEEKLY" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select options={PERIOD_OPTIONS} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Date début" name="start_date" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Date fin" name="end_date" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Remarques..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Menu item modal */}
      <Modal title={editItemId ? 'Modifier le plat' : 'Ajouter un plat'} open={itemModalOpen}
        onOk={handleItemSubmit} onCancel={() => { setItemModalOpen(false); setEditItemId(null); }}
        confirmLoading={createItem.isPending || updateItem.isPending}
        okText={editItemId ? 'Mettre à jour' : 'Ajouter'} cancelText="Annuler" width={650}
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Requis' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Divider plain>Composition</Divider>
          <Form.Item label="Entrée" name="starter">
            <Input placeholder="Ex: Salade variée" />
          </Form.Item>
          <Form.Item label="Plat principal" name="main_course" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Poulet grillé" />
          </Form.Item>
          <Form.Item label="Garniture" name="side_dish">
            <Input placeholder="Ex: Riz pilaf" />
          </Form.Item>
          <Form.Item label="Dessert" name="dessert">
            <Input placeholder="Ex: Yaourt aux fruits" />
          </Form.Item>
          <Divider plain>Informations diététiques</Divider>
          <Form.Item label="Allergènes" name="allergens">
            <Input placeholder="Ex: Gluten, Lait, Arachides" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Convient diabétiques" name="suitable_for_diabetic" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Convient cœliaques" name="suitable_for_celiac" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Calories (approx)" name="calories_approx">
              <InputNumber min={0} max={2000} placeholder="kcal" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
