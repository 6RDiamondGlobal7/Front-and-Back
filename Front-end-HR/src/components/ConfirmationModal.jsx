import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'warning',
  onConfirm,
  onCancel,
  loading = false,
  showCloseButton = true,
  icon: CustomIcon = null
}) => {
  if (!isOpen) return null;

  const Icon = CustomIcon || ((tone === 'success' || tone === 'interview') ? CheckCircle2 : AlertTriangle);

  return (
    <div className="confirmation-modal-backdrop" onClick={onCancel}>
      <div className={`confirmation-modal-card ${tone}`} onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-title-wrap">
            <div className={`confirmation-modal-icon ${tone}`}>
              <Icon size={22} />
            </div>
            <h3>{title}</h3>
          </div>
          {showCloseButton && (
            <button className="confirmation-modal-close" onClick={onCancel} aria-label="Close confirmation modal">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="confirmation-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirmation-modal-actions">
          <button className="confirmation-modal-cancel" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={`confirmation-modal-confirm ${tone}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
