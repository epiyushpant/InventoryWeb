'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '../../../lib/api';

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
            alert('Failed to update roles: ' + err);
        } finally {
            setUpdatingRoles(false);
        }
    };

    return (
        <div className="animate-fade" style={{ paddingTop: '1rem' }}>
            <header style={{ marginBottom: '3.5rem', padding: '0 1rem' }}>
                <h1 className="auth-title" style={{ fontSize: '3.5rem', margin: 0 }}>User Management</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                    Oversee system access and manage user credentials.
                </p>
            </header>

            <section className="glass" style={{ padding: '3rem', borderRadius: '32px', margin: '0 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', margin: 0 }}>Registered Operators</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>View and manage active personnel in the system.</p>
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
                                                <span key={role} style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '100px',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    fontWeight: 600
                                                }}>{role}</span>
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
