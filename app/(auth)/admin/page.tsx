'use client';

export default function AdminPage() {
    return (
        <div className="animate-fade" style={{ paddingTop: '1rem' }}>
            <header style={{ marginBottom: '3.5rem', padding: '0 1rem' }}>
                <h1 className="auth-title" style={{ fontSize: '3.5rem', margin: 0 }}>Command Center</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                    System governance and high-level administrative configurations.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '3rem', padding: '0 1rem' }}>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>Core Modules</h4>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn btn-primary" style={{ justifyContent: 'flex-start', background: 'var(--primary)', padding: '0.8rem 1.25rem', width: '100%' }}>User Sovereignty</button>
                            {[
                                'Log Aggregation',
                                'Automation Rules',
                                'API Gateway',
                                'Security Shield'
                            ].map(item => (
                                <button key={item} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.8rem 1.25rem', width: '100%', border: 'none' }}>{item}</button>
                            ))}
                        </nav>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>System Status</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>Version</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>2.4.0-Stable</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            <span>Database</span>
                            <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Optimized</span>
                        </div>
                    </div>
                </aside>

                <section className="glass" style={{ padding: '3rem', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', margin: 0 }}>Operator Management</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>Maintain personnel access and security clearances.</p>
                        </div>
                        <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>+ Provision New Operator</button>
                    </div>

                    {[
                        { name: 'Dr. Sarah Chen', email: 's.chen@antigravity.io', role: 'System Architect', status: 'Active', pulse: 'var(--secondary)' },
                        { name: 'Marcus Thorne', email: 'm.thorne@antigravity.io', role: 'Logistics Lead', status: 'Active', pulse: 'var(--secondary)' },
                        { name: 'Elena Rodriguez', email: 'e.rodriguez@antigravity.io', role: 'Security Analyst', status: 'On Leave', pulse: 'var(--text-muted)' },
                    ].map((user, idx) => (
                        <div key={idx} className="animate-fade" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '20px',
                            marginBottom: '1.25rem',
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
                                    {user.name[0]}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{user.name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{user.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{user.role}</p>
                                    <span style={{
                                        color: user.pulse,
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        gap: '0.4rem',
                                        marginTop: '0.2rem',
                                        fontWeight: 600
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            background: user.pulse,
                                            borderRadius: '50%',
                                            boxShadow: `0 0 6px ${user.pulse}`
                                        }}></span>
                                        {user.status}
                                    </span>
                                </div>
                                <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '10px', width: '40px', height: '40px' }}>•••</button>
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700 }}>Advanced Protection Active</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Multi-factor authentication is enforced across all administrative nodes.</p>
                            </div>
                        </div>
                        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', color: 'var(--error)' }}>Audit Settings</button>
                    </div>
                </section>
            </div>
        </div>
    );
}
