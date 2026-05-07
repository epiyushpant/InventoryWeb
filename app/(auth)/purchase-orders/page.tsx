'use client';

import { useEffect, useState } from 'react';
import { purchaseOrdersApi, suppliersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface PurchaseOrder {
    purchaseOrderID: number;
    supplierID: number;
    orderDate: string;
    totalAmount: number;
    status: string;
}

interface Supplier {
    supplierID: number;
    supplierName: string;
}

export default function PurchaseOrdersPage() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Partial<PurchaseOrder>>({
        supplierID: 0,
        orderDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        status: 'Pending'
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [ordersData, suppliersData] = await Promise.all([
                purchaseOrdersApi.getAll(),
                suppliersApi.getAll()
            ]);
            setPurchaseOrders(ordersData || []);
            setSuppliers(suppliersData || []);

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
            let orderToSave = { ...currentOrder };
            // Ensure date is properly formatted if needed by backend, though YYYY-MM-DD from input type="date" usually works
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
                status: 'Pending'
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
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>PO-{o.purchaseOrderID}</code>
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
                        status: 'Pending'
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
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure purchase order details.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Total Amount (Rs.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        placeholder="0.00"
                                        required
                                        value={currentOrder.totalAmount}
                                        onChange={(e) => setCurrentOrder({ ...currentOrder, totalAmount: parseFloat(e.target.value) })}
                                    />
                                </div>
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
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
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
