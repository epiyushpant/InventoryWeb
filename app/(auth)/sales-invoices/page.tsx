'use client';

import { useEffect, useState } from 'react';
import { salesApi, salesInvoicesApi, customersApi, productsApi } from '@/lib/api';
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
    const [products, setProducts] = useState<any[]>([]);
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
            const [salesData, invoicesData, customersData, productsData] = await Promise.all([
                salesApi.getAll(),
                salesInvoicesApi.getAll(),
                customersApi.getAll(),
                productsApi.getAll()
            ]);
            setSales(salesData || []);
            setInvoices(invoicesData || []);
            setCustomers(customersData || []);
            setProducts(productsData || []);
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

    const getProductName = (productId?: number) => {
        if (!productId) return `Item #${productId ?? ''}`;
        return products.find(p => p.productID === productId)?.productName || `Item #${productId}`;
    };

    const handlePrint = async (invoice: SalesInvoice) => {
        const invNo = invoice.invoiceNumber || `INV-${invoice.invoiceID}`;

        // Pull the full sale (with line items) so the invoice shows a proper products table.
        let sale = sales.find(s => s.saleID === invoice.saleID);
        try {
            const full = await salesApi.getById(invoice.saleID);
            if (full) sale = full;
        } catch {
            /* fall back to the list row we already have */
        }

        const customer = customers.find(c => c.customerID === sale?.customerID);
        const lines: any[] = sale?.saleDetails || [];

        const grandTotal = Number(invoice.grandTotal) || 0;
        const taxAmount = Number(invoice.taxAmount) || 0;
        const taxable = Number(invoice.taxableAmount) || 0;
        const nonTaxable = Number(invoice.nonTaxableAmount) || 0;
        const subTotal = taxable + nonTaxable || lines.reduce((s, l) => s + (Number(l.lineTotal) || 0), 0);

        const issuedOn = formatAdBs(invoice.invoiceDate);
        // No stored due date on the invoice — default to net-15 for the document.
        const dueDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
        if (dueDate) dueDate.setDate(dueDate.getDate() + 15);
        const dueOn = dueDate ? formatAdBs(dueDate.toISOString()) : '—';

        const statusColor = invoice.status === 'Paid' ? '#12b76a'
            : invoice.status === 'Partial' ? '#f79009' : '#f04438';

        const rows = lines.length
            ? lines.map((l, idx) => {
                const qty = Number(l.orderedQuantity) || 0;
                const unit = Number(l.unitPrice) || 0;
                const disc = Number(l.discount) || 0;
                const total = Number(l.lineTotal) || (qty * unit - disc);
                return `<tr>
<td>${idx + 1}</td>
<td class="prod">${getProductName(l.productID)}</td>
<td class="num">${qty}</td>
<td class="num">${formatNpr(unit)}</td>
<td class="num">${formatNpr(disc)}</td>
<td class="num">${formatNpr(total)}</td>
</tr>`;
            }).join('')
            : `<tr><td colspan="6" class="empty">No line items recorded for this sale.</td></tr>`;

        const printWindow = window.open('', '_blank', 'width=900,height=1000');
        if (!printWindow) {
            alert('Popup blocked! Please allow popups for this site to print the invoice.');
            return;
        }

        printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${invNo}</title>
<style>
*{box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,sans-serif;margin:0;background:#f3f4f6;color:#344054}
.sheet{max-width:820px;margin:24px auto;background:#fff;border:1px solid #e4e7ec;border-radius:16px;overflow:hidden}
.pad{padding:32px 40px}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e4e7ec}
.title{font-size:1.75rem;font-weight:700;color:#101828;margin:0}
.chip{display:inline-block;padding:4px 12px;border-radius:999px;font-size:.75rem;font-weight:700;color:#fff;background:${statusColor}}
.muted{color:#667085;font-size:.85rem;margin:2px 0}
.parties{display:flex;justify-content:space-between;gap:24px;padding:28px 40px}
.parties h4{margin:0 0 6px;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#98a2b3}
.parties .name{font-size:1rem;font-weight:700;color:#101828;margin:0 0 4px}
.right{text-align:right}
table{width:100%;border-collapse:collapse;font-size:.9rem}
thead th{background:#f9fafb;color:#667085;text-transform:uppercase;font-size:.7rem;letter-spacing:.05em;text-align:left;padding:12px 40px}
tbody td{padding:14px 40px;border-top:1px solid #f2f4f7}
th.num,td.num{text-align:right}
td.prod{color:#101828;font-weight:600}
td.empty{text-align:center;color:#98a2b3;padding:28px}
.totals{margin-left:auto;width:320px;padding:8px 40px 0}
.trow{display:flex;justify-content:space-between;padding:8px 0;font-size:.9rem}
.trow.grand{border-top:1px solid #e4e7ec;margin-top:6px;padding-top:14px;font-size:1.15rem;font-weight:800;color:#101828}
.foot{display:flex;justify-content:flex-end;gap:12px;padding:24px 40px 36px}
.btn{border:none;border-radius:8px;padding:11px 20px;font-size:.9rem;font-weight:600;cursor:pointer}
.btn-primary{background:#3b82f6;color:#fff}
.btn-ghost{background:#fff;color:#344054;border:1px solid #d0d5dd}
.note{padding:0 40px 28px;color:#98a2b3;font-size:.8rem}
@media print{body{background:#fff}.sheet{border:none;margin:0;max-width:none}.no-print{display:none}}
</style></head><body>
<div class="sheet">
  <div class="top pad">
    <div>
      <h1 class="title">Invoice</h1>
      <p class="muted">ID : <strong>${invNo}</strong></p>
      <p class="muted">Order Ref : #SO-${invoice.saleID}</p>
    </div>
    <div class="right">
      <span class="chip">${invoice.status}</span>
      <p class="muted" style="margin-top:10px">Nepal Tax Invoice · VAT 13%</p>
    </div>
  </div>

  <div class="parties">
    <div>
      <h4>From</h4>
      <p class="name">Inventory Pro Pvt. Ltd.</p>
      <p class="muted">Kathmandu, Nepal</p>
      <p class="muted">PAN: 600000000</p>
      <p class="muted" style="margin-top:8px">Issued On: <strong>${issuedOn}</strong></p>
    </div>
    <div class="right">
      <h4>Bill To</h4>
      <p class="name">${customer?.fullName || getCustomerName(sale?.customerID)}</p>
      <p class="muted">${[customer?.billingAddress || customer?.address, customer?.billingCity, customer?.billingCountry].filter(Boolean).join(', ') || '—'}</p>
      <p class="muted">PAN: ${customer?.pan || '—'}</p>
      <p class="muted" style="margin-top:8px">Due On: <strong>${dueOn}</strong></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>S.No.#</th><th>Products</th><th class="num">Quantity</th>
        <th class="num">Unit Cost</th><th class="num">Discount</th><th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="trow"><span>Sub Total</span><span>${formatNpr(subTotal)}</span></div>
    ${nonTaxable > 0 ? `<div class="trow"><span>Non-taxable</span><span>${formatNpr(nonTaxable)}</span></div>` : ''}
    <div class="trow"><span>VAT (13%)</span><span>${formatNpr(taxAmount)}</span></div>
    <div class="trow grand"><span>Total</span><span>${formatNpr(grandTotal)}</span></div>
  </div>

  <p class="note">Computer-generated tax invoice. Taxable amount ${formatNpr(taxable)} @ 13% VAT.</p>

  <div class="foot no-print">
    <button class="btn btn-ghost" onclick="window.close()">Close</button>
    <button class="btn btn-primary" onclick="window.print()">Print</button>
  </div>
</div>
</body></html>`);
        printWindow.document.close();
    };

    // Client-side estimate of the VAT split for the create-invoice preview.
    // The server recomputes the authoritative numbers on save.
    const estimateFromSale = (sale: any) => {
        const lines: any[] = sale?.saleDetails || [];
        let taxable = 0;
        let nonTaxable = 0;
        for (const l of lines) {
            const total = Number(l.lineTotal) || (Number(l.orderedQuantity) || 0) * (Number(l.unitPrice) || 0) - (Number(l.discount) || 0);
            const prod = products.find(p => p.productID === l.productID);
            if (prod?.isTaxable === false) nonTaxable += total;
            else taxable += total;
        }
        const vat = taxable * 0.13;
        return { lines, subTotal: taxable + nonTaxable, taxable, nonTaxable, vat, total: taxable + nonTaxable + vat };
    };

    const handlePreview = () => {
        if (!selectedSale) return;
        const est = estimateFromSale(selectedSale);
        handlePrint({
            invoiceID: 0,
            invoiceNumber: 'DRAFT PREVIEW',
            saleID: selectedSale.saleID,
            invoiceDate: currentInvoice.invoiceDate || new Date().toISOString(),
            taxAmount: est.vat,
            taxableAmount: est.taxable,
            nonTaxableAmount: est.nonTaxable,
            grandTotal: est.total,
            status: currentInvoice.status || 'Due',
        });
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
                                <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>Create Invoice</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Pick a sales order, review the line items, then save. Server assigns the FY number and 13% VAT split.
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

                            {selectedSale && (() => {
                                const est = estimateFromSale(selectedSale);
                                const cust = customers.find(c => c.customerID === selectedSale.customerID);
                                const custAddress = [cust?.billingAddress || cust?.address, cust?.billingCity, cust?.billingCountry].filter(Boolean).join(', ') || '—';
                                return (
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        marginBottom: '2rem',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem' }}>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Customer Name</label>
                                                <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{getCustomerName(selectedSale.customerID)}</p>
                                                <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PAN: {cust?.pan || '—'}</p>
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Customer Address</label>
                                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{custAddress}</p>
                                            </div>
                                        </div>

                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                                    <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>S. No.</th>
                                                    <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</th>
                                                    <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Quantity</th>
                                                    <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Unit Cost</th>
                                                    <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Discount</th>
                                                    <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {est.lines.length ? est.lines.map((l: any, idx: number) => {
                                                    const qty = Number(l.orderedQuantity) || 0;
                                                    const unit = Number(l.unitPrice) || 0;
                                                    const disc = Number(l.discount) || 0;
                                                    const total = Number(l.lineTotal) || (qty * unit - disc);
                                                    return (
                                                        <tr key={l.saleDetailID ?? idx} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                            <td style={{ padding: '0.75rem 1.5rem' }}>{idx + 1}</td>
                                                            <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>{getProductName(l.productID)}</td>
                                                            <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>{qty}</td>
                                                            <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>{formatNpr(unit)}</td>
                                                            <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>{formatNpr(disc)}</td>
                                                            <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>{formatNpr(total)}</td>
                                                        </tr>
                                                    );
                                                }) : (
                                                    <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No line items on this sales order.</td></tr>
                                                )}
                                            </tbody>
                                        </table>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem 1.5rem' }}>
                                            <div style={{ width: '280px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Sub Total</span><span>{formatNpr(est.subTotal)}</span>
                                                </div>
                                                {est.nonTaxable > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Non-taxable</span><span>{formatNpr(est.nonTaxable)}</span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>VAT (13%)</span><span>{formatNpr(est.vat)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.12)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                                                    <span>Total</span><span>{formatNpr(est.total)}</span>
                                                </div>
                                                <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                    Estimated split — server recomputes taxable / VAT from product tax flags on save.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

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
                                <button type="button" className="btn btn-secondary btn-block" onClick={handlePreview} disabled={!selectedSale}>
                                    Preview Invoice
                                </button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Saving…' : 'Save Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
