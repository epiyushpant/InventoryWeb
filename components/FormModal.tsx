'use client';

import React from 'react';

type FormModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Footer buttons (Cancel / Save). If omitted, only close via backdrop is available. */
  footer?: React.ReactNode;
  wide?: boolean;
  className?: string;
};

/**
 * Shared modal shell for CRUD forms. Prefer this over copying modal-backdrop markup.
 */
export default function FormModal({
  title,
  description,
  onClose,
  children,
  footer,
  wide,
  className = '',
}: FormModalProps) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`glass modal-card animate-fade ${wide ? 'modal-card--wide' : ''} ${className}`.trim()}>
        <div className="modal-header-row">
          <div>
            <h2 id="form-modal-title" className="modal-title">
              {title}
            </h2>
            {description && <p className="modal-description">{description}</p>}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="form-actions">{footer}</div>}
      </div>
    </div>
  );
}
