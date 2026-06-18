'use client';

import { useEffect, useState } from 'react';
import { salesApi, salesInvoicesApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface SalesInvoice {
    invoiceID: number;
    saleID: number;
    invoiceDate: string;
    taxAmount: number;
    grandTotal: number;
    status: string;
}

export default function SalesInvoicesPage() {
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Partial<SalesInvoice>>({
        saleID: 0,
        taxAmount: 0,
        grandTotal: 0,
        status: 'Due',
        invoiceDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [salesData, invoicesData] = await Promise.all([
                salesApi.getAll(),
                salesInvoicesApi.getAll()
            ]);
            setSales(salesData || []);
            setInvoices(invoicesData || []); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInvoice.saleID || currentInvoice.saleID === 0) {
            alert('Please select a sales order first.');
            return;
        }
        setLoading(true);
        try {
            await salesInvoicesApi.create(currentInvoice);
            alert('Invoice generated successfully.');
            setShowModal(false);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (invoice: SalesInvoice) => {
        // Find the sale to get customer ID
        const sale = sales.find(s => s.saleID === invoice.saleID);
        
        // Ensure values are numbers
        const grandTotal = Number(invoice.grandTotal) || 0;
        const taxAmount = Number(invoice.taxAmount) || 0;
        const baseAmount = grandTotal - taxAmount;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) {
            alert('Popup blocked! Please allow popups for this site to print the invoice.');
            return;
        }
        
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Invoice #INV-${invoice.invoiceID}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                        .company-info h1 { margin: 0; color: #3b82f6; font-size: 2.5rem; }
                        .invoice-meta { text-align: right; }
                        .invoice-meta p { margin: 4px 0; font-weight: 500; }
                        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .details-box h3 { margin-top: 0; color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                        .details-box p { margin: 8px 0; font-size: 1.1rem; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
                        th, td { padding: 16px; text-align: left; border-bottom: 1px solid #f1f5f9; }
                        .totals-container { margin-top: 40px; margin-left: auto; width: 300px; }
                        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
                        .total-row.grand { border-top: 2px solid #3b82f6; margin-top: 12px; padding-top: 16px; font-weight: 800; font-size: 1.4rem; color: #3b82f6; }
                        .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 0.9rem; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="no-print" style="background: #f8fafc; padding: 20px; display: flex; justify-content: center; gap: 10px; border-bottom: 1px solid #e2e8f0; margin: -40px -40px 40px -40px;">
                        <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; borderRadius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                            Print / Save as PDF
                        </button>
                        <button onclick="window.close()" style="background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 10px 20px; borderRadius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                            Close Window
                        </button>
                    </div>

                    <div class="header">
                        <div class="company-info">
                            <h1>INVENTORY</h1>
                            <p>Premium Billing Solutions</p>
                        </div>
                        <div class="invoice-meta">
                            <h2 style="margin: 0; font-size: 1.8rem;">INVOICE</h2>
                            <p><strong>#INV-${invoice.invoiceID}</strong></p>
                            <p>${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div class="details">
                        <div class="details-box">
                            <h3>Billed To</h3>
                            <p><strong>Customer ID:</strong> #${sale?.customerID || 'N/A'}</p>
                            <p>Status: ${invoice.status}</p>
                        </div>
                        <div class="details-box">
                            <h3>Reference</h3>
                            <p><strong>Sales Order:</strong> #SO-${invoice.saleID}</p>
                            <p><strong>Payment Status:</strong> ${invoice.status}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th style="text-align: right;">Total Amount (Incl. VAT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Sale Order Items for #SO-${invoice.saleID}</td>
                                <td style="text-align: right;">Rs. ${grandTotal.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="totals-container">
                        <div class="total-row">
                            <span>Base Amount</span>
                            <span>Rs. ${baseAmount.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>VAT (13%)</span>
                            <span>Rs. ${taxAmount.toFixed(2)}</span>
                        </div>
                        <div class="total-row grand">
                            <span>Grand Total</span>
                            <span>Rs. ${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>This is a computer-generated invoice.</p>
                    </div>
                </body>
            </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const columns: Column<SalesInvoice>[] = [
        { header: 'Invoice #', render: (i) => `#INV-${i.invoiceID}` },
        { header: 'Order Ref', render: (i) => `#SO-${i.saleID}` },
        { header: 'Date', render: (i) => new Date(i.invoiceDate).toLocaleDateString() },
        { header: 'Tax',         render: (i) => `Rs. ${i.taxAmount.toFixed(2)}` },
        { header: 'Grand Total', render: (i) => `Rs. ${i.grandTotal.toFixed(2)}` },
        { 
            header: 'Status', 
            render: (i) => (
                <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    background: i.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: i.status === 'Paid' ? 'var(--secondary)' : 'var(--error)'
                }}>
                    {i.status}
                </span>
            ) 
        },
    ];

    return (
        <>
            <LookupTable<SalesInvoice>
                title="Sales Invoices"
                subtitle="Customer billing and payment status tracking."
                addButtonLabel="Generate Invoice"
                editButtonLabel="Print PDF"
                onAdd={() => setShowModal(true)}
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
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>Generate Bill</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Finalize transaction and calculate tax.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Sales Order Reference</label>
                                    <select 
                                        className="form-input" 
                                        required 
                                        value={currentInvoice.saleID || 0} 
                                        onChange={e => {
                                            const sId = parseInt(e.target.value);
                                            const sale = sales.find(s => s.saleID === sId);
                                            setSelectedSale(sale);
                                            
                                            // Tax calculation: Sale Total already includes 13% tax
                                            const total = sale?.totalAmount || 0;
                                            const base = total / 1.13;
                                            const tax = total - base;
                                            
                                            setCurrentInvoice({
                                                ...currentInvoice, 
                                                saleID: sId,
                                                grandTotal: total,
                                                taxAmount: tax
                                            });
                                        }}
                                        style={{ height: '3.5rem' }}
                                    >
                                        <option value={0} disabled>Select a Sales Order</option>
                                        {sales.map(s => (
                                            <option key={s.saleID} value={s.saleID}>
                                                #SO-{s.saleID} - Rs. {s.totalAmount.toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Billing Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        required 
                                        value={currentInvoice.invoiceDate} 
                                        onChange={e => setCurrentInvoice({...currentInvoice, invoiceDate: e.target.value})}
                                        style={{ height: '3.5rem', colorScheme: 'dark' }}
                                    />
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
                                    <h3 style={{ marginTop: 0, fontSize: '1rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Summary</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</p>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{selectedSale.status}</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Date</p>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{new Date(selectedSale.saleDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer ID</p>
                                            <p style={{ margin: 0, fontWeight: 600 }}>#{selectedSale.customerID}</p>
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Base Amount (SP / 1.13)</span>
                                            <span>Rs. {(currentInvoice.grandTotal! - currentInvoice.taxAmount!).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>VAT (13%)</span>
                                            <span>Rs. {currentInvoice.taxAmount?.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--secondary)' }}>
                                            <span>Grand Total</span>
                                            <span>Rs. {currentInvoice.grandTotal?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Payment Status</label>
                                    <select className="form-input" style={{ height: '3.5rem' }} value={currentInvoice.status} onChange={e => setCurrentInvoice({...currentInvoice, status: e.target.value})}>
                                        <option value="Due">Due</option>
                                        <option value="Partial">Partial</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Print Option</label>
                                    <div style={{ display: 'flex', alignItems: 'center', height: '3.5rem', color: 'var(--text-muted)' }}>
                                        <input type="checkbox" style={{ marginRight: '0.5rem' }} defaultChecked /> Download PDF Invoice
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block">Generate & Save Bill</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
