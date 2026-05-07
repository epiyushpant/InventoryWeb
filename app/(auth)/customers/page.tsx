'use client';

import { useEffect, useState } from 'react';
import { customersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface Customer {
    customerID: number;
    fullName: string;
    email: string;
    phone: string;
    address: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({
        fullName: '',
        email: '',
        phone: '',
        address: ''
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await customersApi.getAll();
            setCustomers(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing && currentCustomer.customerID) {
                await customersApi.update(currentCustomer.customerID, currentCustomer);
            } else {
                await customersApi.create(currentCustomer);
            }
            setShowModal(false);
            setCurrentCustomer({ fullName: '', email: '', phone: '', address: '' });
            setIsEditing(false);
            await loadCustomers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (customer: Customer) => {
        setCurrentCustomer(customer);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (customer: Customer) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await customersApi.delete(customer.customerID);
            await loadCustomers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const columns: Column<Customer>[] = [
        {
            header: 'Customer Name',
            render: (c) => (
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{c.fullName}</p>
            ),
        },
        {
            header: 'Email / Phone',
            render: (c) => (
                <div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{c.email || '-'}</span>
                    <br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.phone || '-'}</span>
                </div>
            ),
        },
        {
            header: 'Address',
            render: (c) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{c.address || '-'}</span>
            ),
        }
    ];

    return (
        <>
            <LookupTable<Customer>
                title="Customer Management (CRM)"
                subtitle="Track contact info and accounts for your clients."
                addButtonLabel="Add New Customer"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentCustomer({ fullName: '', email: '', phone: '', address: '' });
                    setShowModal(true);
                }}
                columns={columns}
                data={customers}
                keyField="customerID"
                loading={loading}
                error={error}
                loadingText="Loading Customers..."
                emptyTitle="No Customers Found"
                emptyText="Add your first customer to get started."
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
                    <div className="auth-card glass animate-fade" style={{ maxWidth: '600px', width: '100%', padding: '3.5rem' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Customer' : 'Add Customer'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage customer profile details.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={currentCustomer.fullName}
                                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, fullName: e.target.value })}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={currentCustomer.email}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={currentCustomer.phone}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={currentCustomer.address}
                                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
