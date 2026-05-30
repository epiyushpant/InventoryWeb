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
            await deliveryNotesApi.create(currentDelivery);
            alert('Delivery note created successfully. Inventory updated.');
            setShowModal(false);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                onAdd={() => setShowModal(true)}
                columns={columns}
                data={deliveries}
                keyField="deliveryID"
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
                        <h2 className="auth-title">Dispatch Shipment</h2>
                        <form onSubmit={handleSubmit}>
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
                                        <option key={s.saleID} value={s.saleID}>
                                            #SO-{s.saleID} ({s.customerID ? `Customer #${s.customerID}` : 'Walk-in'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-input" required value={currentDelivery.productID} onChange={e => setCurrentDelivery({...currentDelivery, productID: parseInt(e.target.value)})}>
                                    <option value={0} disabled>Select Product</option>
                                    {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Shipped Qty</label>
                                <input type="number" className="form-input" min="1" required value={currentDelivery.shippedQuantity} onChange={e => setCurrentDelivery({...currentDelivery, shippedQuantity: parseInt(e.target.value)})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Transport Details</label>
                                <input type="text" className="form-input" value={currentDelivery.transportDetails} onChange={e => setCurrentDelivery({...currentDelivery, transportDetails: e.target.value})} placeholder="e.g. DHL tracking #12345" />
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Dispatch Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
