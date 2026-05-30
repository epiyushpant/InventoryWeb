'use client';

import { useEffect, useState } from 'react';
import { productsApi, locationsApi, stockTransfersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface StockTransfer {
    transferID: number;
    fromLocationID: number;
    toLocationID: number;
    productID: number;
    quantity: number;
    transferDate: string;
    status: string;
}

interface Product {
    productID: number;
    productName: string;
}

interface Location {
    locationID: number;
    warehouseName: string;
}

export default function StockTransfersPage() {
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTransfer, setCurrentTransfer] = useState<Partial<StockTransfer>>({
        fromLocationID: 0,
        toLocationID: 0,
        productID: 0,
        quantity: 0,
        status: 'Pending',
        transferDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prods, locs, data] = await Promise.all([
                productsApi.getAll(),
                locationsApi.getAll(),
                stockTransfersApi.getAll()
            ]);
            setProducts(prods || []);
            setLocations(locs || []);
            setTransfers(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentTransfer.fromLocationID === currentTransfer.toLocationID) {
            alert('Source and destination warehouses cannot be the same.');
            return;
        }
        setLoading(true);
        try {
            if (isEditing && currentTransfer.transferID) {
                await stockTransfersApi.update(currentTransfer.transferID, currentTransfer);
                alert('Stock transfer updated successfully.');
            } else {
                await stockTransfersApi.create(currentTransfer);
                alert('Stock transfer initiated successfully.');
            }
            setShowModal(false);
            setIsEditing(false);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (transfer: StockTransfer) => {
        setCurrentTransfer(transfer);
        setIsEditing(true);
        setShowModal(true);
    };

    const columns: Column<StockTransfer>[] = [
        { header: 'Transfer ID', render: (t) => `#TR-${t.transferID}` },
        { header: 'Product', render: (t) => products.find(p => p.productID === t.productID)?.productName || 'Unknown' },
        { header: 'Qty', render: (t) => t.quantity },
        { header: 'From', render: (t) => locations.find(l => l.locationID === t.fromLocationID)?.warehouseName || 'Unknown' },
        { header: 'To', render: (t) => locations.find(l => l.locationID === t.toLocationID)?.warehouseName || 'Unknown' },
        { 
            header: 'Status', 
            render: (t) => (
                <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    background: t.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                    color: t.status === 'Completed' ? 'var(--secondary)' : 'var(--primary)'
                }}>
                    {t.status}
                </span>
            ) 
        },
    ];

    return (
        <>
            <LookupTable<StockTransfer>
                title="Stock Transfers"
                subtitle="Manage inventory movements between different warehouse locations."
                addButtonLabel="New Transfer"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentTransfer({
                        fromLocationID: 0,
                        toLocationID: 0,
                        productID: 0,
                        quantity: 0,
                        status: 'Pending',
                        transferDate: new Date().toISOString().split('T')[0]
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={transfers}
                keyField="transferID"
                loading={loading}
                error={error}
                onEdit={handleEdit}
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
                        <h2 className="auth-title">Initiate Transfer</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-input" required value={currentTransfer.productID} onChange={e => setCurrentTransfer({...currentTransfer, productID: parseInt(e.target.value)})}>
                                    <option value={0} disabled>Select Product</option>
                                    {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">From Warehouse</label>
                                    <select className="form-input" required value={currentTransfer.fromLocationID} onChange={e => setCurrentTransfer({...currentTransfer, fromLocationID: parseInt(e.target.value)})}>
                                        <option value={0} disabled>Select Source</option>
                                        {locations.map(l => <option key={l.locationID} value={l.locationID}>{l.warehouseName}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">To Warehouse</label>
                                    <select className="form-input" required value={currentTransfer.toLocationID} onChange={e => setCurrentTransfer({...currentTransfer, toLocationID: parseInt(e.target.value)})}>
                                        <option value={0} disabled>Select Destination</option>
                                        {locations.map(l => <option key={l.locationID} value={l.locationID}>{l.warehouseName}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity to Transfer</label>
                                    <input type="number" className="form-input" min="1" required value={currentTransfer.quantity} onChange={e => setCurrentTransfer({...currentTransfer, quantity: parseInt(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-input" required value={currentTransfer.status} onChange={e => setCurrentTransfer({...currentTransfer, status: e.target.value})}>
                                        <option value="Pending">Pending</option>
                                        <option value="In-Transit">In-Transit</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Start Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
