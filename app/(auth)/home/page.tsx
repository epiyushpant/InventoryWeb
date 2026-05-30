'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';

export default function HomePage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reordering, setReordering] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await dashboardApi.getStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard metrics');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReorders = async () => {
        if (!confirm('This will automatically create Draft Purchase Orders for all products below reorder levels. Proceed?')) return;
        try {
            setReordering(true);
            const result = await dashboardApi.generateReorders();
            alert(result.message);
            await loadStats();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setReordering(false);
        }
    };

    if (loading && !stats) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Intelligence...</div>;

    // Simple SVG Line Chart Generator
    const renderSalesChart = () => {
        if (!stats?.salesHistory) return null;
        const data = stats.salesHistory;
        const max = Math.max(...data.map((d: any) => d.count), 5);
        const width = 400;
        const height = 120;
        const points = data.map((d: any, i: number) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (d.count / max) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`M 0,${height} L ${points} L ${width},${height} Z`} fill="url(#chartGradient)" />
                <polyline
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }}
                />
                {data.map((d: any, i: number) => (
                    <circle key={i} cx={(i / (data.length - 1)) * width} cy={height - (d.count / max) * height} r="4" fill="var(--bg-dark)" stroke="var(--primary)" strokeWidth="2" />
                ))}
            </svg>
        );
    };

    return (
        <div className="animate-fade" style={{ paddingTop: '1rem' }}>
            <header style={{ marginBottom: '3.5rem', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 className="auth-title" style={{ fontSize: '3.5rem', margin: 0 }}>Strategic Overview</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                        Real-time intelligence for ABC Company's inventory ecosystem.
                    </p>
                </div>
                {stats?.lowStockCount > 0 && (
                    <button 
                        onClick={handleGenerateReorders}
                        disabled={reordering}
                        className="btn btn-primary" 
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}
                    >
                        {reordering ? 'Generating...' : `🚀 Auto-Reorder (${stats.lowStockCount} Items)`}
                    </button>
                )}
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem',
                padding: '0 1rem'
            }}>
                <div className="glass glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Revenue</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '1rem 0' }}>
                        <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>Rs. {stats?.totalRevenue?.toLocaleString() || '0'}</p>
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Weekly Sales Velocity</p>
                        {renderSalesChart()}
                    </div>
                </div>

                <div className="glass glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Udharo (Credit) Tracker</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '1rem 0' }}>
                        <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>Rs. {stats?.totalOutstanding?.toLocaleString() || '0'}</p>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Total money owed by customers to your business.</p>
                </div>


                <div className="glass glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inventory Health</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '1rem 0' }}>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, color: stats?.lowStockCount > 0 ? '#f59e0b' : 'var(--secondary)', margin: 0 }}>{stats?.totalProducts || 0}</p>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1rem' }}>Active SKUs</span>
                    </div>
                    <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.max(10, 100 - (stats?.lowStockCount || 0))}%`, background: stats?.lowStockCount > 0 ? '#f59e0b' : 'var(--secondary)', boxShadow: `0 0 10px ${stats?.lowStockCount > 0 ? '#f59e0b' : 'var(--secondary)'}` }}></div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
                        {stats?.outOfStockCount > 0 && <span style={{ color: '#ef4444', display: 'block' }}>🚨 {stats.outOfStockCount} items are Out of Stock!</span>}
                        {stats?.lowStockCount > 0 
                            ? `${stats.lowStockCount} items have reached reorder levels.` 
                            : 'All other stock levels are within optimal range.'}
                    </p>
                </div>


                <div className="glass glass-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sales Performance</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '1rem 0' }}>
                        <p style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{stats?.totalSales || 0}</p>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1rem' }}>Transactions</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', height: '40px', alignItems: 'end' }}>
                        {(stats?.salesHistory || []).map((d: any, i: number) => (
                            <div key={i} style={{ flex: 1, background: 'var(--primary)', opacity: 0.3 + (i * 0.1), height: `${Math.max(20, (d.count / Math.max(...stats.salesHistory.map((x:any)=>x.count), 1)) * 100)}%`, borderRadius: '2px' }}></div>
                        ))}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Transaction volume is steady across all regions.</p>
                </div>

                <div className="glass glass-card" style={{ gridColumn: 'span 1' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔥 Top Selling Items</p>
                    <div style={{ marginTop: '1rem' }}>
                        {(stats?.topProducts || []).map((p: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{p.name}</p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--secondary)', margin: 0 }}>{p.totalSold}</p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sold</span>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topProducts || stats.topProducts.length === 0) && <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>No sales data yet.</p>}
                    </div>
                </div>
            </div>


            <div className="glass" style={{ borderRadius: '32px', overflow: 'hidden', margin: '0 1rem', padding: '1rem' }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Recent Activity</h3>
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={loadStats}>Refresh Data</button>
                </div>
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Transaction</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(stats?.recentSales || []).map((item: any) => (
                            <tr key={item.saleID}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.status === 'Completed' ? 'var(--secondary)' : '#f59e0b' }}></div>
                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Sale #{item.saleID}</span>
                                    </div>
                                </td>
                                <td><span style={{ color: 'var(--text-muted)' }}>{item.customerName}</span></td>
                                <td><span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(item.saleDate).toLocaleDateString()}</span></td>
                                <td style={{ textAlign: 'right' }}>
                                    <span className="badge" style={{
                                        background: item.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: item.status === 'Completed' ? 'var(--secondary)' : '#f59e0b',
                                        borderColor: item.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {(!stats?.recentSales || stats.recentSales.length === 0) && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No recent transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
