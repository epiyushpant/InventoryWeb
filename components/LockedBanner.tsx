'use client';

export default function LockedBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      style={{
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        background: 'rgba(245, 158, 11, 0.08)',
        color: '#f59e0b',
        fontSize: '0.9rem',
        fontWeight: 600,
      }}
    >
      Locked — {message}
    </div>
  );
}
