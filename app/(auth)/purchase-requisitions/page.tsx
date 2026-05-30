'use client';

import { useEffect, useState } from 'react';
import { productsApi, purchaseRequisitionsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface PurchaseRequisition {
    prid: number;
    requestedBy: string;
    productID: number;
    quantity: number;
    requiredDate: string;
    status: string;
}

interface Product {
    productID: number;
    productName: string;
}

export default function PurchaseRequisitionsPage() {
    const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentPR, setCurrentPR] = useState<Partial<PurchaseRequisition>>({
        requestedBy: '',
        productID: 0,
        quantity: 1,
        requiredDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prods, reqs] = await Promise.all([
                productsApi.getAll(),
                purchaseRequisitionsApi.getAll()
            ]);
            setProducts(prods || []);
            setRequisitions(reqs || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await purchaseRequisitionsApi.create(currentPR);
            alert('Requisition submitted successfully.');
            setShowModal(false);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<PurchaseRequisition>[] = [
        { header: 'PR ID', render: (r) => `#PR-${r.prid}` },
        { header: 'Product', render: (r) => products.find(p => p.productID === r.productID)?.productName || 'Unknown' },
        { header: 'Qty', render: (r) => r.quantity },
        { header: 'Requested By', render: (r) => r.requestedBy },
        { header: 'Required Date', render: (r) => new Date(r.requiredDate).toLocaleDateString() },
        { 
            header: 'Status', 
            render: (r) => (
                <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    background: r.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: r.status === 'Approved' ? 'var(--secondary)' : 'var(--warning)'
                }}>
                    {r.status}
                </span>
            ) 
        },
        {
            header: 'Actions',
            render: (r) => (
                r.status === 'Pending' ? (
                    <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={async () => {
                            try {
                                await purchaseRequisitionsApi.update(r.prid, { ...r, status: 'Approved' });
                                await loadData();
                            } catch (err: any) {
                                setError(err.message);
                            }
                        }}
                    >
                        Approve
                    </button>
                ) : null
            )
        }
    ];

    return (
        <>
            <LookupTable<PurchaseRequisition>
                title="Purchase Requisitions"
                subtitle="Internal requests for materials and products."
                addButtonLabel="New Requisition"
                onAdd={() => setShowModal(true)}
                columns={columns}
                data={requisitions}
                keyField="prid"
                loading={loading}
                error={error}
                onEdit={() => {}}
                onDelete={() => {}}
            />

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(2, 6, 23, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="auth-card glass animate-fade" style={{ maxWidth: '600px', width: '100%', padding: '3.5rem' }}>
                        <h2 className="auth-title">New Requisition</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Requested By</label>
                                <input type="text" className="form-input" required value={currentPR.requestedBy} onChange={e => setCurrentPR({...currentPR, requestedBy: e.target.value})} placeholder="Your Name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-input" required value={currentPR.productID} onChange={e => setCurrentPR({...currentPR, productID: parseInt(e.target.value)})}>
                                    <option value={0} disabled>Select Product</option>
                                    {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input type="number" className="form-input" min="1" required value={currentPR.quantity} onChange={e => setCurrentPR({...currentPR, quantity: parseInt(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Required Date</label>
                                    <input type="date" className="form-input" required value={currentPR.requiredDate} onChange={e => setCurrentPR({...currentPR, requiredDate: e.target.value})} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
