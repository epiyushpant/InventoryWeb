'use client';

import { useState } from 'react';
import { reportsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { toNepaliDateString } from '@/lib/nepali-date';

interface ReportItem {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    category: 'inventory' | 'sales' | 'fiscal';
}

const reportList: ReportItem[] = [
    { id: 'stock-summary', name: 'Stock Summary by Warehouse', icon: '📊', description: 'Overview of current stock levels across all warehouse locations.', color: '#6366f1', category: 'inventory' },
    { id: 'low-stock', name: 'Low Stock / Reorder Alert', icon: '⚠️', description: 'Products that have fallen below their reorder threshold levels.', color: '#f59e0b', category: 'inventory' },
    { id: 'stock-ledger', name: 'Stock Movement Ledger', icon: '📜', description: 'Full audit trail of every inventory adjustment, transfer, and shipment.', color: '#8b5cf6', category: 'inventory' },
    { id: 'purchase-history', name: 'Purchase History (GRNs)', icon: '📥', description: 'All received goods from purchase orders with supplier details.', color: '#10b981', category: 'sales' },
    { id: 'sales-history', name: 'Sales & Invoice History', icon: '📤', description: 'Complete sales invoices with customer and payment status tracking.', color: '#3b82f6', category: 'sales' },
    { id: 'vat-sales-register', name: 'VAT Sales Register (Anusuchi 8)', icon: '🇳🇵', description: 'IRD Nepal tax-compliant sales register for VAT filing.', color: '#ef4444', category: 'sales' },
    { id: 'vat-purchase-register', name: 'VAT Purchase Register (Anusuchi 7)', icon: '📕', description: 'IRD Nepal tax-compliant purchase register for VAT filing.', color: '#059669', category: 'sales' },
    { id: 'fiscal-year-stock', name: 'Closing Stock (Fiscal Year)', icon: '📅', description: 'End of fiscal year inventory valuation summary for audit and filing.', color: '#0ea5e9', category: 'fiscal' },
];

const columnMap: Record<string, (Column<any> & { getValue?: (item: any) => any })[]> = {
    'stock-summary': [
        { header: 'Product', render: (i) => <span style={{ fontWeight: 600 }}>{i.product}</span>, getValue: (i) => i.product },
        { header: 'SKU', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(79,70,229,0.06)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{i.sKU || '—'}</code>, getValue: (i) => i.sKU || '' },
        { header: 'Warehouse', render: (i) => i.warehouse, getValue: (i) => i.warehouse },
        { header: 'City', render: (i) => i.city || '—', getValue: (i) => i.city || '' },
        { header: 'On Hand', render: (i) => <strong>{i.quantity}</strong>, getValue: (i) => i.quantity },
        {
            header: 'Available', render: (i) => (
                <span style={{
                    fontWeight: 700,
                    color: i.available > 0 ? 'var(--secondary)' : 'var(--error)',
                    background: i.available > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                }}>{i.available}</span>
            ), getValue: (i) => i.available
        },
    ],
    'low-stock': [
        { header: 'Product', render: (i) => <span style={{ fontWeight: 600 }}>{i.product}</span>, getValue: (i) => i.product },
        { header: 'SKU', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(79,70,229,0.06)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{i.sKU || '—'}</code>, getValue: (i) => i.sKU || '' },
        { header: 'Warehouse', render: (i) => i.warehouse, getValue: (i) => i.warehouse },
        { header: 'Current Stock', render: (i) => <span style={{ color: 'var(--error)', fontWeight: 700, background: 'rgba(239,68,68,0.08)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>{i.available}</span>, getValue: (i) => i.available },
        { header: 'Reorder Level', render: (i) => <span style={{ fontWeight: 600 }}>{i.reorderLevel}</span>, getValue: (i) => i.reorderLevel },
        {
            header: 'Status', render: (i) => (
                <span style={{
                    padding: '0.25rem 0.7rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    background: i.status === 'Critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: i.status === 'Critical' ? '#ef4444' : '#f59e0b',
                    border: `1px solid ${i.status === 'Critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`
                }}>{i.status}</span>
            ), getValue: (i) => i.status
        },
    ],
    'sales-history': [
        { header: 'Invoice #', render: (i) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>#{i.invoiceID}</span>, getValue: (i) => i.invoiceID },
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date) },
        { header: 'Sale Ref', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.saleRef}</code>, getValue: (i) => i.saleRef || '' },
        { header: 'Customer', render: (i) => i.customer, getValue: (i) => i.customer },
        { header: 'Tax (Rs)', render: (i) => <span style={{ color: 'var(--text-muted)' }}>Rs. {Number(i.tax).toFixed(2)}</span>, getValue: (i) => i.tax },
        { header: 'Total (Rs)', render: (i) => <strong style={{ color: 'var(--secondary)' }}>Rs. {Number(i.total).toFixed(2)}</strong>, getValue: (i) => i.total },
        {
            header: 'Status', render: (i) => (
                <span style={{
                    padding: '0.25rem 0.7rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    background: i.status === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: i.status === 'Paid' ? '#10b981' : '#ef4444',
                    border: `1px solid ${i.status === 'Paid' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>{i.status}</span>
            ), getValue: (i) => i.status
        },
    ],
    'purchase-history': [
        { header: 'GRN ID', render: (i) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>#{i.gRNID}</span>, getValue: (i) => i.gRNID },
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date) },
        { header: 'PO Ref', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.pORef}</code>, getValue: (i) => i.pORef || '' },
        { header: 'Supplier', render: (i) => <span style={{ fontWeight: 600 }}>{i.supplier}</span>, getValue: (i) => i.supplier },
        { header: 'Product', render: (i) => i.product, getValue: (i) => i.product },
        { header: 'Received', render: (i) => <strong style={{ color: 'var(--secondary)' }}>{i.qty}</strong>, getValue: (i) => i.qty },
        { header: 'Damaged', render: (i) => i.damaged > 0 ? <span style={{ color: 'var(--error)', fontWeight: 700, background: 'rgba(239,68,68,0.08)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{i.damaged}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span>, getValue: (i) => i.damaged },
        { header: 'Warehouse', render: (i) => i.warehouse, getValue: (i) => i.warehouse },
    ],
    'stock-ledger': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date) },
        { header: 'Product', render: (i) => <span style={{ fontWeight: 600 }}>{i.product}</span>, getValue: (i) => i.product },
        {
            header: 'Type', render: (i) => (
                <span style={{
                    padding: '0.25rem 0.7rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                    background: i.type?.includes('In') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: i.type?.includes('In') ? '#10b981' : '#ef4444',
                    border: `1px solid ${i.type?.includes('In') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>{i.type}</span>
            ), getValue: (i) => i.type
        },
        { header: 'Change', render: (i) => <strong style={{ color: i.change?.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '1rem' }}>{i.change}</strong>, getValue: (i) => i.change },
        { header: 'Reference', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(79,70,229,0.06)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{i.ref}</code>, getValue: (i) => i.ref || '' },
    ],
    'vat-sales-register': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date) },
        { header: 'Invoice #', render: (i) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>#{i.invoiceNo}</span>, getValue: (i) => i.invoiceNo },
        { header: 'Customer', render: (i) => <span style={{ fontWeight: 600 }}>{i.customerName}</span>, getValue: (i) => i.customerName },
        { header: 'PAN', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.pan}</code>, getValue: (i) => i.pan || '' },
        { header: 'Taxable', render: (i) => <span>Rs. {Number(i.taxableAmount).toFixed(2)}</span>, getValue: (i) => i.taxableAmount },
        { header: 'Non-Tax', render: (i) => <span style={{ color: 'var(--text-muted)' }}>Rs. {Number(i.nonTaxableAmount).toFixed(2)}</span>, getValue: (i) => i.nonTaxableAmount },
        { header: 'VAT (13%)', render: (i) => <span style={{ fontWeight: 600, color: '#ef4444' }}>Rs. {Number(i.vat).toFixed(2)}</span>, getValue: (i) => i.vat },
        { header: 'Total', render: (i) => <strong style={{ color: 'var(--secondary)' }}>Rs. {Number(i.total).toFixed(2)}</strong>, getValue: (i) => i.total },
    ],
    'vat-purchase-register': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date) },
        { header: 'Ref #', render: (i) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>#{i.referenceNo}</span>, getValue: (i) => i.referenceNo },
        { header: 'Supplier', render: (i) => <span style={{ fontWeight: 600 }}>{i.supplierName}</span>, getValue: (i) => i.supplierName },
        { header: 'PAN', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.pan}</code>, getValue: (i) => i.pan || '' },
        { header: 'Taxable', render: (i) => <span>Rs. {Number(i.taxableAmount).toFixed(2)}</span>, getValue: (i) => i.taxableAmount },
        { header: 'VAT (13%)', render: (i) => <span style={{ fontWeight: 600, color: '#ef4444' }}>Rs. {Number(i.vat).toFixed(2)}</span>, getValue: (i) => i.vat },
        { header: 'Total', render: (i) => <strong style={{ color: 'var(--secondary)' }}>Rs. {Number(i.total).toFixed(2)}</strong>, getValue: (i) => i.total },
    ],
    'fiscal-year-stock': [
        { header: 'SKU', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(79,70,229,0.06)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{i.code || '—'}</code>, getValue: (i) => i.code || '' },
        { header: 'Product Name', render: (i) => <span style={{ fontWeight: 600 }}>{i.name}</span>, getValue: (i) => i.name },
        { header: 'Unit', render: (i) => i.unit, getValue: (i) => i.unit },
        { header: 'Closing Qty', render: (i) => <strong>{i.closingStock}</strong>, getValue: (i) => i.closingStock },
        { header: 'Rate (Cost)', render: (i) => <span>Rs. {Number(i.rate).toFixed(2)}</span>, getValue: (i) => i.rate },
        { header: 'Total Value', render: (i) => <strong style={{ color: 'var(--secondary)' }}>Rs. {Number(i.totalValue).toFixed(2)}</strong>, getValue: (i) => i.totalValue },
    ],
};

const categories = [
    {
        key: 'inventory',
        title: 'Inventory & Stock Reports',
        subtitle: 'Monitor warehouse levels, stock movements, and reorder alerts.',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
        ),
    },
    {
        key: 'sales',
        title: 'Sales, Purchases & Tax Reports',
        subtitle: 'Track revenue, procurement, and IRD Nepal VAT registers.',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        key: 'fiscal',
        title: 'Fiscal Year & Audit Reports',
        subtitle: 'Year-end closing stock valuations for compliance and auditing.',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
];

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any[]>([]);
    const [filteredReportData, setFilteredReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (reportId: string) => {
        setSelectedReport(reportId);
        setReportData([]);
        setFilteredReportData([]);
        setLoading(true);
        setError('');
        try {
            const data = await reportsApi.getReport(reportId as any);
            setReportData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const dataToExport = filteredReportData.length > 0 ? filteredReportData : reportData;
        if (!selectedReport || dataToExport.length === 0) return;
        const columns = columnMap[selectedReport] || [];
        const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');

        const rows = dataToExport.map(item => {
            return columns.map(col => {
                let val = '';
                if (col.getValue) {
                    val = String(col.getValue(item));
                } else {
                    val = item[col.header.toLowerCase()] || '';
                }
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = "\uFEFF" + [headers, ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reportMeta = reportList.find(r => r.id === selectedReport);

    if (selectedReport) {
        return (
            <div className="animate-fade print-report-container" style={{ padding: '0.5rem 0' }}>
                {/* Report Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: `${reportMeta?.color}10`,
                            border: `1px solid ${reportMeta?.color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem',
                        }}>
                            {reportMeta?.icon}
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: '2rem', fontWeight: 800, margin: 0,
                                color: 'var(--text-main)', fontFamily: 'var(--font-outfit)',
                            }}>{reportMeta?.name}</h1>
                            <p style={{ color: 'var(--text-muted)', margin: '0.15rem 0 0', fontSize: '0.95rem' }}>
                                Generated at {new Date().toLocaleString()} — {loading ? 'Loading...' : `${filteredReportData.length} records found`}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={handleExportCSV}
                            className="btn btn-secondary btn-small"
                            style={{ gap: '0.4rem', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                            disabled={loading || reportData.length === 0}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export CSV
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="btn btn-primary btn-small"
                            style={{ gap: '0.4rem' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Print
                        </button>
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="btn btn-secondary btn-small"
                        >
                            ← Back to Reports
                        </button>
                    </div>
                </div>

                {/* Print-only Header (simple title and metadata, visible only when printing) */}
                <div className="print-only" style={{ display: 'none', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{reportMeta?.name}</h1>
                    <p style={{ color: '#555', margin: 0, fontSize: '1rem' }}>
                        Generated at {new Date().toLocaleString()} — {filteredReportData.length} records found
                    </p>
                    <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: '1.5rem 0' }} />
                </div>

                {/* Table Content */}
                <div>
                    <LookupTable<any>
                        title=""
                        subtitle=""
                        columns={columnMap[selectedReport] || []}
                        data={reportData}
                        keyField="id"
                        loading={loading}
                        error={error}
                        emptyTitle="No Data Found"
                        emptyText="This report has no records for the current period."
                        loadingText="Generating report..."
                        hideActions={true}
                        searchable={true}
                        searchPlaceholder="Search report results..."
                        onFilteredDataChange={setFilteredReportData}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade" style={{ padding: '0.5rem 0' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    margin: 0,
                    letterSpacing: '-0.03em',
                    fontFamily: 'var(--font-outfit)',
                    background: 'linear-gradient(135deg, var(--text-main), var(--primary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>
                    Reports & Analytics
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.5rem', maxWidth: '600px' }}>
                    Generate live analytics from your inventory, sales, and tax data. Click any report card to view detailed records.
                </p>
            </div>

            {/* Quick Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem',
            }}>
                {[
                    { label: 'Total Reports', value: reportList.length, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
                    { label: 'Inventory', value: reportList.filter(r => r.category === 'inventory').length, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                    { label: 'Sales & Tax', value: reportList.filter(r => r.category === 'sales').length, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
                    { label: 'Fiscal / Audit', value: reportList.filter(r => r.category === 'fiscal').length, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
                ].map((stat, idx) => (
                    <div key={idx} style={{
                        background: stat.bg,
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        border: `1px solid ${stat.color}15`,
                    }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: stat.color }}>{stat.label}</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'var(--font-outfit)' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Categorized Report Sections */}
            {categories.map((cat) => {
                const items = reportList.filter(r => r.category === cat.key);
                if (items.length === 0) return null;

                return (
                    <div key={cat.key} style={{ marginBottom: '3rem' }}>
                        {/* Section Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: 'rgba(79,70,229,0.08)',
                                border: '1px solid rgba(79,70,229,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--primary)',
                            }}>
                                {cat.icon}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-outfit)' }}>{cat.title}</h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cat.subtitle}</p>
                            </div>
                        </div>

                        {/* Report Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                            {items.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => handleGenerate(report.id)}
                                    style={{
                                        background: 'rgba(255,255,255,0.7)',
                                        backdropFilter: 'blur(12px)',
                                        borderRadius: '18px',
                                        padding: '1.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        borderLeft: `4px solid ${report.color}`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = `0 20px 40px -12px ${report.color}20`;
                                        e.currentTarget.style.borderColor = `${report.color}40`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                                        e.currentTarget.style.borderLeftColor = report.color;
                                    }}
                                >
                                    {/* Decorative gradient blob */}
                                    <div style={{
                                        position: 'absolute', top: '-20px', right: '-20px',
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: `${report.color}08`,
                                        pointerEvents: 'none',
                                    }} />

                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        {/* Icon Badge */}
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '14px',
                                            background: `${report.color}10`,
                                            border: `1px solid ${report.color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            flexShrink: 0,
                                        }}>
                                            {report.icon}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                fontSize: '1rem', fontWeight: 700,
                                                color: 'var(--text-main)', margin: 0,
                                                fontFamily: 'var(--font-outfit)',
                                            }}>{report.name}</h3>
                                            <p style={{
                                                color: 'var(--text-muted)', fontSize: '0.85rem',
                                                lineHeight: 1.5, margin: '0.4rem 0 0',
                                            }}>{report.description}</p>
                                        </div>
                                    </div>

                                    {/* Generate button area */}
                                    <div style={{
                                        marginTop: '1rem', paddingTop: '0.75rem',
                                        borderTop: '1px solid rgba(0,0,0,0.04)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: report.color, letterSpacing: '0.02em' }}>
                                            Generate Report
                                        </span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={report.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
