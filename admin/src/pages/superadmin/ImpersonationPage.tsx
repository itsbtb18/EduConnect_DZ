import React, { useState } from 'react';
import { Table, Tag, Button, Modal, Select, Alert, message as antMsg } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  StopOutlined,
  HistoryOutlined,
  WarningOutlined,
  BankOutlined,
} from '@ant-design/icons';
import {
  useImpersonationLogs,
  useStartImpersonation,
  useEndImpersonation,
  useSchools,
} from '../../hooks/useApi';
import {
  PageHeader,
  DataCard,
  LoadingSkeleton,
  EmptyState,
} from '../../components/ui';
import type { ImpersonationLog } from '../../types';
import '../superadmin/SuperAdmin.css';

const ImpersonationPage: React.FC = () => {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState<{
    logId: string;
    schoolName: string;
  } | null>(null);

  const { data: logs, isLoading: logsLoading } = useImpersonationLogs();
  const { data: schoolsData } = useSchools({ page_size: 200 });
  const startMutation = useStartImpersonation();
  const endMutation = useEndImpersonation();

  const schools = (schoolsData?.results || []) as Array<{
    id: string;
    name: string;
    subdomain: string;
    is_active: boolean;
  }>;

  const handleStartImpersonation = () => {
    if (!selectedSchoolId) return;

    startMutation.mutate(selectedSchoolId, {
      onSuccess: (res) => {
        const data = res.data;
        // Store original tokens
        const originalAccess = localStorage.getItem('access_token');
        const originalRefresh = localStorage.getItem('refresh_token');
        if (originalAccess) localStorage.setItem('original_access_token', originalAccess);
        if (originalRefresh) localStorage.setItem('original_refresh_token', originalRefresh);

        // Set impersonation tokens
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('impersonation_log_id', data.log_id);
        localStorage.setItem('impersonating_school', data.school.name);

        setImpersonating({ logId: data.log_id, schoolName: data.school.name });
        setConfirmModalOpen(false);
        antMsg.success(`Impersonation démarrée: ${data.school.name}`);

        // Reload to apply new context
        window.location.href = '/dashboard';
      },
      onError: () => antMsg.error("Erreur lors du démarrage de l'impersonation"),
    });
  };

  const handleEndImpersonation = () => {
    const logId = impersonating?.logId || localStorage.getItem('impersonation_log_id');
    if (!logId) return;

    endMutation.mutate(logId, {
      onSuccess: () => {
        // Restore original tokens
        const originalAccess = localStorage.getItem('original_access_token');
        const originalRefresh = localStorage.getItem('original_refresh_token');
        if (originalAccess) localStorage.setItem('access_token', originalAccess);
        if (originalRefresh) localStorage.setItem('refresh_token', originalRefresh);

        localStorage.removeItem('original_access_token');
        localStorage.removeItem('original_refresh_token');
        localStorage.removeItem('impersonation_log_id');
        localStorage.removeItem('impersonating_school');

        setImpersonating(null);
        window.location.href = '/platform/impersonation';
      },
    });
  };

  const activeImpersonation = localStorage.getItem('impersonating_school');

  const columns: ColumnsType<ImpersonationLog> = [
    {
      title: 'Super Admin',
      dataIndex: 'super_admin_name',
      key: 'super_admin',
    },
    {
      title: 'École cible',
      dataIndex: 'target_school_name',
      key: 'school',
      render: (name: string) => (
        <span style={{ fontWeight: 600 }}>
          <BankOutlined style={{ marginRight: 6 }} />
          {name}
        </span>
      ),
    },
    {
      title: 'Utilisateur cible',
      dataIndex: 'target_user_name',
      key: 'user',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={action.includes('STARTED') ? 'orange' : 'green'}>
          {action.includes('STARTED') ? 'Démarrée' : 'Terminée'}
        </Tag>
      ),
    },
    {
      title: 'Début',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (d: string) => d ? new Date(d).toLocaleString('fr-FR') : '—',
    },
    {
      title: 'Fin',
      dataIndex: 'ended_at',
      key: 'ended_at',
      render: (d: string | null) => d ? new Date(d).toLocaleString('fr-FR') : '—',
    },
    {
      title: 'Durée',
      dataIndex: 'duration_minutes',
      key: 'duration',
      render: (m: number | null) => (m !== null ? `${m} min` : '—'),
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip',
      render: (ip: string | null) => ip || '—',
    },
  ];

  if (logsLoading) return <LoadingSkeleton variant="table" rows={6} />;

  return (
    <div className="sa-page">
      <PageHeader
        title="Impersonation"
        subtitle="Accéder à une école en tant qu'administrateur"
        icon={<EyeOutlined />}
      />

      {/* Active impersonation banner */}
      {activeImpersonation && (
        <Alert
          message={`Impersonation active: ${activeImpersonation}`}
          description="Vous naviguez actuellement en tant qu'administrateur de cette école. Toutes les actions sont journalisées."
          type="error"
          showIcon
          icon={<WarningOutlined />}
          banner
          action={
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleEndImpersonation}
              loading={endMutation.isPending}
            >
              Terminer
            </Button>
          }
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {/* Start impersonation card */}
      <DataCard
        title="Démarrer une impersonation"
        icon={<EyeOutlined />}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
              Sélectionner une école
            </label>
            <Select
              showSearch
              placeholder="Rechercher une école..."
              optionFilterProp="label"
              style={{ width: '100%' }}
              onChange={(val) => setSelectedSchoolId(val)}
              value={selectedSchoolId}
              options={schools.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.subdomain}.ilmi.dz)`,
              }))}
              size="large"
            />
          </div>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="large"
            disabled={!selectedSchoolId || !!activeImpersonation}
            onClick={() => setConfirmModalOpen(true)}
          >
            Impersonner
          </Button>
        </div>

        <Alert
          message="Avertissement"
          description="L'impersonation vous donne un accès complet en tant qu'administrateur de l'école sélectionnée. Toutes vos actions seront journalisées et traçables."
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      </DataCard>

      {/* Impersonation history */}
      <div style={{ marginTop: 24 }}>
      <DataCard
        title="Historique des impersonations"
        icon={<HistoryOutlined />}
        noPadding
      >
        <Table
          columns={columns}
          dataSource={(logs || []) as ImpersonationLog[]}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          size="small"
          locale={{
            emptyText: (
              <EmptyState
                icon={<HistoryOutlined />}
                title="Aucune impersonation"
                description="L'historique apparaîtra ici."
              />
            ),
          }}
          className="sa-dark-table"
        />
      </DataCard>
      </div>

      {/* Confirmation modal */}
      <Modal
        title="Confirmer l'impersonation"
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={handleStartImpersonation}
        okText="Confirmer"
        cancelText="Annuler"
        okButtonProps={{
          danger: true,
          loading: startMutation.isPending,
        }}
      >
        <Alert
          message="Attention"
          description={
            <>
              Vous allez accéder à l&apos;école{' '}
              <strong>
                {schools.find((s) => s.id === selectedSchoolId)?.name || ''}
              </strong>{' '}
              en tant qu&apos;administrateur. Cette action est journalisée et sera visible
              dans l&apos;historique d&apos;audit.
            </>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <p style={{ color: 'var(--text-secondary)' }}>
          📋 Durée maximale : 2 heures<br />
          🔍 Toutes les actions sont tracées<br />
          ⚡ L&apos;administrateur de l&apos;école sera notifié
        </p>
      </Modal>
    </div>
  );
};

export default ImpersonationPage;
