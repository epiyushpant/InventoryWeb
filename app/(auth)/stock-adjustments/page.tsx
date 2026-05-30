'use client';

import { useEffect, useState } from 'react';
import { productsApi, locationsApi, stockAdjustmentsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface StockAdjustment {
    adjustmentID: number;
    productID: number;
    locationID: number;
    adjustmentType: string;
    quantity: number;
    reason: string;
    adjustmentDate: string;
}

interface Product {
    productID: number;
    productName: string;
    sku?: string;
}

interface Location {
    locationID: number;
    warehouseName: string;
    city: string;
}

export default function StockAdjustmentsPage() {
    const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentAdjustment, setCurrentAdjustment] = useState<Partial<StockAdjustment>>({
        productID: 0,
        locationID: 0,
        adjustmentType: 'Add',
        quantity: 0,
        reason: ''
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [prods, locs, data] = await Promise.all([
                productsApi.getAll(),
                locationsApi.getAll(),
                stockAdjustmentsApi.getAll()
            ]);
            setProducts(prods || []);
            setLocations(locs || []);
            setAdjustments(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await stockAdjustmentsApi.create(currentAdjustment);
            alert('Stock adjustment submitted successfully.');
            setShowModal(false);
            await loadInitialData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<StockAdjustment>[] = [
        {
            header: 'Date',
            render: (a) => new Date(a.adjustmentDate).toLocaleDateString(),
        },
        {
            header: 'Product',
            render: (a) => products.find(p => p.productID === a.productID)?.productName || 'Unknown',
        },
        {
            header: 'Warehouse',
            render: (a) => locations.find(l => l.locationID === a.locationID)?.warehouseName || 'Unknown',
        },
        {
            header: 'Type',
            render: (a) => (
                <span style={{ 
                    color: a.adjustmentType === 'Add' ? 'var(--secondary)' : 'var(--error)',
                    fontWeight: 700
                }}>
                    {a.adjustmentType.toUpperCase()}
                </span>
            ),
        },
        {
            header: 'Quantity',
            render: (a) => a.quantity,
        },
        {
            header: 'Reason',
            render: (a) => a.reason,
        }
    ];

    return (
        <>
            <LookupTable<StockAdjustment>
                title="Stock Adjustments"
                subtitle="Record manual inventory corrections for loss, damage, or audits."
                addButtonLabel="New Adjustment"
                onAdd={() => setShowModal(true)}
                columns={columns}
                data={adjustments}
                keyField="adjustmentID"
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
                        <h2 className="auth-title">Create Adjustment</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-input" required value={currentAdjustment.productID} onChange={e => setCurrentAdjustment({...currentAdjustment, productID: parseInt(e.target.value)})}>
                                    <option value={0} disabled>Select Product</option>
                                    {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Warehouse</label>
                                <select className="form-input" required value={currentAdjustment.locationID} onChange={e => setCurrentAdjustment({...currentAdjustment, locationID: parseInt(e.target.value)})}>
                                    <option value={0} disabled>Select Warehouse</option>
                                    {locations.map(l => <option key={l.locationID} value={l.locationID}>{l.warehouseName}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Adjustment Type</label>
                                    <select className="form-input" value={currentAdjustment.adjustmentType} onChange={e => setCurrentAdjustment({...currentAdjustment, adjustmentType: e.target.value})}>
                                        <option value="Add">Add (+)</option>
                                        <option value="Deduct">Deduct (-)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input type="number" className="form-input" min="1" required value={currentAdjustment.quantity} onChange={e => setCurrentAdjustment({...currentAdjustment, quantity: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-input" rows={2} required value={currentAdjustment.reason} onChange={e => setCurrentAdjustment({...currentAdjustment, reason: e.target.value})} placeholder="e.g. Damage during handling" />
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Adjustment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
