'use client';

import { useEffect, useState } from 'react';
import { saleDetailsApi, salesApi, productsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface SaleDetail {
    saleDetailID: number;
    saleID: number;
    productID: number;
    quantity: number;
    unitPrice: number;
    subtotal?: number;
}

interface Sale {
    saleID: number;
    customerName?: string;
    totalAmount: number;
}

interface Product {
    productID: number;
    productName: string;
    unitPrice: number;
}

export default function SaleDetailsPage() {
    const [saleDetails, setSaleDetails] = useState<SaleDetail[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentDetail, setCurrentDetail] = useState<Partial<SaleDetail>>({
        saleID: 0,
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
            const [detailsData, salesData, productsData] = await Promise.all([
                saleDetailsApi.getAll(),
                salesApi.getAll(),
                productsApi.getAll()
            ]);
            setSaleDetails(detailsData || []);
            setSales(salesData || []);
            setProducts(productsData || []);

            if (salesData?.length > 0 && currentDetail.saleID === 0) {
                setCurrentDetail(prev => ({ ...prev, saleID: salesData[0].saleID }));
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
            const data = await saleDetailsApi.getAll();
            setSaleDetails(data);
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
            if (isEditing && currentDetail.saleDetailID) {
                await saleDetailsApi.update(currentDetail.saleDetailID, currentDetail);
            } else {
                await saleDetailsApi.create(currentDetail);
            }
            setShowModal(false);
            setCurrentDetail({
                saleID: sales.length > 0 ? sales[0].saleID : 0,
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

    const handleEdit = (detail: SaleDetail) => {
        setCurrentDetail(detail);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (detail: SaleDetail) => {
        if (!confirm('Are you sure you want to delete this sale detail?')) return;
        try {
            await saleDetailsApi.delete(detail.saleDetailID);
            await loadDetails();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getProductName = (id: number) => products.find(p => p.productID === id)?.productName || 'Unknown';

    const columns: Column<SaleDetail>[] = [
        {
            header: 'Sale Detail ID',
            render: (d) => (
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>SD-{d.saleDetailID}</code>
            ),
        },
        {
            header: 'Sale ID',
            render: (d) => (
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    SALE-{d.saleID}
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
            <LookupTable<SaleDetail>
                title="Sale Details"
                subtitle="Manage line items for sales."
                addButtonLabel="Add Detail Line"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentDetail({
                        saleID: sales.length > 0 ? sales[0].saleID : 0,
                        productID: products.length > 0 ? products[0].productID : 0,
                        quantity: 1,
                        unitPrice: products.length > 0 ? products[0].unitPrice : 0
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={saleDetails}
                keyField="saleDetailID"
                loading={loading}
                error={error}
                loadingText="Loading Sale Details..."
                emptyTitle="No Details Found"
                emptyText="Add line items to your sales here."
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
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure products and quantities for a sale.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Sale</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentDetail.saleID}
                                        onChange={(e) => setCurrentDetail({ ...currentDetail, saleID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Sale</option>
                                        {sales.map(s => (
                                            <option key={s.saleID} value={s.saleID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>SALE-{s.saleID} ({s.customerName || 'Walk-in'})</option>
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
