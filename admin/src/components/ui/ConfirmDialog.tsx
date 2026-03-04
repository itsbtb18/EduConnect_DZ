import React, { useState, createContext, useContext, useCallback } from 'react';
import { WarningOutlined, DeleteOutlined, ExclamationCircleOutlined, CloseOutlined } from '@ant-design/icons';
import './ConfirmDialog.css';

/* ── Types ── */
type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If set, user must type this to enable confirm (for destructive actions) */
  confirmText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

const ICONS: Record<ConfirmVariant, React.ReactNode> = {
  danger: <DeleteOutlined />,
  warning: <WarningOutlined />,
  info: <ExclamationCircleOutlined />,
};

/* ── Provider ── */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((v: boolean) => void) | null;
  }>({
    open: false,
    options: { title: '', message: '' },
    resolve: null,
  });

  const [typedText, setTypedText] = useState('');

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setTypedText('');
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  const { options } = state;
  const variant = options.variant || 'danger';
  const needsTextConfirm = !!options.confirmText;
  const textMatches = !needsTextConfirm || typedText === options.confirmText;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state.open && (
        <div className="cfd-overlay" onClick={handleCancel}>
          <div className={`cfd-dialog cfd-dialog--${variant}`} onClick={(e) => e.stopPropagation()}>
            <button className="cfd-close" onClick={handleCancel}><CloseOutlined /></button>

            <div className={`cfd-icon cfd-icon--${variant}`}>
              {ICONS[variant]}
            </div>

            <h3 className="cfd-title">{options.title}</h3>
            <p className="cfd-message">{options.message}</p>

            {needsTextConfirm && (
              <div className="cfd-confirm-input">
                <label className="cfd-confirm-label">
                  Tapez <strong>{options.confirmText}</strong> pour confirmer
                </label>
                <input
                  className="cfd-input"
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder={options.confirmText}
                  autoFocus
                />
              </div>
            )}

            <div className="cfd-actions">
              <button className="cfd-btn cfd-btn--cancel" onClick={handleCancel}>
                {options.cancelLabel || 'Annuler'}
              </button>
              <button
                className={`cfd-btn cfd-btn--${variant}`}
                onClick={handleConfirm}
                disabled={!textMatches}
              >
                {options.confirmLabel || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

/* ── Hook ── */
export const useConfirm = (): ConfirmContextType => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
};
