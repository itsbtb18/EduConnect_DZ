import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import './Toast.css';

/* ── Types ── */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = sticky
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleOutlined />,
  error: <CloseCircleOutlined />,
  info: <InfoCircleOutlined />,
  warning: <WarningOutlined />,
};

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

let idCounter = 0;

/* ── Provider ── */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string, duration = DEFAULT_DURATION) => {
      const id = `toast-${++idCounter}`;
      const item: ToastItem = { id, type, title, message, duration };
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), item]);

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
    },
    [dismiss],
  );

  const success = useCallback((t: string, m?: string) => toast('success', t, m), [toast]);
  const error = useCallback((t: string, m?: string) => toast('error', t, m), [toast]);
  const info = useCallback((t: string, m?: string) => toast('info', t, m), [toast]);
  const warning = useCallback((t: string, m?: string) => toast('warning', t, m), [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__icon">{ICONS[t.type]}</span>
            <div className="toast__body">
              <span className="toast__title">{t.title}</span>
              {t.message && <span className="toast__msg">{t.message}</span>}
            </div>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Fermer">
              <CloseOutlined />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ── Hook ── */
export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};
