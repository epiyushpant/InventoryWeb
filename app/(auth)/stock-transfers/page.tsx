'use client';

import { useEffect, useState } from 'react';
import { productsApi, locationsApi, stockTransfersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';
import StatusBadge from '@/components/StatusBadge';

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
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();
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
        setError('');
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
            handleApiError(err);
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
            render: (t) => <StatusBadge status={t.status}>{t.status}</StatusBadge>
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
                <div className="modal-backdrop">
                    <div className="glass animate-fade modal-card">
                        <h2 className="auth-title">Initiate Transfer</h2>
                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-input" required value={currentTransfer.productID} onChange={e => setCurrentTransfer({...currentTransfer, productID: parseInt(e.target.value)})}>
                                    <option value={0} disabled>Select Product</option>
                                    {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
                                </select>
                            </div>
                            <div className="form-grid form-grid-2">
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
                            <div className="form-grid form-grid-2">
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
                            <FormErrors errors={validationErrors} />
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block">Start Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
