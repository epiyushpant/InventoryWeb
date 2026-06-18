'use client';

import { useEffect, useState } from 'react';
import { salesApi, customersApi, productsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useRouter } from 'next/navigation';

interface SaleDetail {
    productID: number;
    orderedQuantity: number;
    unitPrice: number;
    discount?: number;
}

interface Sale {
    saleID: number;
    customerID?: number;
    totalAmount: number;
    saleDate?: string;
    status?: string;
    saleDetails?: SaleDetail[];
}

interface Customer {
    customerID: number;
    fullName: string;
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentSale, setCurrentSale] = useState<Partial<Sale>>({
        customerID: 0,
        totalAmount: 0,
        status: 'Pending',
        saleDate: new Date().toISOString().split('T')[0],
        saleDetails: []
    });
    const [showModal, setShowModal] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [salesData, customersData, productsData] = await Promise.all([
                salesApi.getAll(),
                customersApi.getAll(),
                productsApi.getAll()
            ]);
            setSales(salesData || []);
            setCustomers(customersData || []);
            setProducts(productsData || []);

            if (customersData?.length > 0 && currentSale.customerID === 0) {
                setCurrentSale(prev => ({ ...prev, customerID: customersData[0].customerID }));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadSales = async () => {
        try {
            const data = await salesApi.getAll();
            setSales(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
                    const saleToSave = { ...currentSale };
        delete saleToSave.totalAmount;
            if (isEditing && currentSale.saleID) {
                await salesApi.update(currentSale.saleID, saleToSave);
            } else {
                await salesApi.create(saleToSave);
            }
            setShowModal(false);
            setCurrentSale({
                customerID: customers.length > 0 ? customers[0].customerID : 0,
                totalAmount: 0,
                status: 'Pending',
                saleDate: new Date().toISOString().split('T')[0]
            });
            setIsEditing(false);
            await loadSales();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const sku = barcodeInput.trim();
            if (!sku) return;

            const product = products.find(p => p.sku === sku);
            
            if (product) {
                const existingIndex = (currentSale.saleDetails || []).findIndex((d: any) => d.productID === product.productID);
                const newDetails = [...(currentSale.saleDetails || [])];
                
                if (existingIndex > -1) {
                    newDetails[existingIndex].orderedQuantity += 1;
                } else {
                    newDetails.push({ 
                        productID: product.productID, 
                        orderedQuantity: 1, 
                        unitPrice: product.unitPrice, 
                        discount: 0 
                    });
                }
                setCurrentSale({ ...currentSale, saleDetails: newDetails });
                setBarcodeInput('');
            } else {
                alert(`Product with SKU "${sku}" not found.`);
                setBarcodeInput('');
            }
        }
    };


    const handleEdit = (sale: Sale) => {
        const editSale = { ...sale };
        if (editSale.saleDate && editSale.saleDate.includes('T')) {
            editSale.saleDate = editSale.saleDate.split('T')[0];
        }
        setCurrentSale(editSale);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (sale: Sale) => {
        if (!confirm('Are you sure you want to delete this sale record?')) return;
        try {
            await salesApi.delete(sale.saleID);
            await loadSales();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getCustomerName = (id?: number) => {
        if (!id) return 'Walk-in Customer';
        const c = customers.find(x => x.customerID === id);
        return c ? c.fullName : 'Unknown';
    };

    const router = useRouter();
    const columns: Column<Sale>[] = [
        {
            header: 'Order Ref',
            render: (sale) => (
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                    #SO-{sale.saleID}
                </code>
            ),
        },
        {
            header: 'Customer & Date',
            render: (sale) => (
                <div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                        {getCustomerName(sale.customerID)}
                    </p>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'Date N/A'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Status',
            render: (sale) => (
                <span style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    backgroundColor: sale.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: sale.status === 'Completed' ? 'var(--secondary)' : '#f59e0b'
                }}>
                    {sale.status || 'Pending'}
                </span>
            ),
        },
        {
            header: 'Total Amount',
            render: (sale) => (
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)' }}>
                    Rs. {sale.totalAmount?.toFixed(2)}
                </span>
            ),
        },
        {
            header: 'Details',
            render: (sale) => (
                <button
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    onClick={() => router.push(`/sales-details?saleId=${sale.saleID}`)}
                >
                    View Details
                </button>
            ),
        },
    ];

    return (
        <>
            <LookupTable<Sale>
                title="Sales Overview"
                subtitle="Track revenue, volume, and customer transactions."
                addButtonLabel="Record New Sale"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentSale({
                        customerID: customers.length > 0 ? customers[0].customerID : 0,
                        totalAmount: 0,
                        status: 'Pending',
                        saleDate: new Date().toISOString().split('T')[0]
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={sales}
                keyField="saleID"
                loading={loading}
                error={error}
                loadingText="Loading Sales..."
                emptyTitle="No Sales Found"
                emptyText="Record a new transaction to see your data."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>
                                {isEditing ? `Edit Sale #SO-${currentSale.saleID}` : 'Record Transaction'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Log a new sale in the system.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Customer</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentSale.customerID || 0}
                                        onChange={(e) => setCurrentSale({ ...currentSale, customerID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Customer</option>
                                        {customers.map(c => (
                                            <option key={c.customerID} value={c.customerID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
                                                {c.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Sale</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={currentSale.saleDate}
                                        onChange={(e) => setCurrentSale({ ...currentSale, saleDate: e.target.value })}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>🚀 Barcode / SKU Quick Scan</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Scan barcode or type SKU and press Enter..."
                                        value={barcodeInput}
                                        onChange={(e) => setBarcodeInput(e.target.value)}
                                        onKeyDown={handleBarcodeScan}
                                        autoFocus
                                        style={{ border: '2px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Line Items</h3>
                                    <button 
                                        type="button" 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                        onClick={() => {
                                            const firstProduct = products[0];
                                            const newItem = { productID: firstProduct?.productID || 0, orderedQuantity: 1, unitPrice: firstProduct?.unitPrice || 0, discount: 0 };
                                            setCurrentSale({ ...currentSale, saleDetails: [...(currentSale.saleDetails || []), newItem] });
                                        }}
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem' }}>
                                    {(currentSale.saleDetails || []).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No items added yet. Click "+ Add Item" to begin.</p>
                                    ) : (
                                        currentSale.saleDetails?.map((item: any, index) => (
                                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '1rem', marginBottom: '1rem', alignItems: 'end' }}>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Product</label>
                                                    <select
                                                        className="form-input"
                                                        value={item.productID}
                                                        onChange={(e) => {
                                                            const pId = parseInt(e.target.value);
                                                            const p = products.find(x => x.productID === pId);
                                                            const newDetails = [...(currentSale.saleDetails || [])];
                                                            newDetails[index] = { ...item, productID: pId, unitPrice: p?.unitPrice || item.unitPrice };
                                                            setCurrentSale({ ...currentSale, saleDetails: newDetails });
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    >
                                                        {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
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
                                                            const newDetails = [...(currentSale.saleDetails || [])];
                                                            newDetails[index] = { ...item, orderedQuantity: parseInt(e.target.value) || 0 };
                                                            setCurrentSale({ ...currentSale, saleDetails: newDetails });
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Price</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={item.unitPrice}
                                                        onChange={(e) => {
                                                            const newDetails = [...(currentSale.saleDetails || [])];
                                                            newDetails[index] = { ...item, unitPrice: parseFloat(e.target.value) || 0 };
                                                            setCurrentSale({ ...currentSale, saleDetails: newDetails });
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Disc</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={item.discount || 0}
                                                        onChange={(e) => {
                                                            const newDetails = [...(currentSale.saleDetails || [])];
                                                            newDetails[index] = { ...item, discount: parseFloat(e.target.value) || 0 };
                                                            setCurrentSale({ ...currentSale, saleDetails: newDetails });
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        const newDetails = (currentSale.saleDetails || []).filter((_, i) => i !== index);
                                                        setCurrentSale({ ...currentSale, saleDetails: newDetails });
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
                                        value={currentSale.status}
                                        onChange={(e) => setCurrentSale({ ...currentSale, status: e.target.value })}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'grid', gap: '0.35rem' }}>
                                    <label className="form-label">Estimated Total</label>
                                    <div className="form-input" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                                        Rs. {(currentSale.saleDetails || []).reduce((sum, item) => sum + (item.orderedQuantity * item.unitPrice) - (item.discount || 0), 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Update Records' : 'Save Transaction')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
