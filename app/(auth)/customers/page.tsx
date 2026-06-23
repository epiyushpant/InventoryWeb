'use client';

import { useEffect, useState } from 'react';
import { customersApi } from '@/lib/api';
import { formatAddress } from '@/lib/address';
import LookupTable, { Column } from '@/components/LookupTable';
import AddressSelector from '@/components/AddressSelector';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface Customer {
    customerID: number;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    country?: string;
    billingAddress?: string;
    billingCity?: string;
    billingCountry?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingCountry?: string;
    creditLimit: number;
    pan?: string;
    isActive: boolean;
    shippingSameAsBilling?: boolean;
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
        address: '',
        city: '',
        country: '',
        billingAddress: '',
        billingCity: '',
        billingCountry: '',
        shippingAddress: '',
        shippingCity: '',
        shippingCountry: '',
        creditLimit: 0,
        pan: '',
        isActive: true,
        shippingSameAsBilling: false
    });
    const [showModal, setShowModal] = useState(false);
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

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
        setError('');
        try {
            if (isEditing && currentCustomer.customerID) {
                await customersApi.update(currentCustomer.customerID, currentCustomer);
            } else {
                await customersApi.create(currentCustomer);
            }
            setShowModal(false);
            setCurrentCustomer({ 
                fullName: '', 
                email: '', 
                phone: '', 
                address: '',
                city: '',
                country: '',
                billingAddress: '',
                billingCity: '',
                billingCountry: '',
                shippingAddress: '',
                shippingCity: '',
                shippingCountry: '',
                creditLimit: 0,
                pan: '',
                isActive: true,
                shippingSameAsBilling: false
            });
            setIsEditing(false);
            await loadCustomers();
        } catch (err: any) {
            handleApiError(err);
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
            header: 'Contact Info',
            render: (c) => (
                <div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{c.fullName}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{c.email || 'No email'}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{c.phone || 'No phone'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>PAN: <code style={{ color: 'var(--primary)' }}>{c.pan || '—'}</code></p>
                </div>
            ),
        },
        {
            header: 'Billing Address',
            render: (c) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {formatAddress(c.billingAddress, c.billingCity, c.billingCountry) || 'Not set'}
                </span>
            ),
        },
        {
            header: 'Shipping Address',
            render: (c) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {formatAddress(c.shippingAddress, c.shippingCity, c.shippingCountry) || 'Not set'}
                </span>
            ),
        },
        {
            header: 'Account',
            render: (c) => (
                <div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Rs. {c.creditLimit?.toLocaleString()}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{c.isActive ? 'Active' : 'Inactive'}</p>
                </div>
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
                    setCurrentCustomer({ 
                        fullName: '', 
                        email: '', 
                        phone: '', 
                        address: '',
                        city: '',
                        country: '',
                        billingAddress: '',
                        billingCity: '',
                        billingCountry: '',
                        shippingAddress: '',
                        shippingCity: '',
                        shippingCountry: '',
                        creditLimit: 0,
                        isActive: true,
                        shippingSameAsBilling: false
                    });
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
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Customer' : 'Add Customer'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage customer profile details.</p>
                        </div>

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-grid form-grid-3">
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
                            
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Credit Limit (Rs.)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={currentCustomer.creditLimit}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, creditLimit: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PAN Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="9-digit PAN"
                                        value={currentCustomer.pan}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, pan: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', marginBottom: '0.5rem' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 1rem 0' }}>Billing Address</p>
                                <AddressSelector
                                    country={currentCustomer.billingCountry}
                                    city={currentCustomer.billingCity}
                                    address={currentCustomer.billingAddress}
                                    onChange={(updates) => setCurrentCustomer({
                                        ...currentCustomer,
                                        billingCountry: updates.country,
                                        billingCity: updates.city,
                                        billingAddress: updates.address,
                                    })}
                                />
                            </div>

                            {/* Shipping Address */}
                            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', marginBottom: '0.5rem' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 1rem 0' }}>Shipping Address</p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <input
                                        type="checkbox"
                                        id="shipSame"
                                        className="checkbox-input"
                                        checked={!!currentCustomer.shippingSameAsBilling}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setCurrentCustomer({
                                                ...currentCustomer,
                                                shippingSameAsBilling: checked,
                                                shippingCountry: checked ? currentCustomer.billingCountry : '',
                                                shippingCity: checked ? currentCustomer.billingCity : '',
                                                shippingAddress: checked ? currentCustomer.billingAddress : ''
                                            });
                                        }}
                                    />
                                    <label htmlFor="shipSame" className="form-label" style={{ marginBottom: 0 }}>Shipping same as Billing</label>
                                </div>

                                {currentCustomer.shippingSameAsBilling ? (
                                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatAddress(currentCustomer.shippingAddress || currentCustomer.billingAddress, currentCustomer.shippingCity || currentCustomer.billingCity, currentCustomer.shippingCountry || currentCustomer.billingCountry) || 'Not set'}</p>
                                    </div>
                                ) : (
                                    <AddressSelector
                                        country={currentCustomer.shippingCountry}
                                        city={currentCustomer.shippingCity}
                                        address={currentCustomer.shippingAddress}
                                        onChange={(updates) => setCurrentCustomer({
                                            ...currentCustomer,
                                            shippingCountry: updates.country,
                                            shippingCity: updates.city,
                                            shippingAddress: updates.address,
                                        })}
                                    />
                                )}
                            </div>

                            <div className="form-row-inline">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="checkbox-input"
                                    checked={currentCustomer.isActive}
                                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0 }}>Active Customer</label>
                            </div>
                            
                            <FormErrors errors={validationErrors} />

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
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
