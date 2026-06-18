'use client';

import { useEffect, useState } from 'react';
import { productsApi, deliveryNotesApi, salesApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface DeliveryNote {
    deliveryID: number;
    saleID: number;
    productID: number;
    shippedQuantity: number;
    shipmentDate: string;
    transportDetails: string;
}

interface Product {
    productID: number;
    productName: string;
}

export default function DeliveryNotesPage() {
    const [deliveries, setDeliveries] = useState<DeliveryNote[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentDelivery, setCurrentDelivery] = useState<Partial<DeliveryNote>>({
        saleID: 0,
        productID: 0,
        shippedQuantity: 0,
        transportDetails: '',
        shipmentDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prods, sData, dData] = await Promise.all([
                productsApi.getAll(),
                salesApi.getAll(),
                deliveryNotesApi.getAll()
            ]);
            setProducts(prods || []);
            setSales(sData || []);
            setDeliveries(dData || []);
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
            if (isEditing && currentDelivery.deliveryID) {
                await deliveryNotesApi.update(currentDelivery.deliveryID, currentDelivery);
            } else {
                await deliveryNotesApi.create(currentDelivery);
            }
            setShowModal(false);
            setCurrentDelivery({
                saleID: 0,
                productID: 0,
                shippedQuantity: 0,
                transportDetails: '',
                shipmentDate: new Date().toISOString().split('T')[0]
            });
            setIsEditing(false);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (delivery: DeliveryNote) => {
        const dateStr = delivery.shipmentDate ? new Date(delivery.shipmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setCurrentDelivery({
            ...delivery,
            shipmentDate: dateStr
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (delivery: DeliveryNote) => {
        if (!confirm('Are you sure you want to delete this delivery note?')) return;
        try {
            await deliveryNotesApi.delete(delivery.deliveryID);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const columns: Column<DeliveryNote>[] = [
        { header: 'Delivery ID', render: (d) => `#DN-${d.deliveryID}` },
        { header: 'Order Ref', render: (d) => `#SO-${d.saleID}` },
        { header: 'Product', render: (d) => products.find(p => p.productID === d.productID)?.productName || 'Unknown' },
        { header: 'Shipped Qty', render: (d) => d.shippedQuantity },
        { header: 'Shipment Date', render: (d) => new Date(d.shipmentDate).toLocaleDateString() },
        { header: 'Transport', render: (d) => d.transportDetails },
    ];

    return (
        <>
            <LookupTable<DeliveryNote>
                title="Delivery Notes / Shipments"
                subtitle="Manage outgoing shipments and transport logistics."
                addButtonLabel="Dispatch Goods"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentDelivery({
                        saleID: 0,
                        productID: 0,
                        shippedQuantity: 0,
                        transportDetails: '',
                        shipmentDate: new Date().toISOString().split('T')[0]
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={deliveries}
                keyField="deliveryID"
                loading={loading}
                error={error}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>
                                {isEditing ? 'Edit Shipment' : 'Dispatch Shipment'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                {isEditing ? 'Modify shipment and transport logistics.' : 'Create a new outgoing shipment record.'}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Sales Order Ref ID</label>
                                    <select 
                                        className="form-input" 
                                        required 
                                        value={currentDelivery.saleID || 0} 
                                        onChange={e => setCurrentDelivery({...currentDelivery, saleID: parseInt(e.target.value)})}
                                    >
                                        <option value={0} disabled>Select a Sales Order</option>
                                        {sales.map(s => (
                                            <option key={s.saleID} value={s.saleID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
                                                #SO-{s.saleID} ({s.customerID ? `Customer #${s.customerID}` : 'Walk-in'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Product</label>
                                    <select 
                                        className="form-input" 
                                        required 
                                        value={currentDelivery.productID || 0} 
                                        onChange={e => setCurrentDelivery({...currentDelivery, productID: parseInt(e.target.value)})}
                                    >
                                        <option value={0} disabled>Select Product</option>
                                        {products.map(p => (
                                            <option key={p.productID} value={p.productID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
                                                {p.productName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Shipped Qty</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        min="1" 
                                        required 
                                        value={currentDelivery.shippedQuantity || ''} 
                                        onChange={e => setCurrentDelivery({...currentDelivery, shippedQuantity: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Shipment Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        required 
                                        value={currentDelivery.shipmentDate || ''} 
                                        onChange={e => setCurrentDelivery({...currentDelivery, shipmentDate: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Transport Details</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={currentDelivery.transportDetails || ''} 
                                    onChange={e => setCurrentDelivery({...currentDelivery, transportDetails: e.target.value})} 
                                    placeholder="e.g. DHL tracking #12345" 
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Details' : 'Dispatch Now')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
