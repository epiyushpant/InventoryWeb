'use client';

import { useEffect, useState } from 'react';
import { purchaseOrderDetailsApi, purchaseOrdersApi, productsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface PurchaseOrderDetail {
    purchaseOrderDetailID: number;
    purchaseOrderID: number;
    productID: number;
    quantity: number;
    unitPrice: number;
    subtotal?: number; // Might be derived or stored
}

interface PurchaseOrder {
    purchaseOrderID: number;
    totalAmount: number;
    // other fields omitted...
}

interface Product {
    productID: number;
    productName: string;
    unitPrice: number;
}

export default function PurchaseOrderDetailsPage() {
    const [orderDetails, setOrderDetails] = useState<PurchaseOrderDetail[]>([]);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentDetail, setCurrentDetail] = useState<Partial<PurchaseOrderDetail>>({
        purchaseOrderID: 0,
        productID: 0,
        quantity: 1,
        unitPrice: 0
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [detailsData, ordersData, productsData] = await Promise.all([
                purchaseOrderDetailsApi.getAll(),
                purchaseOrdersApi.getAll(),
                productsApi.getAll()
            ]);
            setOrderDetails(detailsData || []);
            setOrders(ordersData || []);
            setProducts(productsData || []);

            if (ordersData?.length > 0 && currentDetail.purchaseOrderID === 0) {
                setCurrentDetail(prev => ({ ...prev, purchaseOrderID: ordersData[0].purchaseOrderID }));
            }
            if (productsData?.length > 0 && currentDetail.productID === 0) {
                setCurrentDetail(prev => ({ ...prev, productID: productsData[0].productID, unitPrice: productsData[0].unitPrice }));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadDetails = async () => {
        try {
            const data = await purchaseOrderDetailsApi.getAll();
            setOrderDetails(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleProductChange = (productId: number) => {
        const prod = products.find(p => p.productID === productId);
        setCurrentDetail(prev => ({
            ...prev,
            productID: productId,
            unitPrice: prod ? prod.unitPrice : prev.unitPrice
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing && currentDetail.purchaseOrderDetailID) {
                await purchaseOrderDetailsApi.update(currentDetail.purchaseOrderDetailID, currentDetail);
            } else {
                await purchaseOrderDetailsApi.create(currentDetail);
            }
            setShowModal(false);
            setCurrentDetail({
                purchaseOrderID: orders.length > 0 ? orders[0].purchaseOrderID : 0,
                productID: products.length > 0 ? products[0].productID : 0,
                quantity: 1,
                unitPrice: products.length > 0 ? products[0].unitPrice : 0
            });
            setIsEditing(false);
            await loadDetails();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (detail: PurchaseOrderDetail) => {
        setCurrentDetail(detail);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (detail: PurchaseOrderDetail) => {
        if (!confirm('Are you sure you want to delete this purchase order detail?')) return;
        try {
            await purchaseOrderDetailsApi.delete(detail.purchaseOrderDetailID);
            await loadDetails();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getProductName = (id: number) => products.find(p => p.productID === id)?.productName || 'Unknown';

    const columns: Column<PurchaseOrderDetail>[] = [
        {
            header: 'PO Detail ID',
            render: (d) => (
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>POD-{d.purchaseOrderDetailID}</code>
            ),
        },
        {
            header: 'PO ID',
            render: (d) => (
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    PO-{d.purchaseOrderID}
                </span>
            ),
        },
        {
            header: 'Product',
            render: (d) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {getProductName(d.productID)}
                </span>
            ),
        },
        {
            header: 'Quantity',
            render: (d) => (
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {d.quantity}
                </span>
            ),
        },
        {
            header: 'Unit Price',
            render: (d) => (
                <span style={{ fontWeight: 500, color: 'var(--secondary)' }}>
                    Rs. {d.unitPrice?.toFixed(2) || '0.00'}
                </span>
            ),
        },
        {
            header: 'Subtotal',
            render: (d) => {
                const subtotal = d.subtotal ?? (d.quantity * d.unitPrice);
                return (
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        Rs. {subtotal.toFixed(2)}
                    </span>
                );
            },
        },
    ];

    return (
        <>
            <LookupTable<PurchaseOrderDetail>
                title="Purchase Order Details"
                subtitle="Manage line items for purchase orders."
                addButtonLabel="Add Detail Line"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentDetail({
                        purchaseOrderID: orders.length > 0 ? orders[0].purchaseOrderID : 0,
                        productID: products.length > 0 ? products[0].productID : 0,
                        quantity: 1,
                        unitPrice: products.length > 0 ? products[0].unitPrice : 0
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={orderDetails}
                keyField="purchaseOrderDetailID"
                loading={loading}
                error={error}
                loadingText="Loading Purchase Order Details..."
                emptyTitle="No Details Found"
                emptyText="Add line items to your purchase orders here."
                onEdit={handleEdit}
                onDelete={handleDelete}
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
                    <div className="auth-card glass animate-fade" style={{ maxWidth: '800px', width: '100%', padding: '3.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Detail' : 'Add Detail Line'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure products and quantities for a purchase order.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Purchase Order ID</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentDetail.purchaseOrderID}
                                        onChange={(e) => setCurrentDetail({ ...currentDetail, purchaseOrderID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Purchase Order</option>
                                        {orders.map(o => (
                                            <option key={o.purchaseOrderID} value={o.purchaseOrderID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>PO-{o.purchaseOrderID} (Total: Rs. {o.totalAmount})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Product</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentDetail.productID}
                                        onChange={(e) => handleProductChange(parseInt(e.target.value))}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Product</option>
                                        {products.map(p => (
                                            <option key={p.productID} value={p.productID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>{p.productName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-input"
                                        placeholder="1"
                                        required
                                        value={currentDetail.quantity === undefined ? '' : currentDetail.quantity}
                                        onChange={(e) => setCurrentDetail({ ...currentDetail, quantity: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Unit Price (Rs.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        placeholder="0.00"
                                        required
                                        value={currentDetail.unitPrice === undefined ? '' : currentDetail.unitPrice}
                                        onChange={(e) => setCurrentDetail({ ...currentDetail, unitPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'right' }}>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Automatic Subtotal</p>
                                <p style={{ margin: 0, color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                                    Rs. {((currentDetail.quantity || 0) * (currentDetail.unitPrice || 0)).toFixed(2)}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Details' : 'Add Detail Line')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
