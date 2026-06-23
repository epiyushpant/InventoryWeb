'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

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
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

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
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass animate-fade">
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 className="auth-title">Register New User</h1>
                    <p className="auth-subtitle">Create your account to access the inventory system.</p>
                </div>

                <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            name="fullName"
                            type="text"
                            className="form-input"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            name="username"
                            type="text"
                            className="form-input"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && (
                        <div className="alert-card error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <FormErrors errors={validationErrors} />

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        style={{ marginTop: '1.5rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-center" style={{ marginTop: '2.5rem', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                    <Link href="/login" className="link-primary">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}
