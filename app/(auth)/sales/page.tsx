'use client';

import { useEffect, useState } from 'react';
import { salesApi, customersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface Sale {
    saleID: number;
    customerID?: number;
    totalAmount: number;
    saleDate?: string;
    status?: string;
}

interface Customer {
    customerID: number;
    fullName: string;
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentSale, setCurrentSale] = useState<Partial<Sale>>({
        customerID: 0,
        totalAmount: 0,
        status: 'Pending',
        saleDate: new Date().toISOString().split('T')[0]
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [salesData, customersData] = await Promise.all([
                salesApi.getAll(),
                customersApi.getAll()
            ]);
            setSales(salesData || []);
            setCustomers(customersData || []);

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
            if (isEditing && currentSale.saleID) {
                await salesApi.update(currentSale.saleID, currentSale);
            } else {
                await salesApi.create(currentSale);
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

    const columns: Column<Sale>[] = [
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
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="auth-card glass animate-fade" style={{ maxWidth: '600px', width: '100%', padding: '3.5rem' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Transaction' : 'Record Transaction'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Log a new sale in the system.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                                <div className="form-group">
                                    <label className="form-label">Total Amount (Rs.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        placeholder="0.00"
                                        required
                                        value={currentSale.totalAmount === undefined ? '' : currentSale.totalAmount}
                                        onChange={(e) => setCurrentSale({ ...currentSale, totalAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date of Sale</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    required
                                    value={currentSale.saleDate}
                                    onChange={(e) => setCurrentSale({ ...currentSale, saleDate: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
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
