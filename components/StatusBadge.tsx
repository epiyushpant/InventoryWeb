'use client';

import React from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'muted' | 'info' | 'active' | 'inactive';

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  inactive: 'danger',
  draft: 'muted',
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
  canceled: 'danger',
  approved: 'success',
  rejected: 'danger',
  paid: 'success',
  due: 'danger',
  partial: 'warning',
  shipped: 'info',
  closed: 'muted',
  'po created': 'info',
  'in transit': 'info',
  critical: 'danger',
  soon: 'warning',
  expired: 'danger',
};

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  /** Map common document statuses automatically when tone omitted */
  status?: string;
  className?: string;
};

export default function StatusBadge({ children, tone, status, className = '' }: StatusBadgeProps) {
  const resolved: BadgeTone =
    tone ||
    (status ? STATUS_TONE[status.trim().toLowerCase()] || 'muted' : 'muted');

  return (
    <span className={`badge-pill badge-pill--${resolved} ${className}`.trim()}>
      {children ?? status}
    </span>
  );
}
