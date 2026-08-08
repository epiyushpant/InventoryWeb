'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '../../../lib/api';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

interface User {
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    roles: string[];
}

const AVAILABLE_ROLES = ["Admin", "User", "Sales", "Inventory", "Accountant"];

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for editing roles
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [updatingRoles, setUpdatingRoles] = useState(false);

    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        roles: ['User'] as string[],
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getAll();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await usersApi.delete(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete user: " + err);
        }
    };

    const openRoleModal = (user: User) => {
        setEditingUser(user);
        setSelectedRoles([...user.roles]);
    };

    const closeRoleModal = () => {
        setEditingUser(null);
        setSelectedRoles([]);
    };

    const toggleRole = (role: string) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const saveRoles = async () => {
        if (!editingUser) return;
        setUpdatingRoles(true);
        try {
            await usersApi.updateRoles(editingUser.id, selectedRoles);
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, roles: selectedRoles } : u));
            closeRoleModal();
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : String(err);
            alert('Failed to update roles: ' + message);
        } finally {
            setUpdatingRoles(false);
        }
    };

    const toggleCreateRole = (role: string) => {
        setCreateForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role],
        }));
    };

    const createUser = async () => {
        if (!createForm.username.trim() || !createForm.password.trim()) {
            alert('Username and password are required.');
            return;
        }
        setCreating(true);
        try {
            const created = await usersApi.create({
                username: createForm.username.trim(),
                email: createForm.email.trim() || `${createForm.username.trim()}@local`,
                password: createForm.password,
                fullName: createForm.fullName.trim() || undefined,
                roles: createForm.roles.length ? createForm.roles : ['User'],
            });
            setUsers((prev) => [...prev, created]);
            setShowCreate(false);
            setCreateForm({ username: '', email: '', password: '', fullName: '', roles: ['User'] });
        } catch (err) {
            alert('Failed to create user: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="animate-fade" style={{ paddingTop: '1rem' }}>
            <PageHeader
                title="User Management"
                subtitle="Oversee system access and manage user credentials."
                actions={
                    <button
                        type="button"
                        className="btn btn-primary btn-wide"
                        onClick={() => setShowCreate(true)}
                    >
                        + Create user
                    </button>
                }
            />

            <section className="glass table-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Registered operators</h2>
                        <p className="text-muted-small" style={{ marginTop: '0.35rem' }}>View and manage active personnel in the system.</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Synchronizing user data...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)' }}>{error}</div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found in the system.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {users.map((user) => (
                            <div key={user.id} className="animate-fade" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.03)',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '52px',
                                        height: '52px',
                                        background: 'linear-gradient(45deg, var(--primary), #a855f7)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        fontSize: '1.2rem',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                    }}>
                                        {user.fullName ? user.fullName[0] : user.username[0]}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{user.fullName || user.username}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{user.email}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {user.roles.length > 0 ? user.roles.map(role => (
                                                <StatusBadge key={role} tone="info">{role}</StatusBadge>
                                            )) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Roles</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => openRoleModal(user)}
                                            className="btn btn-secondary" 
                                            title="Edit Roles"
                                            style={{ 
                                                padding: '0.5rem', 
                                                borderRadius: '10px', 
                                                width: '40px', 
                                                height: '40px'
                                            }}
                                        >
                                            ⚙️
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user.id)}
                                            className="btn btn-secondary" 
                                            title="Delete User"
                                            style={{ 
                                                padding: '0.5rem', 
                                                borderRadius: '10px', 
                                                width: '40px', 
                                                height: '40px',
                                                color: 'var(--error)'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {showCreate && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="glass" style={{
                        padding: '2.5rem',
                        borderRadius: '28px',
                        width: '100%',
                        maxWidth: '520px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ fontSize: '1.6rem', margin: '0 0 0.5rem 0' }}>Create user</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Admin assigns username, password, and roles.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
                            {[
                                { key: 'username', label: 'Username *', type: 'text' },
                                { key: 'fullName', label: 'Full name', type: 'text' },
                                { key: 'email', label: 'Email', type: 'email' },
                                { key: 'password', label: 'Password *', type: 'password' },
                            ].map((f) => (
                                <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{f.label}</span>
                                    <input
                                        type={f.type}
                                        value={(createForm as any)[f.key]}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                        className="form-input"
                                        style={{ padding: '0.7rem 0.9rem', borderRadius: '10px' }}
                                    />
                                </label>
                            ))}
                            <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Roles</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {AVAILABLE_ROLES.map((role) => (
                                        <label key={role} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.45rem 0.75rem', borderRadius: '999px',
                                            background: createForm.roles.includes(role) ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                                            color: createForm.roles.includes(role) ? '#fff' : 'var(--text-main)',
                                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={createForm.roles.includes(role)}
                                                onChange={() => toggleCreateRole(role)}
                                                style={{ display: 'none' }}
                                            />
                                            {role}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem' }}>Cancel</button>
                            <button type="button" onClick={() => void createUser()} disabled={creating} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
                                {creating ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingUser && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="glass" style={{
                        padding: '3rem',
                        borderRadius: '32px',
                        width: '100%',
                        maxWidth: '500px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ fontSize: '1.8rem', margin: '0 0 1.5rem 0' }}>
                            Edit Roles
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Modify access roles for <strong>{editingUser.fullName || editingUser.username}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
                            {AVAILABLE_ROLES.map(role => (
                                <label key={role} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedRoles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                                    />
                                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{role}</span>
                                </label>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={closeRoleModal} 
                                className="btn btn-secondary"
                                style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={saveRoles} 
                                className="btn btn-primary"
                                disabled={updatingRoles}
                                style={{ padding: '0.8rem 2rem', borderRadius: '12px' }}
                            >
                                {updatingRoles ? 'Saving...' : 'Save Roles'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
