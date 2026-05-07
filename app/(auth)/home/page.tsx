'use client';

export default function HomePage() {
    return (
        <div className="animate-fade" style={{ paddingTop: '1rem' }}>
            <header style={{ marginBottom: '3.5rem', padding: '0 1rem' }}>
                <h1 className="auth-title" style={{ fontSize: '3.5rem', margin: 0 }}>Strategic Overview</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                    Real-time metrics for your global inventory ecosystem.
                </p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem',
                padding: '0 1rem'
            }}>
                <div className="glass glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global Asset Count</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '1rem 0' }}>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>12,842</p>
                        <span style={{ color: 'var(--secondary)', fontWeight: 700, fontSize: '1rem' }}>+12.4%</span>
                    </div>
                    <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '70%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Optimization target reached in North Region.</p>
                </div>

                <div className="glass glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>In-Flight Logistics</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '1rem 0' }}>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, color: '#f59e0b', margin: 0 }}>84</p>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1rem' }}>Active Orders</span>
                    </div>
                    <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '45%', background: '#f59e0b', boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)' }}></div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>3 high-priority shipments pending customs.</p>
                </div>

                <div className="glass glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Network Health</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '1rem 0' }}>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--secondary)', margin: 0 }}>99.8<span style={{ fontSize: '1.5rem' }}>%</span></p>
                    </div>
                    <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '99%', background: 'var(--secondary)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>All warehouse nodes performing within latency limits.</p>
                </div>
            </div>

            <div className="glass" style={{ borderRadius: '32px', overflow: 'hidden', margin: '0 1rem', padding: '1rem' }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Critical Inventory Nodes</h3>
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Export Data</button>
                </div>
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Reference SKU</th>
                            <th>Allocation Status</th>
                            <th style={{ textAlign: 'right' }}>Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { id: 1, name: 'Neural Processing Core X1', sku: 'NPC-900-ULTRA', status: 'Operational', color: 'var(--secondary)' },
                            { id: 2, name: 'Quantum Encryption Module', sku: 'QEM-SEC-04', status: 'Resource Low', color: '#f59e0b' },
                            { id: 3, name: 'Thermal Dissipation Grid', sku: 'TDG-GRID-V2', status: 'Depleted', color: 'var(--error)' },
                            { id: 4, name: 'Optical Sensor Array', sku: 'OSA-ARRAY-L8', status: 'Operational', color: 'var(--secondary)' },
                        ].map(item => (
                            <tr key={item.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.name}</span>
                                    </div>
                                </td>
                                <td><code style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.sku}</code></td>
                                <td>
                                    <span className="badge" style={{
                                        background: `${item.color}15`,
                                        color: item.color,
                                        borderColor: `${item.color}30`
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px' }}>Inspect</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
