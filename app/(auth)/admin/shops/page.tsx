'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tenantsApi } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

const PRESETS = ['Kirana', 'Pharmacy', 'Wholesale', 'Full'] as const;

export default function ProvisionShopPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    preset: 'Full',
    adminUsername: '',
    adminPassword: '',
    adminEmail: '',
    adminFullName: '',
  });

  const provision = async () => {
    if (!form.name.trim() || !form.adminUsername.trim() || !form.adminPassword.trim()) {
      setError('Shop name, admin username, and password are required.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const result = await tenantsApi.provision({
        name: form.name.trim(),
        preset: form.preset,
        adminUsername: form.adminUsername.trim(),
        adminPassword: form.adminPassword,
        adminEmail: form.adminEmail.trim() || undefined,
        adminFullName: form.adminFullName.trim() || undefined,
      });
      setMessage(
        `Provisioned "${result.name}" (tenant #${result.tenantId}). Log out and sign in as ${result.adminUsername} to use that empty shop.`
      );
      setForm({ name: '', preset: 'Full', adminUsername: '', adminPassword: '', adminEmail: '', adminFullName: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision shop');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
      <input
        type={type}
        className="form-input"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <div className="animate-fade">
      <PageHeader
        title="Provision a shop"
        subtitle="Creates a separate tenant with its own Admin. Existing shop data stays isolated."
        actions={
          <Link href="/admin" className="btn btn-secondary">
            ← Administration
          </Link>
        }
      />

      {(error || message) && (
        <div
          style={{
            padding: '0.85rem 1.1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            background: error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            color: error ? 'var(--error)' : 'var(--secondary)',
            fontWeight: 600,
          }}
        >
          {error || message}
        </div>
      )}

      <section className="glass" style={{ padding: '1.5rem 1.75rem', borderRadius: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
          {field('Shop name', 'name')}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Preset</span>
            <select
              className="form-input"
              value={form.preset}
              onChange={(e) => setForm({ ...form, preset: e.target.value })}
            >
              {PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          {field('Admin username', 'adminUsername')}
          {field('Admin password', 'adminPassword', 'password')}
          {field('Admin email', 'adminEmail')}
          {field('Admin full name', 'adminFullName')}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving}
          onClick={() => void provision()}
          style={{ marginTop: '1.25rem' }}
        >
          {saving ? 'Working…' : 'Create shop + Admin'}
        </button>
      </section>
    </div>
  );
}
