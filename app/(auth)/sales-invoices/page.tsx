'use client';

import { useEffect, useState } from 'react';
import { salesApi, salesInvoicesApi, customersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';
import WorkflowStrip from '@/components/WorkflowStrip';
import StatusBadge from '@/components/StatusBadge';
import MoneyCell from '@/components/MoneyCell';
import { useFieldCapability } from '@/hooks/useFieldCapability';
import { formatAdBs } from '@/lib/nepali-date';
import { formatNpr } from '@/lib/format';

interface SalesInvoice {
    invoiceID: number;
    invoiceNumber?: string;
    saleID: number;
    invoiceDate: string;
    taxAmount: number;
    taxableAmount?: number;
    nonTaxableAmount?: number;
    grandTotal: number;
    status: string;
}

export default function SalesInvoicesPage() {
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { showField } = useFieldCapability();
    const showPaymentStatus = showField('field.invoice.paymentStatus');
    const [showModal, setShowModal] = useState(false);
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();
    const [currentInvoice, setCurrentInvoice] = useState<Partial<SalesInvoice>>({
        saleID: 0,
        status: 'Due',
        invoiceDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [salesData, invoicesData, customersData] = await Promise.all([
                salesApi.getAll(),
                salesInvoicesApi.getAll(),
                customersApi.getAll()
            ]);
            setSales(salesData || []);
            setInvoices(invoicesData || []);
            setCustomers(customersData || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!currentInvoice.saleID || currentInvoice.saleID === 0) {
            alert('Please select a sales order first.');
            return;
        }
        setLoading(true);
        try {
            // Server computes VAT split, PAN check, and FY invoice number
            const created = await salesInvoicesApi.create({
                saleID: currentInvoice.saleID,
                invoiceDate: currentInvoice.invoiceDate,
                status: currentInvoice.status || 'Due',
            });
            alert(`Invoice ${created.invoiceNumber || '#' + created.invoiceID} generated.`);
            setShowModal(false);
            setSelectedSale(null);
            setCurrentInvoice({
                saleID: 0,
                status: 'Due',
                invoiceDate: new Date().toISOString().split('T')[0]
            });
            await loadData();
        } catch (err: any) {
            handleApiError(err);
            setError(err.message || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    const getCustomerName = (customerId?: number) => {
        if (!customerId) return '—';
        return customers.find(c => c.customerID === customerId)?.fullName || `#${customerId}`;
    };

    const handlePrint = (invoice: SalesInvoice) => {
        const sale = sales.find(s => s.saleID === invoice.saleID);
        const customer = customers.find(c => c.customerID === sale?.customerID);
        const grandTotal = Number(invoice.grandTotal) || 0;
        const taxAmount = Number(invoice.taxAmount) || 0;
        const taxable = Number(invoice.taxableAmount) || 0;
        const nonTaxable = Number(invoice.nonTaxableAmount) || 0;
        const invNo = invoice.invoiceNumber || `INV-${invoice.invoiceID}`;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) {
            alert('Popup blocked! Please allow popups for this site to print the invoice.');
            return;
        }

        printWindow.document.write(`<!DOCTYPE html><html><head><title>${invNo}</title>
<style>
body{font-family:Segoe UI,Tahoma,sans-serif;padding:40px;color:#1e293b}
.header{display:flex;justify-content:space-between;border-bottom:3px solid #3b82f6;padding-bottom:20px;margin-bottom:30px}
.totals{margin-left:auto;width:300px;margin-top:24px}
.row{display:flex;justify-content:space-between;padding:6px 0}
.grand{border-top:2px solid #3b82f6;margin-top:8px;padding-top:12px;font-weight:800;font-size:1.2rem;color:#3b82f6}
@media print{.no-print{display:none}}
</style></head><body>
<div class="no-print" style="margin-bottom:20px"><button onclick="window.print()">Print</button> <button onclick="window.close()">Close</button></div>
<div class="header"><div><h1 style="margin:0;color:#3b82f6">TAX INVOICE</h1><p>Nepal VAT 13%</p></div>
<div style="text-align:right"><p><strong>${invNo}</strong></p><p>${formatAdBs(invoice.invoiceDate)}</p></div></div>
<p><strong>Billed To:</strong> ${customer?.fullName || getCustomerName(sale?.customerID)}<br/>
PAN: ${customer?.pan || '—'}<br/>SO: #SO-${invoice.saleID}</p>
<div class="totals">
<div class="row"><span>Taxable</span><span>${formatNpr(taxable)}</span></div>
<div class="row"><span>Non-taxable</span><span>${formatNpr(nonTaxable)}</span></div>
<div class="row"><span>VAT 13%</span><span>${formatNpr(taxAmount)}</span></div>
<div class="row grand"><span>Grand Total</span><span>${formatNpr(grandTotal)}</span></div>
</div>
<p style="margin-top:40px;color:#94a3b8;font-size:0.9rem">Computer-generated tax invoice · Status: ${invoice.status}</p>
</body></html>`);
        printWindow.document.close();
    };

    const columns: Column<SalesInvoice>[] = [
        { header: 'Invoice #', render: (i) => <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{i.invoiceNumber || `INV-${i.invoiceID}`}</code> },
        { header: 'Order Ref', render: (i) => `#SO-${i.saleID}` },
        { header: 'Date', render: (i) => formatAdBs(i.invoiceDate) },
        { header: 'Taxable', align: 'right', numeric: true, sortValue: (i) => i.taxableAmount, render: (i) => <MoneyCell amount={i.taxableAmount} muted /> },
        { header: 'VAT', align: 'right', numeric: true, sortValue: (i) => i.taxAmount, render: (i) => <MoneyCell amount={i.taxAmount} muted /> },
        { header: 'Grand Total', align: 'right', numeric: true, sortValue: (i) => i.grandTotal, render: (i) => <MoneyCell amount={i.grandTotal} strong /> },
        {
            header: 'Status',
            render: (i) => <StatusBadge status={i.status}>{i.status}</StatusBadge>
        },
    ];

    const invoicedSaleIds = new Set(invoices.map(i => i.saleID));

    return (
        <>
            <LookupTable<SalesInvoice>
                title="Sales Invoices"
                subtitle="FY invoice numbers, VAT 13% split, PAN-checked taxable bills."
                addButtonLabel="Generate Invoice"
                editButtonLabel="Print PDF"
                onAdd={() => {
                    setSelectedSale(null);
                    setCurrentInvoice({
                        saleID: 0,
                        status: 'Due',
                        invoiceDate: new Date().toISOString().split('T')[0]
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={invoices}
                keyField="invoiceID"
                loading={loading}
                error={error}
                onEdit={handlePrint}
                onDelete={() => {}}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="glass animate-fade modal-card">
                        <WorkflowStrip
                            steps={[
                                { label: 'Sale', href: '/sales', done: true },
                                { label: 'Delivery', href: '/delivery-notes' },
                                { label: 'Invoice', active: true },
                            ]}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>Generate Tax Invoice</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Server calculates taxable / non-taxable / 13% VAT and assigns FY number.
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Sales Order</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentInvoice.saleID || 0}
                                        onChange={e => {
                                            const sId = parseInt(e.target.value);
                                            const sale = sales.find(s => s.saleID === sId);
                                            setSelectedSale(sale);
                                            setCurrentInvoice({ ...currentInvoice, saleID: sId });
                                        }}
                                        style={{ height: '3.5rem' }}
                                    >
                                        <option value={0} disabled>Select a Sales Order</option>
                                        {sales.filter(s => !invoicedSaleIds.has(s.saleID)).map(s => (
                                            <option key={s.saleID} value={s.saleID}>
                                                #SO-{s.saleID} · {getCustomerName(s.customerID)} · {formatNpr(s.totalAmount)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Billing Date (AD)</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={currentInvoice.invoiceDate}
                                        onChange={e => setCurrentInvoice({ ...currentInvoice, invoiceDate: e.target.value })}
                                        style={{ height: '3.5rem', colorScheme: 'dark' }}
                                    />
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {formatAdBs(currentInvoice.invoiceDate || null)}
                                    </p>
                                </div>
                            </div>

                            {selectedSale && (
                                <div style={{
                                    padding: '1.5rem',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    marginBottom: '2rem'
                                }}>
                                    <h3 style={{ marginTop: 0, fontSize: '1rem', color: 'var(--primary)' }}>Order preview</h3>
                                    <p style={{ margin: '0 0 0.5rem' }}>
                                        Customer: <strong>{getCustomerName(selectedSale.customerID)}</strong>
                                        {' · '}PAN: <code>{customers.find(c => c.customerID === selectedSale.customerID)?.pan || '—'}</code>
                                    </p>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Line total {formatNpr(selectedSale.totalAmount)}. Taxable B2B sales require a 9-digit PAN.
                                        Final VAT split is computed on save from product IsTaxable flags.
                                    </p>
                                </div>
                            )}

                            {showPaymentStatus ? (
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Payment Status</label>
                                    <select className="form-input" style={{ height: '3.5rem' }} value={currentInvoice.status} onChange={e => setCurrentInvoice({ ...currentInvoice, status: e.target.value })}>
                                        <option value="Due">Due</option>
                                        <option value="Partial">Partial</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                    New invoices default to <strong>Due</strong>. Enable Payments module to set Partial/Paid.
                                </p>
                            )}

                            <FormErrors errors={validationErrors} />
                            {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Saving…' : 'Generate & Save Bill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
