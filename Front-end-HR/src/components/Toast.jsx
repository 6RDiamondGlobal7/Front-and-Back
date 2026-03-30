import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import './Toast.css';

const toneToIcon = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

const Toast = ({ open, tone = 'info', message, onClose, duration = 3200 }) => {
  useEffect(() => {
    if (!open) return undefined;
    const timeoutId = window.setTimeout(() => {
      onClose?.();
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [open, onClose, duration]);

  if (!open || !message) return null;

  const Icon = toneToIcon[tone] || Info;

  return (
    <div className={`toast-shell ${tone}`} role="status" aria-live="polite">
      <div className={`toast-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="toast-message">{message}</div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
