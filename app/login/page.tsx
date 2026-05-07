'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi, setAuthToken } from '@/lib/api';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('registered')) {
            setSuccess('Strategic account initialized. Please authenticate.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await authApi.login({ username, password });
            setAuthToken(data.token);
            router.push('/home');
        } catch (err: any) {
            setError(err.message || 'Authentication sequence failed. Verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass animate-fade">
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Access the strategic inventory hub.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Operator identity"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Security Key</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message glass" style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {success && (
                        <div className="error-message glass" style={{ color: 'var(--success)', padding: '0.75rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <span>✅</span> {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Establish Session'}
                    </button>
                </form>

                <p style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    New operator?{' '}
                    <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                        Initialize account
                    </Link>
                </p>
            </div>
        </div>
    );
}
