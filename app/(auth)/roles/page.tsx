















'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { rolesApi, tenantsApi } from '@/lib/api';
import { useCapabilities, type CapabilityItem } from '@/components/CapabilityProvider';
import CapabilityTree, { type CapValueMap } from '@/components/CapabilityTree';
import PageHeader from '@/components/PageHeader';

type RoleSummary = {
  name: string;
  userCount: number;
  isAdmin: boolean;
  isDefault: boolean;
};

export default function RolesPage() {
  const { refresh } = useCapabilities();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [items, setItems] = useState<CapabilityItem[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<CapValueMap>({});
  const [shopEnabled, setShopEnabled] = useState<CapValueMap>({});
  const [isDefault, setIsDefault] = useState(true);

  const loadRole = useCallback(async (role: string) => {
    const data = await rolesApi.getPermissions(role);
    const map: CapValueMap = {};
    (data.permissions || []).forEach((p: { key: string; allowed: boolean }) => {
      map[p.key] = !!p.allowed;
    });
    setPermissions(map);
    setShopEnabled(data.enabled || {});
    setIsDefault(!!data.isDefault);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [caps, roleList] = await Promise.all([tenantsApi.getCapabilities(), rolesApi.getRoles()]);
      setItems(caps.capabilities || []);
      const list: RoleSummary[] = roleList.roles || [];
      setRoles(list);
      const first = selectedRole || list.find((r) => !r.isAdmin)?.name || list[0]?.name || '';
      setSelectedRole(first);
      if (first) await loadRole(first);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [loadRole, selectedRole]);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRole = async (role: string) => {
    setSelectedRole(role);
    setMessage(null);
    setError(null);
    try {
      await loadRole(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role permissions');
    }
  };

  const current = roles.find((r) => r.name === selectedRole);
  const isAdminRole = !!current?.isAdmin;

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await rolesApi.putPermissions(
        selectedRole,
        Object.entries(permissions).map(([key, allowed]) => ({ key, allowed }))
      );
      await loadAll();
      await refresh();
      setMessage(`Saved permissions for ${selectedRole}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm(`Reset ${selectedRole} to its default permissions?`)) return;
    try {
      setSaving(true);
      setError(null);
      await rolesApi.reset(selectedRole);
      await loadAll();
      await refresh();
      setMessage(`${selectedRole} is back to defaults.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  const copyFrom = async (role: string) => {
    if (!role) return;
    try {
      const data = await rolesApi.getPermissions(role);
      const map: CapValueMap = {};
      (data.permissions || []).forEach((p: { key: string; allowed: boolean }) => {
        // Never copy in something this shop has switched off.
        map[p.key] = !!p.allowed && shopEnabled[p.key] !== false;
      });
      setPermissions(map);
      setMessage(`Copied ${role}'s grants. Save to apply them to ${selectedRole}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy role');
    }
  };

  return (
    <div className="animate-fade">
      <PageHeader
        title="Roles & permissions"
        subtitle="Roles decide who may open a screen. Modules & pages decide what the shop has at all — a screen must be on in both."
        actions={
          <>
            <Link href="/admin" className="btn btn-secondary">
              ← Administration
            </Link>
            {!isAdminRole && (
              <>
                <button type="button" className="btn btn-secondary" disabled={saving || isDefault} onClick={() => void reset()}>
                  Reset to default
                </button>
                <button type="button" className="btn btn-primary" disabled={saving || loading} onClick={() => void save()}>
                  {saving ? 'Saving…' : `Save ${selectedRole || 'role'}`}
                </button>
              </>
            )}
          </>
        }
      />

      <section className="glass" style={{ padding: '1rem 1.25rem', borderRadius: '18px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {roles.map((role) => (
            <button
              key={role.name}
              type="button"
              className="btn"
              onClick={() => void selectRole(role.name)}
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                padding: '0.6rem 0.95rem',
                borderRadius: '12px',
                height: 'auto',
                background: selectedRole === role.name ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                color: selectedRole === role.name ? '#fff' : 'var(--text-main)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontWeight: 800 }}>{role.name}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 500 }}>
                {role.userCount} user{role.userCount === 1 ? '' : 's'}
                {role.isAdmin ? ' · full access' : role.isDefault ? ' · default' : ' · custom'}
              </span>
            </button>
          ))}

          {!isAdminRole && roles.length > 1 && (
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Copy from
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
                value=""
                onChange={(e) => void copyFrom(e.target.value)}
              >
                <option value="">Select role…</option>
                {roles
                  .filter((r) => r.name !== selectedRole)
                  .map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
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
        <p style={{ color: 'var(--text-muted)' }}>Loading roles…</p>
      ) : isAdminRole ? (
        <p style={{ color: 'var(--text-muted)' }}>
          Admin always has full access and cannot be restricted, so nobody can lock themselves out.
          Pick another role to edit its grants.
        </p>
      ) : (
        <CapabilityTree
          items={items}
          value={permissions}
          mode="permission"
          shopEnabled={shopEnabled}
          busy={saving}
          onToggle={(updates) => setPermissions((prev) => ({ ...prev, ...updates }))}
        />
      )}
    </div>
  );
}
