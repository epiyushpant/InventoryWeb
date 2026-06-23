'use client';

import { useEffect, useState } from 'react';
import { purchaseOrderDetailsApi, purchaseOrdersApi, productsApi, suppliersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface PurchaseOrderDetail {
    poDetailID: number;
    purchaseOrderID: number;
    productID: number;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
    subtotal?: number; // Might be derived or stored
}

interface PurchaseOrder {
    purchaseOrderID: number;
    supplierID: number;
    totalAmount: number;
}

interface Product {
    productID: number;
    productName: string;
    unitPrice: number;
    supplierID?: number;
}

interface Supplier {
    supplierID: number;
    supplierName: string;
}

export default function PurchaseOrderDetailsPage() {
    const [orderDetails, setOrderDetails] = useState<PurchaseOrderDetail[]>([]);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

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
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

    useEffect(() => {
        loadInitialData();
    }, []);

    const mapOrderDetail = (detail: any): PurchaseOrderDetail => ({
        poDetailID: detail.poDetailID ?? detail.PODetailID,
        purchaseOrderID: detail.purchaseOrderID ?? detail.PurchaseOrderID,
        productID: detail.productID ?? detail.ProductID,
        quantity: detail.quantity ?? detail.Quantity ?? 0,
        unitPrice: detail.unitPrice ?? detail.UnitCost ?? detail.unitCost ?? 0,
        subtotal: detail.subtotal ?? detail.Subtotal ?? (detail.quantity ?? detail.Quantity ?? 0) * (detail.unitPrice ?? detail.UnitCost ?? detail.unitCost ?? 0),
    });

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [detailsData, ordersData, productsData, suppliersData] = await Promise.all([
                purchaseOrderDetailsApi.getAll(),
                purchaseOrdersApi.getAll(),
                productsApi.getAll(),
                suppliersApi.getAll()
            ]);
            const mappedDetailsData = detailsData?.map(mapOrderDetail) || [];
            setOrderDetails(mappedDetailsData);
            setOrders(ordersData || []);
            setProducts(productsData || []);
            setSuppliers(suppliersData || []);

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
            const mappedData = data?.map(mapOrderDetail) || [];
            setOrderDetails(mappedData);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getSelectedOrder = () => orders.find(o => o.purchaseOrderID === currentDetail.purchaseOrderID);

    const handleProductChange = (productId: number) => {
        const prod = products.find(p => p.productID === productId);
        setCurrentDetail(prev => ({
            ...prev,
            productID: productId,
            unitPrice: prod ? prod.unitPrice : prev.unitPrice
        }));
    };

    const getOrderSubtotalForSelectedOrder = () => {
        return orderDetails
            .filter(d => d.purchaseOrderID === currentDetail.purchaseOrderID && d.poDetailID !== currentDetail.poDetailID)
            .reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const detailSubtotal = (currentDetail.quantity || 0) * (currentDetail.unitPrice || 0);
            const selectedOrder = getSelectedOrder();

            if (selectedOrder && selectedOrder.totalAmount !== undefined) {
                const existingSubtotal = getOrderSubtotalForSelectedOrder();
                // Only validate when the selected PO total represents a preset limit,
                // not when it is the current sum of existing details.
                if (selectedOrder.totalAmount > existingSubtotal && existingSubtotal + detailSubtotal > selectedOrder.totalAmount) {
                    setError(`The line subtotal exceeds the selected purchase order total of Rs. ${selectedOrder.totalAmount.toFixed(2)}.`);
                    setLoading(false);
                    return;
                }
            }

            // Map frontend fields to backend model fields
            const detailToSave = {
                PODetailID: currentDetail.poDetailID,
                PurchaseOrderID: currentDetail.purchaseOrderID,
                ProductID: currentDetail.productID,
                Quantity: currentDetail.quantity,
                UnitCost: currentDetail.unitPrice,
            };

            if (isEditing && currentDetail.poDetailID) {
                await purchaseOrderDetailsApi.update(currentDetail.poDetailID, detailToSave);
            } else {
                await purchaseOrderDetailsApi.create(detailToSave);
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
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (detail: PurchaseOrderDetail) => {
        setError('');
        setCurrentDetail(detail);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (detail: PurchaseOrderDetail) => {
        if (!confirm('Are you sure you want to delete this purchase order detail?')) return;
        try {
            await purchaseOrderDetailsApi.delete(detail.poDetailID);
            await loadDetails();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getProductName = (id: number) => products.find(p => p.productID === id)?.productName || 'Unknown';
    const getSupplierNameForPO = (poId: number) => {
        const order = orders.find(o => o.purchaseOrderID === poId);
        if (!order) return 'Unknown';
        return suppliers.find(s => s.supplierID === order.supplierID)?.supplierName || 'Unknown';
    };

    const columns: Column<PurchaseOrderDetail>[] = [
        {
            header: 'PO Detail ID',
            render: (d) => (
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>POD-{d.poDetailID}</code>
            ),
        },
        {
            header: 'Supplier',
            render: (d) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {getSupplierNameForPO(d.purchaseOrderID)}
                </span>
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
            header: 'Unit Cost',
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
                    setError('');
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
                keyField="poDetailID"
                loading={loading}
                error={error}
                loadingText="Loading Purchase Order Details..."
                emptyTitle="No Details Found"
                emptyText="Add line items to your purchase orders here."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Detail' : 'Add Detail Line'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure products and quantities for a purchase order.</p>
                        </div>

                        {error && (
                            <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-grid form-grid-2">
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
                                            <option key={o.purchaseOrderID} value={o.purchaseOrderID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>PO-{o.purchaseOrderID} (Total: Rs. {o.totalAmount?.toFixed(2) || '0.00'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'grid', gap: '0.35rem' }}>
                                    <label className="form-label">Current PO Total</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={getSelectedOrder()?.totalAmount?.toFixed(2) ?? '0.00'}
                                        readOnly
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        Total is computed from order details.
                                    </small>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Product</label>
                                <select
                                    className="form-input"
                                    required
                                    value={currentDetail.productID}
                                    onChange={(e) => handleProductChange(parseInt(e.target.value))}
                                    style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                >
                                    <option value={0} disabled>Select a Product</option>
                                    {products
                                        .filter(p => {
                                            const selectedOrder = getSelectedOrder();
                                            return !selectedOrder || p.supplierID === selectedOrder.supplierID;
                                        })
                                        .map(p => (
                                            <option key={p.productID} value={p.productID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>{p.productName}</option>
                                        ))}
                                </select>
                            </div>
                            
                            <div className="form-grid form-grid-2">
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
                                    <label className="form-label">Unit Cost (Rs.)</label>
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

                            <FormErrors errors={validationErrors} />
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
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
