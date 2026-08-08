'use client';

import { useMemo, useState } from 'react';
import { reportsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { toNepaliDateString, formatAdBs } from '@/lib/nepali-date';
import { formatNpr } from '@/lib/format';
import { REPORT_CAPABILITY, useCapabilities } from '@/components/CapabilityProvider';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import MoneyCell from '@/components/MoneyCell';

interface ReportItem {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    category: 'inventory' | 'sales' | 'fiscal';
}

type ReportColumn = Column<any> & { getValue?: (item: any) => any };

const reportList: ReportItem[] = [
    { id: 'stock-summary', name: 'Stock Summary by Warehouse', icon: '📊', description: 'Overview of current stock levels across all warehouse locations.', color: '#6366f1', category: 'inventory' },
    { id: 'low-stock', name: 'Low Stock / Reorder Alert', icon: '⚠️', description: 'Products that have fallen below their reorder threshold levels.', color: '#f59e0b', category: 'inventory' },
    { id: 'stock-ledger', name: 'Stock Movement Ledger', icon: '📜', description: 'Full audit trail of every inventory adjustment, transfer, and shipment.', color: '#8b5cf6', category: 'inventory' },
    { id: 'purchase-history', name: 'Purchase History (GRNs)', icon: '📥', description: 'All received goods from purchase orders with supplier details.', color: '#10b981', category: 'sales' },
    { id: 'sales-history', name: 'Sales & Invoice History', icon: '📤', description: 'Complete sales invoices with customer and payment status tracking.', color: '#3b82f6', category: 'sales' },
    { id: 'vat-sales-register', name: 'VAT Sales Register (Anusuchi 8)', icon: '🇳🇵', description: 'IRD Nepal tax-compliant sales register for VAT filing.', color: '#ef4444', category: 'sales' },
    { id: 'vat-purchase-register', name: 'VAT Purchase Register (Anusuchi 7)', icon: '📕', description: 'IRD Nepal tax-compliant purchase register for VAT filing.', color: '#059669', category: 'sales' },
    { id: 'fiscal-year-stock', name: 'Closing Stock (Fiscal Year)', icon: '📅', description: 'End of fiscal year inventory valuation summary for audit and filing.', color: '#0ea5e9', category: 'fiscal' },
    { id: 'expiry-soon', name: 'Expiry Soon / FEFO Watch', icon: '⏳', description: 'Lots expiring within 90 days or already expired — pharmacy/FMCG priority.', color: '#f59e0b', category: 'inventory' },
];

const codeChip = (value: any) => <code className="code-chip">{value || '—'}</code>;
const refChip = (value: any) => <code className="code-chip" style={{ color: 'var(--text-muted)', background: 'rgba(100,116,139,0.08)' }}>{value || '—'}</code>;
const qtyCell = (value: any, tone?: string) => (
    <strong style={{ fontVariantNumeric: 'tabular-nums', color: tone }}>{value ?? 0}</strong>
);

const columnMap: Record<string, ReportColumn[]> = {
    'stock-summary': [
        { header: 'Product', render: (i) => <p className="cell-primary">{i.product}</p>, getValue: (i) => i.product },
        { header: 'SKU', render: (i) => codeChip(i.sKU), getValue: (i) => i.sKU || '' },
        { header: 'Warehouse', render: (i) => i.warehouse, getValue: (i) => i.warehouse },
        { header: 'City', render: (i) => <span className="text-muted-small">{i.city || '—'}</span>, getValue: (i) => i.city || '' },
        { header: 'On Hand', align: 'right', numeric: true, render: (i) => qtyCell(i.quantity), getValue: (i) => i.quantity },
        {
            header: 'Available',
            align: 'right',
            numeric: true,
            render: (i) => (
                <StatusBadge tone={i.available > 0 ? 'success' : 'danger'}>{i.available}</StatusBadge>
            ),
            getValue: (i) => i.available,
        },
    ],
    'low-stock': [
        { header: 'Product', render: (i) => <p className="cell-primary">{i.product}</p>, getValue: (i) => i.product },
        { header: 'SKU', render: (i) => codeChip(i.sKU), getValue: (i) => i.sKU || '' },
        { header: 'Warehouse', render: (i) => i.warehouse, getValue: (i) => i.warehouse },
        {
            header: 'Current Stock',
            align: 'right',
            numeric: true,
            render: (i) => qtyCell(i.available, 'var(--tone-danger)'),
            getValue: (i) => i.available,
        },
        { header: 'Reorder Level', align: 'right', numeric: true, render: (i) => qtyCell(i.reorderLevel), getValue: (i) => i.reorderLevel },
        {
            header: 'Status',
            render: (i) => <StatusBadge tone={i.status === 'Critical' ? 'danger' : 'warning'}>{i.status}</StatusBadge>,
            getValue: (i) => i.status,
        },
    ],
    'sales-history': [
        { header: 'Invoice #', render: (i) => <span className="cell-primary" style={{ color: 'var(--primary)' }}>#{i.invoiceID}</span>, getValue: (i) => i.invoiceID },
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date), sortValue: (i) => i.date },
        { header: 'Sale Ref', render: (i) => refChip(i.saleRef), getValue: (i) => i.saleRef || '' },
        { header: 'Customer', render: (i) => i.customer, getValue: (i) => i.customer },
        { header: 'Tax (Rs)', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.tax} muted />, getValue: (i) => i.tax, sortValue: (i) => i.tax },
        { header: 'Total (Rs)', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.total} strong />, getValue: (i) => i.total, sortValue: (i) => i.total },
        { header: 'Status', render: (i) => <StatusBadge status={i.status}>{i.status}</StatusBadge>, getValue: (i) => i.status },
    ],
    'purchase-history': [
        { header: 'GRN ID', render: (i) => <span className="cell-primary" style={{ color: 'var(--primary)' }}>#{i.gRNID}</span>, getValue: (i) => i.gRNID },
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date), sortValue: (i) => i.date },
        { header: 'PO Ref', render: (i) => refChip(i.pORef), getValue: (i) => i.pORef || '' },
        { header: 'Supplier', render: (i) => <p className="cell-primary">{i.supplier}</p>, getValue: (i) => i.supplier },
        { header: 'Product', render: (i) => i.product, getValue: (i) => i.product },
        { header: 'Received', align: 'right', numeric: true, render: (i) => qtyCell(i.qty, 'var(--tone-success)'), getValue: (i) => i.qty },
        {
            header: 'Damaged',
            align: 'right',
            numeric: true,
            render: (i) => (i.damaged > 0 ? <StatusBadge tone="danger">{i.damaged}</StatusBadge> : <span className="text-muted-small">0</span>),
            getValue: (i) => i.damaged,
        },
        { header: 'Warehouse', render: (i) => i.warehouse, getValue: (i) => i.warehouse },
    ],
    'stock-ledger': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date), sortValue: (i) => i.date },
        { header: 'Product', render: (i) => <p className="cell-primary">{i.product}</p>, getValue: (i) => i.product },
        {
            header: 'Type',
            render: (i) => <StatusBadge tone={i.type?.includes('In') ? 'success' : 'danger'}>{i.type}</StatusBadge>,
            getValue: (i) => i.type,
        },
        {
            header: 'Change',
            align: 'right',
            numeric: true,
            render: (i) => (
                <strong style={{ color: i.change?.startsWith('+') ? 'var(--tone-success)' : 'var(--tone-danger)' }}>{i.change}</strong>
            ),
            getValue: (i) => i.change,
            sortValue: (i) => Number(String(i.change).replace(/[^0-9.\-]/g, '')) || 0,
        },
        { header: 'Reference', render: (i) => codeChip(i.ref), getValue: (i) => i.ref || '' },
    ],
    'vat-sales-register': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date), sortValue: (i) => i.date },
        { header: 'Invoice #', render: (i) => <span className="cell-primary" style={{ color: 'var(--primary)' }}>#{i.invoiceNo}</span>, getValue: (i) => i.invoiceNo },
        { header: 'Customer', render: (i) => <p className="cell-primary">{i.customerName}</p>, getValue: (i) => i.customerName },
        { header: 'PAN', render: (i) => refChip(i.pan), getValue: (i) => i.pan || '' },
        { header: 'Taxable', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.taxableAmount} />, getValue: (i) => i.taxableAmount, sortValue: (i) => i.taxableAmount },
        { header: 'Non-Tax', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.nonTaxableAmount} muted />, getValue: (i) => i.nonTaxableAmount, sortValue: (i) => i.nonTaxableAmount },
        { header: 'VAT (13%)', align: 'right', numeric: true, render: (i) => <span className="money-cell" style={{ color: 'var(--tone-danger)' }}>{formatNpr(i.vat)}</span>, getValue: (i) => i.vat, sortValue: (i) => i.vat },
        { header: 'Total', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.total} strong />, getValue: (i) => i.total, sortValue: (i) => i.total },
    ],
    'vat-purchase-register': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date), getValue: (i) => toNepaliDateString(i.date), sortValue: (i) => i.date },
        { header: 'Ref #', render: (i) => <span className="cell-primary" style={{ color: 'var(--primary)' }}>#{i.referenceNo}</span>, getValue: (i) => i.referenceNo },
        { header: 'Supplier', render: (i) => <p className="cell-primary">{i.supplierName}</p>, getValue: (i) => i.supplierName },
        { header: 'PAN', render: (i) => refChip(i.pan), getValue: (i) => i.pan || '' },
        { header: 'Taxable', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.taxableAmount} />, getValue: (i) => i.taxableAmount, sortValue: (i) => i.taxableAmount },
        { header: 'VAT (13%)', align: 'right', numeric: true, render: (i) => <span className="money-cell" style={{ color: 'var(--tone-danger)' }}>{formatNpr(i.vat)}</span>, getValue: (i) => i.vat, sortValue: (i) => i.vat },
        { header: 'Total', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.total} strong />, getValue: (i) => i.total, sortValue: (i) => i.total },
    ],
    'fiscal-year-stock': [
        { header: 'SKU', render: (i) => codeChip(i.code), getValue: (i) => i.code || '' },
        { header: 'Product Name', render: (i) => <p className="cell-primary">{i.name}</p>, getValue: (i) => i.name },
        { header: 'Unit', render: (i) => <span className="text-muted-small">{i.unit}</span>, getValue: (i) => i.unit },
        { header: 'Closing Qty', align: 'right', numeric: true, render: (i) => qtyCell(i.closingStock), getValue: (i) => i.closingStock },
        { header: 'Rate (Cost)', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.rate} muted />, getValue: (i) => i.rate, sortValue: (i) => i.rate },
        { header: 'Total Value', align: 'right', numeric: true, render: (i) => <MoneyCell amount={i.totalValue} strong />, getValue: (i) => i.totalValue, sortValue: (i) => i.totalValue },
    ],
    'expiry-soon': [
        { header: 'Product', render: (i) => <p className="cell-primary">{i.product}</p>, getValue: (i) => i.product },
        { header: 'SKU', render: (i) => codeChip(i.sKU), getValue: (i) => i.sKU || '' },
        { header: 'Warehouse', render: (i) => i.warehouse, getValue: (i) => i.warehouse },
        { header: 'Qty', align: 'right', numeric: true, render: (i) => qtyCell(i.quantity), getValue: (i) => i.quantity },
        { header: 'Expiry', render: (i) => formatAdBs(i.expiryDate), getValue: (i) => formatAdBs(i.expiryDate), sortValue: (i) => i.expiryDate },
        {
            header: 'Days left',
            align: 'right',
            numeric: true,
            render: (i) => (
                <strong style={{ color: i.daysLeft < 0 ? 'var(--tone-danger)' : i.daysLeft <= 30 ? 'var(--tone-warning)' : 'var(--text-main)' }}>
                    {i.daysLeft}
                </strong>
            ),
            getValue: (i) => i.daysLeft,
            sortValue: (i) => i.daysLeft,
        },
        {
            header: 'Status',
            render: (i) => <StatusBadge tone={i.status === 'Expired' ? 'danger' : 'warning'}>{i.status}</StatusBadge>,
            getValue: (i) => i.status,
        },
    ],
};

type SummaryStat = { label: string; value: string; tone?: string };

const sumBy = (rows: any[], field: string) => rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);

const summaryMap: Record<string, (rows: any[]) => SummaryStat[]> = {
    'stock-summary': (rows) => [
        { label: 'Stock lines', value: String(rows.length) },
        { label: 'Total on hand', value: String(sumBy(rows, 'quantity')) },
        { label: 'Total available', value: String(sumBy(rows, 'available')) },
    ],
    'low-stock': (rows) => [
        { label: 'Items below level', value: String(rows.length), tone: 'var(--tone-warning)' },
        { label: 'Critical', value: String(rows.filter((r) => r.status === 'Critical').length), tone: 'var(--tone-danger)' },
    ],
    'stock-ledger': (rows) => [
        { label: 'Movements', value: String(rows.length) },
        { label: 'Inward', value: String(rows.filter((r) => String(r.type).includes('In')).length), tone: 'var(--tone-success)' },
        { label: 'Outward', value: String(rows.filter((r) => !String(r.type).includes('In')).length), tone: 'var(--tone-danger)' },
    ],
    'purchase-history': (rows) => [
        { label: 'GRN lines', value: String(rows.length) },
        { label: 'Qty received', value: String(sumBy(rows, 'qty')), tone: 'var(--tone-success)' },
        { label: 'Damaged', value: String(sumBy(rows, 'damaged')), tone: 'var(--tone-danger)' },
    ],
    'sales-history': (rows) => [
        { label: 'Invoices', value: String(rows.length) },
        { label: 'Tax collected', value: formatNpr(sumBy(rows, 'tax')) },
        { label: 'Total value', value: formatNpr(sumBy(rows, 'total')), tone: 'var(--tone-success)' },
    ],
    'vat-sales-register': (rows) => [
        { label: 'Taxable sales', value: formatNpr(sumBy(rows, 'taxableAmount')) },
        { label: 'Output VAT', value: formatNpr(sumBy(rows, 'vat')), tone: 'var(--tone-danger)' },
        { label: 'Grand total', value: formatNpr(sumBy(rows, 'total')), tone: 'var(--tone-success)' },
    ],
    'vat-purchase-register': (rows) => [
        { label: 'Taxable purchases', value: formatNpr(sumBy(rows, 'taxableAmount')) },
        { label: 'Input VAT', value: formatNpr(sumBy(rows, 'vat')), tone: 'var(--tone-info)' },
        { label: 'Grand total', value: formatNpr(sumBy(rows, 'total')) },
    ],
    'fiscal-year-stock': (rows) => [
        { label: 'Products', value: String(rows.length) },
        { label: 'Closing qty', value: String(sumBy(rows, 'closingStock')) },
        { label: 'Closing value', value: formatNpr(sumBy(rows, 'totalValue')), tone: 'var(--tone-success)' },
    ],
    'expiry-soon': (rows) => [
        { label: 'Lots watched', value: String(rows.length) },
        { label: 'Already expired', value: String(rows.filter((r) => r.status === 'Expired').length), tone: 'var(--tone-danger)' },
        { label: 'Within 30 days', value: String(rows.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30).length), tone: 'var(--tone-warning)' },
    ],
};

const categories = [
    {
        key: 'inventory',
        title: 'Inventory & Stock Reports',
        subtitle: 'Monitor warehouse levels, stock movements, and reorder alerts.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    const [generatedAt, setGeneratedAt] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'inventory' | 'sales' | 'fiscal'>('all');
    const [reportSearch, setReportSearch] = useState('');
    const { canUse, loading: capsLoading } = useCapabilities();

    const visibleReports = useMemo(
        () =>
            reportList.filter((r) => {
                if (capsLoading) return true;
                const key = REPORT_CAPABILITY[r.id];
                return !key || canUse(key);
            }),
        [capsLoading, canUse]
    );

    const matchingReports = useMemo(() => {
        const term = reportSearch.trim().toLowerCase();
        return visibleReports.filter((r) => {
            const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
            const matchesTerm = !term || `${r.name} ${r.description}`.toLowerCase().includes(term);
            return matchesCategory && matchesTerm;
        });
    }, [visibleReports, categoryFilter, reportSearch]);

    const handleGenerate = async (reportId: string) => {
        setSelectedReport(reportId);
        setReportData([]);
        setFilteredReportData([]);
        setLoading(true);
        setError('');
        try {
            const data = await reportsApi.getReport(reportId as any);
            setReportData(data);
            setGeneratedAt(new Date().toLocaleString());
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
        const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');

        const rows = dataToExport.map((item) =>
            columns
                .map((col) => {
                    const val = col.getValue ? String(col.getValue(item)) : item[col.header.toLowerCase()] || '';
                    return `"${String(val).replace(/"/g, '""')}"`;
                })
                .join(',')
        );

        const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const reportMeta = reportList.find((r) => r.id === selectedReport);
    const summaryStats =
        selectedReport && summaryMap[selectedReport] && filteredReportData.length > 0
            ? summaryMap[selectedReport](filteredReportData)
            : [];

    if (selectedReport) {
        return (
            <div className="animate-fade print-report-container page-section">
                <div className="detail-hero no-print">
                    <div className="detail-hero__left">
                        <div
                            className="report-card__icon"
                            style={{ ['--report-accent' as string]: reportMeta?.color, width: 48, height: 48 }}
                        >
                            {reportMeta?.icon}
                        </div>
                        <div>
                            <h1 className="auth-title page-heading" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)' }}>
                                {reportMeta?.name}
                            </h1>
                            <p className="page-subtitle" style={{ marginTop: '0.2rem' }}>
                                {loading ? 'Generating…' : `${filteredReportData.length} records`} · generated {generatedAt}
                            </p>
                        </div>
                    </div>
                    <div className="page-actions">
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="btn btn-secondary btn-small"
                        >
                            ← All reports
                        </button>
                        <button
                            onClick={() => handleGenerate(selectedReport)}
                            className="btn btn-secondary btn-small"
                            disabled={loading}
                        >
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="btn btn-secondary btn-small"
                            style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
                            disabled={loading || reportData.length === 0}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export CSV
                        </button>
                        <button onClick={() => window.print()} className="btn btn-primary btn-small">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Print
                        </button>
                    </div>
                </div>

                <div className="print-only" style={{ display: 'none', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>{reportMeta?.name}</h1>
                    <p style={{ color: '#555', margin: 0, fontSize: '0.95rem' }}>
                        Generated {generatedAt} — {filteredReportData.length} records
                    </p>
                    <hr style={{ border: 'none', borderTop: '2px solid #eee', margin: '1rem 0' }} />
                </div>

                {summaryStats.length > 0 && (
                    <div className="stat-grid">
                        {summaryStats.map((stat) => (
                            <div key={stat.label} className="stat-card" style={{ ['--stat-accent' as string]: stat.tone || reportMeta?.color }}>
                                <p className="stat-card__label">{stat.label}</p>
                                <p className="stat-card__value" style={{ color: stat.tone }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

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
                    hideActions
                    searchable
                    searchPlaceholder="Search report results..."
                    onFilteredDataChange={setFilteredReportData}
                    pageSize={0}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade page-section">
            <PageHeader
                title="Reports & Analytics"
                subtitle="Live analytics from inventory, sales, and tax data. Pick a report to view, sort, export, or print detailed records."
                actions={
                    <input
                        type="search"
                        className="search-input"
                        placeholder="Find a report…"
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        aria-label="Search reports"
                    />
                }
            />

            <div className="stat-grid">
                {[
                    { label: 'Available Reports', value: visibleReports.length, tone: 'var(--tone-primary)' },
                    { label: 'Inventory', value: visibleReports.filter((r) => r.category === 'inventory').length, tone: '#8b5cf6' },
                    { label: 'Sales & Tax', value: visibleReports.filter((r) => r.category === 'sales').length, tone: 'var(--tone-info)' },
                    { label: 'Fiscal / Audit', value: visibleReports.filter((r) => r.category === 'fiscal').length, tone: 'var(--tone-success)' },
                ].map((stat) => (
                    <div key={stat.label} className="stat-card" style={{ ['--stat-accent' as string]: stat.tone }}>
                        <p className="stat-card__label">{stat.label}</p>
                        <p className="stat-card__value stat-card__value--accent">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ padding: '0 var(--page-gutter)', marginBottom: '1.5rem' }}>
                <div className="segmented">
                    {[
                        { key: 'all', label: 'All reports' },
                        { key: 'inventory', label: 'Inventory' },
                        { key: 'sales', label: 'Sales & Tax' },
                        { key: 'fiscal', label: 'Fiscal' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`segmented__btn${categoryFilter === tab.key ? ' segmented__btn--active' : ''}`}
                            onClick={() => setCategoryFilter(tab.key as typeof categoryFilter)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {matchingReports.length === 0 && (
                <div className="empty-state">
                    <p className="empty-title">No reports match your filters</p>
                    <p style={{ margin: 0 }}>Try a different search term or category.</p>
                </div>
            )}

            {categories.map((cat) => {
                const items = matchingReports.filter((r) => r.category === cat.key);
                if (items.length === 0) return null;

                return (
                    <div key={cat.key}>
                        <div className="section-heading">
                            <span className="section-heading__icon">{cat.icon}</span>
                            <div>
                                <h2 className="section-heading__title">{cat.title}</h2>
                                <p className="section-heading__subtitle">{cat.subtitle}</p>
                            </div>
                        </div>

                        <div className="report-grid">
                            {items.map((report) => (
                                <button
                                    key={report.id}
                                    type="button"
                                    className="report-card"
                                    style={{ ['--report-accent' as string]: report.color }}
                                    onClick={() => handleGenerate(report.id)}
                                >
                                    <div className="report-card__head">
                                        <span className="report-card__icon">{report.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 className="report-card__name">{report.name}</h3>
                                            <p className="report-card__desc">{report.description}</p>
                                        </div>
                                    </div>
                                    <div className="report-card__cta">
                                        <span>Generate report</span>
                                        <svg className="report-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
