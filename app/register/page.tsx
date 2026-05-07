'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authApi.register(formData);
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message || 'Initialization sequence failed. Retry later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass animate-fade">
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 className="auth-title">New Operator</h1>
                    <p className="auth-subtitle">Initialize your strategic clearance.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Designation</label>
                        <input
                            name="fullName"
                            type="text"
                            className="form-input"
                            placeholder="e.g. Commander John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Operator Identity</label>
                        <input
                            name="username"
                            type="text"
                            className="form-input"
                            placeholder="Unique identifier"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Communication Link</label>
                        <input
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Security Key</label>
                        <input
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message glass" style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Initializing...' : 'Commit Protocol'}
                    </button>
                </form>

                <p style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Already cleared?{' '}
                    <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                        Establish Session
                    </Link>
                </p>
            </div>
        </div>
    );
}
