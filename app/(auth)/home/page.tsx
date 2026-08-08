'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { formatNpr } from '@/lib/format';
import { formatAdBs } from '@/lib/nepali-date';
import { useCapabilities } from '@/components/CapabilityProvider';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import Panel from '@/components/Panel';
import Sparkline from '@/components/Sparkline';

const icons = {
    revenue: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    credit: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    ),
    box: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        </svg>
    ),
    clock: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    cart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    ),
    tax: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
    ),
};

const quickActions = [
    { href: '/sales', label: 'New Sale' },
    { href: '/sales-invoices', label: 'Raise Invoice' },
    { href: '/purchase-orders', label: 'Purchase Order' },
    { href: '/grns', label: 'Receive Goods' },
    { href: '/products', label: 'Add Product' },
];

export default function HomePage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reordering, setReordering] = useState(false);
    const { isEnabled } = useCapabilities();
    const showExpiryKpi = isEnabled('feature.dashboardKpis') && isEnabled('feature.expiry');
    const showPaymentsKpi = isEnabled('feature.dashboardKpis') && isEnabled('feature.payments');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await dashboardApi.getStats();
            setStats(data);
            setError('');
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

    const history: { date: string; count: number }[] = stats?.salesHistory ?? [];

    const trend = useMemo(() => {
        if (history.length < 6) return null;
        const recent = history.slice(-3).reduce((sum, d) => sum + d.count, 0);
        const previous = history.slice(-6, -3).reduce((sum, d) => sum + d.count, 0);
        if (previous === 0) return recent > 0 ? { dir: 'up' as const, pct: 100 } : null;
        const pct = Math.round(((recent - previous) / previous) * 100);
        return { dir: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('flat' as const), pct: Math.abs(pct) };
    }, [history]);

    const topProducts: any[] = stats?.topProducts ?? [];
    const topMax = Math.max(...topProducts.map((p) => p.totalSold ?? 0), 1);

    if (loading && !stats) {
        return (
            <div className="animate-fade page-section">
                <PageHeader title="Strategic Overview" subtitle="Loading your shop metrics…" />
                <div className="skeleton-grid">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton-block" />
                    ))}
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="animate-fade page-section">
                <PageHeader title="Strategic Overview" subtitle="Nepal shop KPIs — stock, credit, VAT, and expiry." />
                <div className="glass alert-card error" role="alert">{error}</div>
            </div>
        );
    }

    return (
        <div className="animate-fade page-section">
            <PageHeader
                title="Strategic Overview"
                subtitle="Nepal shop KPIs — stock, credit, VAT, and expiry."
                actions={
                    <>
                        <button onClick={loadStats} className="btn btn-secondary btn-small" disabled={loading}>
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                        {stats?.lowStockCount > 0 && (
                            <button onClick={handleGenerateReorders} disabled={reordering} className="btn btn-primary btn-wide">
                                {reordering ? 'Generating…' : `Auto-Reorder (${stats.lowStockCount})`}
                            </button>
                        )}
                    </>
                }
            />

            <div className="stat-grid">
                <StatCard
                    label="Total Revenue"
                    value={formatNpr(stats?.totalRevenue)}
                    icon={icons.revenue}
                    tone="success"
                    accentValue
                    hint={`${stats?.totalSales || 0} sales transactions recorded.`}
                    footer={
                        trend && (
                            <span className={`trend-chip trend-chip--${trend.dir}`}>
                                {trend.dir === 'up' ? '▲' : trend.dir === 'down' ? '▼' : '■'} {trend.pct}% vs previous 3 days
                            </span>
                        )
                    }
                />

                {showPaymentsKpi && (
                    <StatCard
                        label="Udharo (Receivables)"
                        value={formatNpr(stats?.totalOutstanding)}
                        icon={icons.credit}
                        tone="danger"
                        accentValue
                        hint={`${stats?.dueInvoiceCount || 0} unpaid or partially paid invoices.`}
                        href="/sales-invoices"
                        linkLabel="Manage collections"
                    />
                )}

                <StatCard
                    label="Inventory Health"
                    value={stats?.totalProducts || 0}
                    unit="active SKUs"
                    icon={icons.box}
                    tone={stats?.lowStockCount > 0 ? 'warning' : 'success'}
                    alert={stats?.outOfStockCount > 0 ? `${stats.outOfStockCount} items out of stock` : undefined}
                    hint={
                        stats?.lowStockCount > 0
                            ? `${stats.lowStockCount} items at or below reorder level.`
                            : 'Stock levels look healthy.'
                    }
                    href="/inventories"
                    linkLabel="Review stock"
                />

                {showExpiryKpi && (
                    <StatCard
                        label="Expiry Watch (90 days)"
                        value={stats?.expiringSoonCount || 0}
                        unit="lots"
                        icon={icons.clock}
                        tone={(stats?.expiringSoonCount || 0) > 0 ? 'warning' : 'success'}
                        alert={(stats?.expiredCount || 0) > 0 ? `${stats.expiredCount} already expired on hand` : undefined}
                        hint="Clear near-expiry lots first (FEFO)."
                        href="/reports"
                        linkLabel="Open expiry report"
                    />
                )}

                <StatCard
                    label="Sales Performance"
                    value={stats?.totalSales || 0}
                    unit="transactions"
                    icon={icons.cart}
                    tone="primary"
                    accentValue
                    hint={`Weekly volume: ${history.reduce((sum, d) => sum + d.count, 0)} sales in the last 7 days.`}
                />

                <StatCard
                    label="VAT Position"
                    value={formatNpr(stats?.vatSummary?.netPayable)}
                    icon={icons.tax}
                    tone="info"
                    hint="Estimated net VAT payable to IRD this period."
                    href="/reports"
                    linkLabel="Open VAT registers"
                />
            </div>

            <div className="panel-grid panel-grid--wide-left">
                <Panel
                    title="Sales Velocity"
                    subtitle="Transactions per day over the last 7 days"
                    actions={
                        trend && (
                            <span className={`trend-chip trend-chip--${trend.dir}`}>
                                {trend.dir === 'up' ? '▲' : trend.dir === 'down' ? '▼' : '■'} {trend.pct}%
                            </span>
                        )
                    }
                >
                    <Sparkline
                        values={history.map((d) => d.count)}
                        labels={history.map((d) => d.date)}
                        height={140}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        {history.map((d) => (
                            <span key={d.date} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.date}</span>
                        ))}
                    </div>
                </Panel>

                <Panel title="Top Selling Items" subtitle="Highest quantity sold to date">
                    {topProducts.length === 0 ? (
                        <p className="text-muted-small">No sales data yet.</p>
                    ) : (
                        <div className="rank-list">
                            {topProducts.map((p: any, i: number) => (
                                <div key={`${p.sku}-${i}`} className="rank-row">
                                    <span className="rank-index">{i + 1}</span>
                                    <div className="rank-main">
                                        <p className="rank-name">{p.name}</p>
                                        <p className="rank-meta">{p.sku}</p>
                                        <div className="rank-bar">
                                            <span style={{ width: `${Math.round(((p.totalSold ?? 0) / topMax) * 100)}%` }} />
                                        </div>
                                    </div>
                                    <div className="rank-value">{p.totalSold}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            <div className="panel-grid panel-grid--wide-left">
                <Panel
                    title="Recent Activity"
                    subtitle="Latest sales across the shop"
                    flush
                    actions={<Link href="/sales" className="btn btn-secondary btn-small">View all sales</Link>}
                >
                    <div className="table-card table-responsive">
                        <table className="premium-table premium-table--compact">
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
                                            <Link href="/sales" className="cell-primary" style={{ display: 'block' }}>
                                                Sale #{item.saleID}
                                            </Link>
                                        </td>
                                        <td className="text-muted-small">{item.customerName}</td>
                                        <td className="text-muted-small">{formatAdBs(item.saleDate)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <StatusBadge status={item.status}>{item.status}</StatusBadge>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.recentSales || stats.recentSales.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="empty-state">No recent transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
                    <Panel title="VAT Snapshot" subtitle="Nepal 13% reconciliation estimate">
                        <div className="kv-row">
                            <span className="kv-row__label">Output VAT (sales)</span>
                            <span className="kv-row__value">{formatNpr(stats?.vatSummary?.salesVat)}</span>
                        </div>
                        <div className="kv-row">
                            <span className="kv-row__label">Input VAT (purchases)</span>
                            <span className="kv-row__value">{formatNpr(stats?.vatSummary?.purchaseVat)}</span>
                        </div>
                        <div className="kv-row kv-row--total">
                            <span className="kv-row__label">Net payable</span>
                            <span
                                className="kv-row__value"
                                style={{ color: (stats?.vatSummary?.netPayable ?? 0) > 0 ? 'var(--tone-danger)' : 'var(--tone-success)' }}
                            >
                                {formatNpr(stats?.vatSummary?.netPayable)}
                            </span>
                        </div>
                    </Panel>

                    <Panel title="Quick Actions" subtitle="Jump straight into daily work">
                        <div className="quick-actions">
                            {quickActions.map((action) => (
                                <Link key={action.href} href={action.href} className="quick-action">
                                    {action.label}
                                </Link>
                            ))}
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
