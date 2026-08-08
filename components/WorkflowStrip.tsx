'use client';

import Link from 'next/link';

export type WorkflowStep = {
  label: string;
  href?: string;
  active?: boolean;
  done?: boolean;
};

export default function WorkflowStrip({ steps }: { steps: WorkflowStep[] }) {
  return (
    <nav
      aria-label="Document workflow"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        alignItems: 'center',
        marginBottom: '1.25rem',
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        fontSize: '0.8rem',
      }}
    >
      {steps.map((step, i) => (
        <span key={step.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          {i > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 0.15rem' }}>→</span>}
          {step.href && !step.active ? (
            <Link
              href={step.href}
              style={{
                color: step.done ? 'var(--secondary)' : 'var(--primary)',
                textDecoration: 'none',
                fontWeight: step.done ? 600 : 500,
              }}
            >
              {step.label}
            </Link>
          ) : (
            <span
              style={{
                fontWeight: step.active ? 700 : 500,
                color: step.active ? 'var(--text-main)' : step.done ? 'var(--secondary)' : 'var(--text-muted)',
              }}
            >
              {step.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
