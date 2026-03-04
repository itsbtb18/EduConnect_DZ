/**
 * PublishButton — button with confirm to publish grades/averages.
 */
import React from 'react';
import { Button, Popconfirm } from 'antd';
import { SendOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

interface PublishButtonProps {
  published?: boolean;
  onPublish: () => void;
  loading?: boolean;
  label?: string;
  publishedLabel?: string;
  confirmMessage?: string;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
}

const PublishButton: React.FC<PublishButtonProps> = ({
  published,
  onPublish,
  loading,
  label = '📢 Publier',
  publishedLabel = '✅ Publié',
  confirmMessage = 'Publier ? Les parents/élèves verront les notes.',
  disabled,
  size = 'middle',
  block,
}) => {
  if (published) {
    return (
      <Button
        size={size}
        block={block}
        icon={<CheckCircleOutlined />}
        style={{ background: '#10B981', borderColor: '#10B981', color: '#fff' }}
        disabled
      >
        {publishedLabel}
      </Button>
    );
  }

  return (
    <Popconfirm
      title={confirmMessage}
      onConfirm={onPublish}
      okText="Confirmer"
      cancelText="Annuler"
      okButtonProps={{ style: { background: '#00C9A7', borderColor: '#00C9A7' } }}
    >
      <Button
        type="primary"
        size={size}
        block={block}
        icon={loading ? <LoadingOutlined /> : <SendOutlined />}
        loading={loading}
        disabled={disabled}
        style={{ background: '#00C9A7', borderColor: '#00C9A7' }}
      >
        {label}
      </Button>
    </Popconfirm>
  );
};

export default PublishButton;
