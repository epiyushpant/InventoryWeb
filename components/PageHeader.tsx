'use client';

import React from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        <h1 className="auth-title page-heading">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
