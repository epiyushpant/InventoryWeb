'use client';

import { useEffect, useState } from 'react';
import { purchaseOrdersApi, suppliersApi, productsApi, purchaseRequisitionsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface PurchaseOrderDetail {
    productID: number;
    orderedQuantity: number;
    unitPrice: number;
}

interface PurchaseOrder {
    purchaseOrderID: number;
    supplierID: number;
    orderDate: string;
    totalAmount: number;
    status: string;
    prid?: number;
    purchaseOrderDetails?: PurchaseOrderDetail[];
}

interface Supplier {
    supplierID: number;
    supplierName: string;
}

export default function PurchaseOrdersPage() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [purchaseRequisitions, setPurchaseRequisitions] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Partial<PurchaseOrder>>({
        supplierID: 0,
        orderDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        status: 'Pending',
        prid: undefined,
        purchaseOrderDetails: []
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [ordersData, suppliersData, productsData, prsData] = await Promise.all([
                purchaseOrdersApi.getAll(),
                suppliersApi.getAll(),
                productsApi.getAll(),
                purchaseRequisitionsApi.getAll()
            ]);
            setPurchaseOrders(ordersData || []);
            setSuppliers(suppliersData || []);
            setProducts(productsData || []);
            setPurchaseRequisitions(prsData || []);

            if (suppliersData?.length > 0 && currentOrder.supplierID === 0) {
                setCurrentOrder(prev => ({ ...prev, supplierID: suppliersData[0].supplierID }));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        try {
            const data = await purchaseOrdersApi.getAll();
            setPurchaseOrders(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Remove totalAmount from the data to send - it will be calculated by backend
            const { totalAmount, ...orderToSave } = currentOrder;
            
            if (isEditing && currentOrder.purchaseOrderID) {
                await purchaseOrdersApi.update(currentOrder.purchaseOrderID, orderToSave);
            } else {
                await purchaseOrdersApi.create(orderToSave);
            }
            setShowModal(false);
            setCurrentOrder({
                supplierID: suppliers.length > 0 ? suppliers[0].supplierID : 0,
                orderDate: new Date().toISOString().split('T')[0],
                totalAmount: 0,
                status: 'Pending',
                prid: undefined
            });
            setIsEditing(false);
            await loadOrders();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (order: PurchaseOrder) => {
        setCurrentOrder({
            ...order,
            orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (order: PurchaseOrder) => {
        if (!confirm('Are you sure you want to delete this purchase order?')) return;
        try {
            await purchaseOrdersApi.delete(order.purchaseOrderID);
            await loadOrders();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getSupplierName = (id: number) => suppliers.find(s => s.supplierID === id)?.supplierName || 'Unknown';

    const columns: Column<PurchaseOrder>[] = [
        {
            header: 'PO ID',
            render: (o) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>PO-{o.purchaseOrderID}</code>
                    {o.prid && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>From #PR-{o.prid}</span>}
                </div>
            ),
        },
        {
            header: 'Supplier',
            render: (o) => (
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {getSupplierName(o.supplierID)}
                </span>
            ),
        },
        {
            header: 'Order Date',
            render: (o) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '-'}
                </span>
            ),
        },
        {
            header: 'Total Amount',
            render: (o) => (
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                    Rs. {o.totalAmount?.toFixed(2) || '0.00'}
                </span>
            ),
        },
        {
            header: 'Status',
            render: (o) => {
                let color = 'var(--text-main)';
                let bg = 'rgba(255, 255, 255, 0.1)';
                if (o.status?.toLowerCase() === 'completed' || o.status?.toLowerCase() === 'received') {
                    color = 'var(--secondary)';
                    bg = 'rgba(16, 185, 129, 0.1)';
                } else if (o.status?.toLowerCase() === 'pending') {
                    color = '#f59e0b';
                    bg = 'rgba(245, 158, 11, 0.1)';
                } else if (o.status?.toLowerCase() === 'cancelled') {
                    color = 'var(--error)';
                    bg = 'rgba(239, 68, 68, 0.1)';
                }

                return (
                    <span style={{ 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        backgroundColor: bg,
                        color: color,
                        display: 'inline-block'
                    }}>
                        {o.status || 'Pending'}
                    </span>
                );
            },
        },
    ];

    return (
        <>
            <LookupTable<PurchaseOrder>
                title="Purchase Orders"
                subtitle="Manage purchase orders from suppliers."
                addButtonLabel="Create Purchase Order"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentOrder({
                        supplierID: suppliers.length > 0 ? suppliers[0].supplierID : 0,
                        orderDate: new Date().toISOString().split('T')[0],
                        totalAmount: 0,
                        status: 'Pending',
                        prid: undefined,
                        purchaseOrderDetails: []
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={purchaseOrders}
                keyField="purchaseOrderID"
                loading={loading}
                error={error}
                loadingText="Loading Purchase Orders..."
                emptyTitle="No Purchase Orders Found"
                emptyText="Create your first purchase order to get started."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure purchase order details.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Purchase Requisition (Optional)</label>
                                    <select
                                        className="form-input"
                                        value={currentOrder.prid || ''}
                                        onChange={(e) => {
                                            const prId = parseInt(e.target.value);
                                            const pr = purchaseRequisitions.find(x => x.prid === prId);
                                            const update: Partial<PurchaseOrder> = { prid: prId || undefined };
                                            
                                            // If auto-filling from PR
                                            if (pr && (!currentOrder.purchaseOrderDetails || currentOrder.purchaseOrderDetails.length === 0)) {
                                                const prod = products.find(p => p.productID === pr.productID);
                                                update.purchaseOrderDetails = [{
                                                    productID: pr.productID,
                                                    orderedQuantity: pr.quantity,
                                                    unitPrice: prod?.unitPrice || 0
                                                }];
                                            }
                                            setCurrentOrder({ ...currentOrder, ...update });
                                        }}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value="">Independent Order</option>
                                        {purchaseRequisitions.filter(pr => pr.status === 'Approved' || pr.status === 'Pending' || pr.prid === currentOrder.prid).map(pr => (
                                            <option key={pr.prid} value={pr.prid} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
                                                #PR-{pr.prid} - {products.find(p => p.productID === pr.productID)?.productName} ({pr.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Order Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={currentOrder.orderDate as string}
                                        onChange={(e) => setCurrentOrder({ ...currentOrder, orderDate: e.target.value })}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Supplier</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentOrder.supplierID}
                                        onChange={(e) => setCurrentOrder({ ...currentOrder, supplierID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.supplierID} value={s.supplierID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>{s.supplierName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Line Items</h3>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                        onClick={() => {
                                            const filteredProducts = products.filter(p => p.supplierID === currentOrder.supplierID);
                                            const firstProduct = filteredProducts[0] || products[0];
                                            const newItem = { productID: firstProduct?.productID || 0, orderedQuantity: 1, unitPrice: firstProduct?.unitPrice || 0 };
                                            setCurrentOrder({ ...currentOrder, purchaseOrderDetails: [...(currentOrder.purchaseOrderDetails || []), newItem] });
                                        }}
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem' }}>
                                    {(currentOrder.purchaseOrderDetails || []).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No items added yet. Click "+ Add Item" to begin.</p>
                                    ) : (
                                        currentOrder.purchaseOrderDetails?.map((item, index) => (
                                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '1rem', marginBottom: '1rem', alignItems: 'end' }}>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Product</label>
                                                    <select
                                                        className="form-input"
                                                        value={item.productID}
                                                        onChange={(e) => {
                                                            const pId = parseInt(e.target.value);
                                                            const p = products.find(x => x.productID === pId);
                                                            const newDetails = [...(currentOrder.purchaseOrderDetails || [])];
                                                            newDetails[index] = { ...item, productID: pId, unitPrice: p?.unitPrice || item.unitPrice };
                                                            setCurrentOrder({ ...currentOrder, purchaseOrderDetails: newDetails });
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    >
                                                        {products
                                                            .filter(p => p.supplierID === currentOrder.supplierID)
                                                            .map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)
                                                        }
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        min="1"
                                                        value={item.orderedQuantity}
                                                        onChange={(e) => {
                                                            const newDetails = [...(currentOrder.purchaseOrderDetails || [])];
                                                            newDetails[index] = { ...item, orderedQuantity: parseInt(e.target.value) || 0 };
                                                            setCurrentOrder({ ...currentOrder, purchaseOrderDetails: newDetails });
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Cost</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={item.unitPrice}
                                                        onChange={(e) => {
                                                            const newDetails = [...(currentOrder.purchaseOrderDetails || [])];
                                                            newDetails[index] = { ...item, unitPrice: parseFloat(e.target.value) || 0 };
                                                            setCurrentOrder({ ...currentOrder, purchaseOrderDetails: newDetails });
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        const newDetails = (currentOrder.purchaseOrderDetails || []).filter((_, i) => i !== index);
                                                        setCurrentOrder({ ...currentOrder, purchaseOrderDetails: newDetails });
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentOrder.status}
                                        onChange={(e) => setCurrentOrder({ ...currentOrder, status: e.target.value })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value="Pending" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>Pending</option>
                                        <option value="Completed" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>Completed</option>
                                        <option value="Cancelled" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>Cancelled</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'grid', gap: '0.35rem' }}>
                                    <label className="form-label">Estimated Total</label>
                                    <div className="form-input" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                                        Rs. {(currentOrder.purchaseOrderDetails || []).reduce((sum, item) => sum + (item.orderedQuantity * item.unitPrice), 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Details' : 'Create Order')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
