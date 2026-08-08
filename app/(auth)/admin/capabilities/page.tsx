'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tenantsApi } from '@/lib/api';
import { useCapabilities, type CapabilityItem } from '@/components/CapabilityProvider';
import CapabilityTree, { type CapValueMap } from '@/components/CapabilityTree';
import PageHeader from '@/components/PageHeader';

const PRESETS = ['Kirana', 'Pharmacy', 'Wholesale', 'Full'] as const;

const PRESET_HINT: Record<string, string> = {
  Kirana: 'Retail shop — hides purchase requisitions, expiry and unit conversion',
  Pharmacy: 'Keeps expiry; hides unit conversion',
  Wholesale: 'Full ops without expiry fields',
  Full: 'Everything enabled',
};

export default function CapabilitiesPage() {
  const { refresh, preset: livePreset, tenantName } = useCapabilities();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preset, setPreset] = useState('Full');
  const [items, setItems] = useState<CapabilityItem[]>([]);
  const [values, setValues] = useState<CapValueMap>({});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantsApi.getCapabilities();
      const catalog: CapabilityItem[] = data.capabilities || [];
      setPreset(data.preset || 'Full');
      setItems(catalog);
      setValues(Object.fromEntries(catalog.map((c) => [c.key, !!c.enabled])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capabilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const applyPreset = async (name: string) => {
    if (!confirm(`Apply "${name}" preset? This replaces current toggles.`)) return;
    try {
      setSaving(true);
      setMessage(null);
      await tenantsApi.applyPreset(name);
      await load();
      await refresh();
      setMessage(`Applied ${name} preset.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply preset');
    } finally {
      setSaving(false);
    }
  };

  const saveOverrides = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      await tenantsApi.putCapabilities(items.map((c) => ({ key: c.key, enabled: !!values[c.key] })));
      await load();
      await refresh();
      setMessage('Saved. Preset is now Custom.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Modules & pages"
        subtitle={`What ${tenantName || 'this shop'} has switched on. Turning a module off blocks everything under it without losing your individual page choices.`}
        actions={
          <>
            <Link href="/admin" className="btn btn-secondary">
              ← Administration
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || loading}
              onClick={() => void saveOverrides()}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      />

      <section className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '18px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Business preset</h2>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Active: <strong style={{ color: 'var(--text-main)' }}>{livePreset || preset}</strong>
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginTop: '1rem' }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={saving || loading}
              onClick={() => void applyPreset(p)}
              className="btn"
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.3rem',
                padding: '0.85rem 1rem',
                borderRadius: '13px',
                background: (livePreset || preset) === p ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                color: (livePreset || preset) === p ? '#fff' : 'var(--text-main)',
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'left',
                height: 'auto',
              }}
            >
              <span style={{ fontWeight: 800 }}>{p}</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 500 }}>{PRESET_HINT[p]}</span>
            </button>
          ))}
        </div>
      </section>

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

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading capability catalog…</p>
      ) : (
        <CapabilityTree
          items={items}
          value={values}
          busy={saving}
          onToggle={(updates) => setValues((prev) => ({ ...prev, ...updates }))}
        />
      )}
    </div>
  );
}
