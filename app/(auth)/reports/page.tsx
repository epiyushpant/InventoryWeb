'use client';

import { useState } from 'react';
import { reportsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { toNepaliDateString } from '@/lib/nepali-date';

const reportList = [
    { id: 'stock-summary',    name: 'Stock Summary by Warehouse',  icon: '📊', description: 'Overview of current stock levels across all locations.', color: '#6366f1' },
    { id: 'low-stock',        name: 'Low Stock / Reorder Report',   icon: '⚠️', description: 'Products that have fallen below their reorder levels.',    color: '#f59e0b' },
    { id: 'purchase-history', name: 'Purchase History (GRNs)',      icon: '📥', description: 'All received goods from purchase orders.',                  color: '#10b981' },
    { id: 'sales-history',    name: 'Sales & Invoice History',      icon: '📤', description: 'All sales invoices and their payment statuses.',            color: '#3b82f6' },
    { id: 'stock-ledger',     name: 'Stock Movement Ledger',        icon: '📜', description: 'Complete audit trail of every inventory change.',           color: '#8b5cf6' },
    { id: 'vat-sales-register', name: 'VAT Sales Register (Anusuchi 8)', icon: '🇳🇵', description: 'Tax compliant sales register for IRD Nepal.', color: '#ef4444' },
    { id: 'vat-purchase-register', name: 'VAT Purchase Register (Anusuchi 7)', icon: '📕', description: 'Tax compliant purchase register for IRD Nepal.', color: '#10b981' },
    { id: 'fiscal-year-stock', name: 'Closing Stock (Fiscal Year)', icon: '📅', description: 'End of year inventory valuation for audit.', color: '#3b82f6' },
];

const columnMap: Record<string, Column<any>[]> = {
    'stock-summary': [
        { header: 'Product',    render: (i) => i.product    },
        { header: 'SKU',        render: (i) => i.sKU || '—' },
        { header: 'Warehouse',  render: (i) => i.warehouse  },
        { header: 'City',       render: (i) => i.city || '—'},
        { header: 'On Hand',    render: (i) => <strong>{i.quantity}</strong> },
        { header: 'Available',  render: (i) => (
            <span style={{ fontWeight: 700, color: i.available > 0 ? 'var(--secondary)' : 'var(--error)' }}>{i.available}</span>
        )},
    ],
    'low-stock': [
        { header: 'Product',       render: (i) => i.product      },
        { header: 'SKU',           render: (i) => i.sKU || '—'  },
        { header: 'Warehouse',     render: (i) => i.warehouse    },
        { header: 'Current Stock', render: (i) => <span style={{ color: 'var(--error)', fontWeight: 700 }}>{i.available}</span> },
        { header: 'Reorder Level', render: (i) => i.reorderLevel },
        { header: 'Status',        render: (i) => i.status       },
    ],
    'sales-history': [
        { header: 'Invoice #',  render: (i) => i.invoiceID  },
        { header: 'Date (BS)',  render: (i) => toNepaliDateString(i.date) },
        { header: 'Sale Ref',   render: (i) => i.saleRef    },
        { header: 'Customer',   render: (i) => i.customer   },
        { header: 'Tax (Rs)',   render: (i) => Number(i.tax).toFixed(2)   },
        { header: 'Total (Rs)', render: (i) => <strong>Rs. {Number(i.total).toFixed(2)}</strong> },
        { header: 'Status',     render: (i) => (
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                background: i.status === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color:      i.status === 'Paid' ? '#10b981'               : '#ef4444'
            }}>{i.status}</span>
        )},
    ],
    'purchase-history': [
        { header: 'GRN ID',    render: (i) => i.gRNID    },
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date) },
        { header: 'PO Ref',    render: (i) => i.pORef    },
        { header: 'Supplier',  render: (i) => i.supplier  },
        { header: 'Product',   render: (i) => i.product   },
        { header: 'Received',  render: (i) => i.qty       },
        { header: 'Damaged',   render: (i) => i.damaged > 0 ? <span style={{ color: 'var(--error)' }}>{i.damaged}</span> : '0' },
        { header: 'Warehouse', render: (i) => i.warehouse },
    ],
    'stock-ledger': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date) },
        { header: 'Product',   render: (i) => i.product  },
        { header: 'Type',      render: (i) => (
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                background: i.type?.includes('In') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color:      i.type?.includes('In') ? '#10b981'              : '#ef4444'
            }}>{i.type}</span>
        )},
        { header: 'Change',    render: (i) => <strong style={{ color: i.change?.startsWith('+') ? '#10b981' : '#ef4444' }}>{i.change}</strong> },
        { header: 'Reference', render: (i) => <code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{i.ref}</code> },
    ],
    'vat-sales-register': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date) },
        { header: 'Invoice #', render: (i) => i.invoiceNo },
        { header: 'Customer',  render: (i) => i.customerName },
        { header: 'PAN',       render: (i) => i.pan },
        { header: 'Taxable',   render: (i) => Number(i.taxableAmount).toFixed(2) },
        { header: 'Non-Tax',   render: (i) => Number(i.nonTaxableAmount).toFixed(2) },
        { header: 'VAT (13%)', render: (i) => Number(i.vat).toFixed(2) },
        { header: 'Total',     render: (i) => <strong>Rs. {Number(i.total).toFixed(2)}</strong> },
    ],
    'vat-purchase-register': [
        { header: 'Date (BS)', render: (i) => toNepaliDateString(i.date) },
        { header: 'Ref #',     render: (i) => i.referenceNo },
        { header: 'Supplier',  render: (i) => i.supplierName },
        { header: 'PAN',       render: (i) => i.pan },
        { header: 'Taxable',   render: (i) => Number(i.taxableAmount).toFixed(2) },
        { header: 'VAT (13%)', render: (i) => Number(i.vat).toFixed(2) },
        { header: 'Total',     render: (i) => <strong>Rs. {Number(i.total).toFixed(2)}</strong> },
    ],
    'fiscal-year-stock': [
        { header: 'SKU',           render: (i) => i.code || '—' },
        { header: 'Product Name',  render: (i) => i.name },
        { header: 'Unit',          render: (i) => i.unit },
        { header: 'Closing Qty',   render: (i) => <strong>{i.closingStock}</strong> },
        { header: 'Rate (Cost)',   render: (i) => Number(i.rate).toFixed(2) },
        { header: 'Total Value',   render: (i) => <strong style={{ color: 'var(--secondary)' }}>Rs. {Number(i.totalValue).toFixed(2)}</strong> },
    ],
};

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (reportId: string) => {
        setSelectedReport(reportId);
        setReportData([]);
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

    const reportMeta = reportList.find(r => r.id === selectedReport);

    return (
        <div style={{ padding: '2rem 0' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.03em' }}>System Reports</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    Generate live analytics from your inventory data.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {reportList.map((report) => (
                    <div
                        key={report.id}
                        className="glass"
                        onClick={() => handleGenerate(report.id)}
                        style={{
                            padding: '2rem',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.borderColor = report.color;
                            e.currentTarget.style.boxShadow = `0 16px 32px -8px ${report.color}33`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ fontSize: '2.5rem' }}>{report.icon}</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>{report.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>{report.description}</p>
                        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: report.color, fontWeight: 700, fontSize: '0.875rem' }}>
                            Generate Report →
                        </div>
                    </div>
                ))}
            </div>

            {/* Report Viewer Modal */}
            {selectedReport && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(2,6,23,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(16px)', padding: '2rem'
                }}>
                    <div className="glass" style={{
                        width: '100%', maxWidth: '1300px', maxHeight: '90vh',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.75rem 2.5rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.06)'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '2rem' }}>{reportMeta?.icon}</span>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{reportMeta?.name}</h2>
                                </div>
                                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 2.75rem', fontSize: '0.9rem' }}>
                                    Generated at {new Date().toLocaleString()} — {loading ? 'Loading...' : `${reportData.length} records`}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => window.print()}
                                    style={{ background: 'var(--primary)', border: 'none', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                                >
                                    🖨️ Print
                                </button>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
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
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
