'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi, setUserFullName, logout } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import FormModal from '@/components/FormModal';
import StatusBadge from '@/components/StatusBadge';

type Profile = {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    role: string;
    country?: string;
    city?: string;
    postalCode?: string;
    taxId?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
};

type EditSection = 'personal' | 'address' | null;

const socialIcons: Record<string, React.ReactNode> = {
    facebook: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" /></svg>
    ),
    twitter: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2H21.5l-7.14 8.16L22.5 22h-6.6l-5.17-6.77L4.8 22H1.54l7.64-8.73L1.5 2h6.77l4.67 6.18L18.24 2zm-1.16 18h1.83L7.02 3.9H5.06L17.08 20z" /></svg>
    ),
    linkedin: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM0 8h5v16H0V8zm7.5 0h4.78v2.19h.07c.67-1.2 2.3-2.46 4.73-2.46 5.06 0 6 3.33 6 7.66V24h-5v-7.4c0-1.77-.03-4.04-2.46-4.04-2.46 0-2.84 1.92-2.84 3.91V24h-5V8z" /></svg>
    ),
    instagram: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><line x1="17.5" y1="6.5" x2="17.5" y2="6.5" /></svg>
    ),
};

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editSection, setEditSection] = useState<EditSection>(null);
    const [form, setForm] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdError, setPwdError] = useState('');

    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getMe();
            setProfile(data);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (section: EditSection) => {
        setForm(profile ? { ...profile } : null);
        setFormError('');
        setEditSection(section);
    };

    const setField = (key: keyof Profile, value: string) => {
        setForm((f) => (f ? { ...f, [key]: value } : f));
    };

    const saveProfile = async () => {
        if (!form) return;
        try {
            setSaving(true);
            setFormError('');
            const updated = await profileApi.update(form);
            setProfile(updated);
            if (updated.fullName) setUserFullName(updated.fullName);
            setEditSection(null);
        } catch (err: any) {
            setFormError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async () => {
        if (pwd.newPassword !== pwd.confirm) {
            setPwdError('New password and confirmation do not match.');
            return;
        }
        try {
            setPwdSaving(true);
            setPwdError('');
            await profileApi.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
            setShowPassword(false);
            setPwd({ currentPassword: '', newPassword: '', confirm: '' });
            setNotice('Password changed successfully.');
        } catch (err: any) {
            setPwdError(err.message || 'Failed to change password');
        } finally {
            setPwdSaving(false);
        }
    };

    const handleLogoutAll = async () => {
        if (!confirm('Sign out of all sessions? You will need to log in again.')) return;
        try {
            setBusy(true);
            await profileApi.logoutAll();
            logout();
            router.push('/login');
        } catch (err: any) {
            setNotice(err.message || 'Failed to sign out other sessions');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete your account permanently? This cannot be undone.')) return;
        if (!confirm('Are you absolutely sure? All access will be removed immediately.')) return;
        try {
            setBusy(true);
            await profileApi.deleteAccount();
            logout();
            router.push('/login');
        } catch (err: any) {
            setNotice(err.message || 'Failed to delete account');
            setBusy(false);
        }
    };

    if (loading && !profile) {
        return (
            <div className="animate-fade page-section">
                <PageHeader title="My Profile" subtitle="Loading your account…" />
                <div className="skeleton-grid">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton-block" />
                    ))}
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="animate-fade page-section">
                <PageHeader title="My Profile" subtitle="Manage your account details." />
                <div className="glass alert-card error" role="alert">{error}</div>
            </div>
        );
    }

    if (!profile) return null;

    const displayName = profile.fullName || `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.username;
    const location = [profile.city, profile.country].filter(Boolean).join(', ');
    const socials: Array<[keyof Profile, string]> = [
        ['facebook', profile.facebook || ''],
        ['twitter', profile.twitter || ''],
        ['linkedin', profile.linkedin || ''],
        ['instagram', profile.instagram || ''],
    ];

    return (
        <div className="animate-fade page-section">
            <PageHeader title="My Profile" subtitle="Manage your personal details, address, and security." />

            {notice && (
                <div className="page-section" style={{ paddingBottom: 0 }}>
                    <div className="glass alert-card" role="status" style={{ marginBottom: '1rem' }}>{notice}</div>
                </div>
            )}

            {/* Profile meta card */}
            <div className="panel-grid">
                <Panel title="Profile" subtitle="How you appear across the system" actions={<button className="btn btn-secondary btn-small" onClick={() => openEdit('personal')}>Edit</button>}>
                    <div className="profile-hero">
                        <div className="profile-avatar">{displayName.charAt(0).toUpperCase()}</div>
                        <div className="profile-hero__main">
                            <h3 className="profile-hero__name">{displayName}</h3>
                            <div className="profile-hero__meta">
                                <StatusBadge tone="info">{profile.role}</StatusBadge>
                                {location && <span className="text-muted-small">{location}</span>}
                            </div>
                            <p className="text-muted-small" style={{ marginTop: '0.35rem' }}>@{profile.username}</p>
                        </div>
                        <div className="profile-socials">
                            {socials.filter(([, v]) => v).map(([key, v]) => (
                                <a key={key} href={v} target="_blank" rel="noreferrer" className="profile-social" title={String(key)}>
                                    {socialIcons[key as string]}
                                </a>
                            ))}
                        </div>
                    </div>
                </Panel>
            </div>

            {/* Personal information */}
            <div className="panel-grid">
                <Panel title="Personal Information" subtitle="Your name and contact details" actions={<button className="btn btn-secondary btn-small" onClick={() => openEdit('personal')}>Edit</button>}>
                    <div className="detail-grid">
                        <Field label="First Name" value={profile.firstName} />
                        <Field label="Last Name" value={profile.lastName} />
                        <Field label="Email address" value={profile.email} />
                        <Field label="Phone" value={profile.phone} />
                        <Field label="Bio" value={profile.bio} full />
                    </div>
                </Panel>
            </div>

            {/* Address */}
            <div className="panel-grid">
                <Panel title="Address" subtitle="Where you are based" actions={<button className="btn btn-secondary btn-small" onClick={() => openEdit('address')}>Edit</button>}>
                    <div className="detail-grid">
                        <Field label="Country" value={profile.country} />
                        <Field label="City / State" value={profile.city} />
                        <Field label="Postal Code" value={profile.postalCode} />
                        <Field label="TAX ID (PAN/VAT)" value={profile.taxId} />
                    </div>
                </Panel>
            </div>

            {/* Security */}
            <div className="panel-grid">
                <Panel title="Security" subtitle="Keep your account protected">
                    <div className="setting-row">
                        <div>
                            <p className="setting-row__title">Change Password</p>
                            <p className="setting-row__desc">Update the password you use to sign in.</p>
                        </div>
                        <button className="btn btn-secondary btn-small" onClick={() => { setPwd({ currentPassword: '', newPassword: '', confirm: '' }); setPwdError(''); setShowPassword(true); }}>
                            Change Password
                        </button>
                    </div>
                </Panel>
            </div>

            {/* Danger zone */}
            <div className="panel-grid">
                <Panel title="Danger Zone" subtitle="Irreversible and high-impact actions" className="panel--danger">
                    <div className="setting-row">
                        <div>
                            <p className="setting-row__title">Logout all devices</p>
                            <p className="setting-row__desc">Sign out from every active session.</p>
                        </div>
                        <button className="btn btn-secondary btn-small" onClick={handleLogoutAll} disabled={busy}>Logout</button>
                    </div>
                    <div className="setting-row">
                        <div>
                            <p className="setting-row__title">Delete account</p>
                            <p className="setting-row__desc">Once deleted, there is no going back. Please be certain.</p>
                        </div>
                        <button className="btn btn-danger btn-small" onClick={handleDelete} disabled={busy}>Delete account</button>
                    </div>
                </Panel>
            </div>

            {/* Edit modal */}
            {editSection && form && (
                <FormModal
                    title={editSection === 'personal' ? 'Edit Personal Information' : 'Edit Address'}
                    description={editSection === 'personal' ? 'Update your name, contact details, and social links.' : 'Update your location and tax details.'}
                    onClose={() => setEditSection(null)}
                    wide
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setEditSection(null)} disabled={saving}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                        </>
                    }
                >
                    {formError && <div className="glass alert-card error" role="alert" style={{ marginBottom: '1rem' }}>{formError}</div>}
                    {editSection === 'personal' ? (
                        <div className="form-grid form-grid-2">
                            <Input label="First Name" value={form.firstName} onChange={(v) => setField('firstName', v)} />
                            <Input label="Last Name" value={form.lastName} onChange={(v) => setField('lastName', v)} />
                            <Input label="Email address" type="email" value={form.email} onChange={(v) => setField('email', v)} />
                            <Input label="Phone" value={form.phone} onChange={(v) => setField('phone', v)} />
                            <div className="form-span-2">
                                <label className="form-label">Bio</label>
                                <textarea className="form-input" rows={3} value={form.bio ?? ''} onChange={(e) => setField('bio', e.target.value)} />
                            </div>
                            <Input label="Facebook URL" value={form.facebook} onChange={(v) => setField('facebook', v)} />
                            <Input label="X (Twitter) URL" value={form.twitter} onChange={(v) => setField('twitter', v)} />
                            <Input label="LinkedIn URL" value={form.linkedin} onChange={(v) => setField('linkedin', v)} />
                            <Input label="Instagram URL" value={form.instagram} onChange={(v) => setField('instagram', v)} />
                        </div>
                    ) : (
                        <div className="form-grid form-grid-2">
                            <Input label="Country" value={form.country} onChange={(v) => setField('country', v)} />
                            <Input label="City / State" value={form.city} onChange={(v) => setField('city', v)} />
                            <Input label="Postal Code" value={form.postalCode} onChange={(v) => setField('postalCode', v)} />
                            <Input label="TAX ID (PAN/VAT)" value={form.taxId} onChange={(v) => setField('taxId', v)} />
                        </div>
                    )}
                </FormModal>
            )}

            {/* Change password modal */}
            {showPassword && (
                <FormModal
                    title="Change Password"
                    description="Enter your current password and choose a new one."
                    onClose={() => setShowPassword(false)}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setShowPassword(false)} disabled={pwdSaving}>Cancel</button>
                            <button className="btn btn-primary" onClick={changePassword} disabled={pwdSaving}>{pwdSaving ? 'Saving…' : 'Update Password'}</button>
                        </>
                    }
                >
                    {pwdError && <div className="glass alert-card error" role="alert" style={{ marginBottom: '1rem' }}>{pwdError}</div>}
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input type="password" className="form-input" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input type="password" className="form-input" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" className="form-input" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
                    </div>
                </FormModal>
            )}
        </div>
    );
}

function Field({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
    return (
        <div className={`detail-item${full ? ' detail-item--full' : ''}`}>
            <span className="detail-item__label">{label}</span>
            <span className="detail-item__value">{value || <span className="text-muted-small">—</span>}</span>
        </div>
    );
}

function Input({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value?: string | null;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <input type={type} className="form-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}
