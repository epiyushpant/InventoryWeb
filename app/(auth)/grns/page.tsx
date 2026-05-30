'use client';

import { useEffect, useState } from 'react';
import { productsApi, locationsApi, grnsApi, purchaseOrdersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface GRN {
    grnid: number;
    purchaseOrderID: number;
    productID: number;
    receivedQuantity: number;
    damagedQuantity: number;
    locationID: number;
    receivedDate: string;
}

interface Product {
    productID: number;
    productName: string;
}

interface Location {
    locationID: number;
    warehouseName: string;
}

export default function GRNsPage() {
    const [grns, setGrns] = useState<GRN[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentGRN, setCurrentGRN] = useState<Partial<GRN>>({
        purchaseOrderID: 0,
        productID: 0,
        receivedQuantity: 0,
        damagedQuantity: 0,
        locationID: 0,
        receivedDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prods, locs, pos, data] = await Promise.all([
                productsApi.getAll(),
                locationsApi.getAll(),
                purchaseOrdersApi.getAll(),
                grnsApi.getAll()
            ]);
            setProducts(prods || []);
            setLocations(locs || []);
            setPurchaseOrders(pos || []);
            setGrns(data || []);
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
            await grnsApi.create(currentGRN);
            alert('GRN saved successfully. Inventory updated.');
            setShowModal(false);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<GRN>[] = [
        { header: 'GRN ID', render: (g) => `#GRN-${g.grnid}` },
        { header: 'PO Ref', render: (g) => `#PO-${g.purchaseOrderID}` },
        { header: 'Product', render: (g) => products.find(p => p.productID === g.productID)?.productName || 'Unknown' },
        { header: 'Received', render: (g) => g.receivedQuantity },
        { header: 'Damaged', render: (g) => g.damagedQuantity },
        { header: 'Warehouse', render: (g) => locations.find(l => l.locationID === g.locationID)?.warehouseName || 'Unknown' },
        { header: 'Date', render: (g) => new Date(g.receivedDate).toLocaleDateString() },
    ];

    return (
        <>
            <LookupTable<GRN>
                title="Goods Received Notes (GRN)"
                subtitle="Track incoming shipments and verify stock quality."
                addButtonLabel="Receive Goods"
                onAdd={() => setShowModal(true)}
                columns={columns}
                data={grns}
                keyField="grnid"
                loading={loading}
                error={error}
                onEdit={() => { }}
                onDelete={() => { }}
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
                        <h2 className="auth-title">Receive Shipment</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Purchase Order</label>
                                <select
                                    className="form-input"
                                    required
                                    value={currentGRN.purchaseOrderID}
                                    onChange={e => setCurrentGRN({ ...currentGRN, purchaseOrderID: parseInt(e.target.value) })}
                                >
                                    <option value={0} disabled>Select Purchase Order</option>
                                    {purchaseOrders.filter(po => po.status !== 'Cancelled').map(po => (
                                        <option key={po.purchaseOrderID} value={po.purchaseOrderID}>
                                            #PO-{po.purchaseOrderID} - {po.supplierName || 'Order'} ({new Date(po.orderDate).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select
                                    className="form-input"
                                    required
                                    value={currentGRN.productID}
                                    onChange={e => {
                                        const pId = parseInt(e.target.value);
                                        const po = purchaseOrders.find(p => p.purchaseOrderID === currentGRN.purchaseOrderID);
                                        const poDetail = po?.purchaseOrderDetails?.find((d: any) => d.productID === pId);
                                        setCurrentGRN({
                                            ...currentGRN,
                                            productID: pId,
                                            receivedQuantity: poDetail ? poDetail.orderedQuantity : currentGRN.receivedQuantity
                                        });
                                    }}
                                >
                                    <option value={0} disabled>Select Product</option>
                                    {(() => {
                                        const po = purchaseOrders.find(p => p.purchaseOrderID === currentGRN.purchaseOrderID);
                                        const poProducts = po?.purchaseOrderDetails?.map((d: any) => d.productID) || [];
                                        return products
                                            .filter(p => poProducts.length === 0 || poProducts.includes(p.productID))
                                            .map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>);
                                    })()}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Received Qty</label>
                                    <input type="number" className="form-input" min="1" required value={currentGRN.receivedQuantity} onChange={e => setCurrentGRN({ ...currentGRN, receivedQuantity: parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Damaged Qty</label>
                                    <input type="number" className="form-input" min="0" value={currentGRN.damagedQuantity} onChange={e => setCurrentGRN({ ...currentGRN, damagedQuantity: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Receiving Warehouse</label>
                                <select className="form-input" required value={currentGRN.locationID} onChange={e => setCurrentGRN({ ...currentGRN, locationID: parseInt(e.target.value) })}>
                                    <option value={0} disabled>Select Warehouse</option>
                                    {locations.map(l => <option key={l.locationID} value={l.locationID}>{l.warehouseName}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save GRN</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
