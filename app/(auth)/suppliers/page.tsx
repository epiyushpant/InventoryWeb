'use client';

import { useEffect, useState } from 'react';
import { suppliersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface Supplier {
    supplierID: number;
    supplierName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
}

const columns: Column<Supplier>[] = [
    {
        header: 'Supplier Name',
        render: (sup) => <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sup.supplierName}</span>,
    },
    {
        header: 'Contact Person',
        render: (sup) => <span>{sup.contactPerson || '-'}</span>,
    },
    {
        header: 'Email',
        render: (sup) => sup.email ? <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{sup.email}</code> : <span style={{ opacity: 0.3 }}>-</span>,
    },
    {
        header: 'Phone',
        render: (sup) => <span>{sup.phone || <span style={{ opacity: 0.3 }}>-</span>}</span>,
    },
    {
        header: 'Address',
        render: (sup) => <span>{sup.address || <span style={{ opacity: 0.3 }}>-</span>}</span>,
    },
    {
        header: 'City',
        render: (sup) => <span>{sup.city || <span style={{ opacity: 0.3 }}>-</span>}</span>,
    },
    {
        header: 'Country',
        render: (sup) => <span>{sup.country || <span style={{ opacity: 0.3 }}>-</span>}</span>,
    },
];

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({ 
        supplierName: '', 
        contactPerson: '', 
        email: '', 
        phone: '',
        address: '',
        city: '',
        country: ''
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            const data = await suppliersApi.getAll();
            setSuppliers(data);
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
            if (isEditing && currentSupplier.supplierID) {
                await suppliersApi.update(currentSupplier.supplierID, currentSupplier);
            } else {
                await suppliersApi.create(currentSupplier);
            }
            setShowModal(false);
            setCurrentSupplier({ supplierName: '', contactPerson: '', email: '', phone: '', address: '', city: '', country: '' });
            setIsEditing(false);
            await loadSuppliers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setCurrentSupplier(supplier);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (sup: Supplier) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await suppliersApi.delete(sup.supplierID);
            await loadSuppliers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <>
            <LookupTable<Supplier>
                title="Supplier Lookup"
                subtitle="Manage your supplier and vendor network."
                addButtonLabel="Add New Supplier"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentSupplier({ supplierName: '', contactPerson: '', email: '', phone: '', address: '', city: '', country: '' });
                    setShowModal(true);
                }}
                columns={columns}
                data={suppliers}
                keyField="supplierID"
                loading={loading}
                error={error}
                loadingText="Loading Suppliers..."
                emptyTitle="No Suppliers Found"
                emptyText="Add your first supplier to get started."
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
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Supplier' : 'New Supplier'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Update your supplier database.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Company Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Acme Corporation"
                                        required
                                        value={currentSupplier.supplierName}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, supplierName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Person</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. John Doe"
                                        value={currentSupplier.contactPerson}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, contactPerson: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="contact@acme.com"
                                        value={currentSupplier.email}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="+1 (555) 000-0000"
                                        value={currentSupplier.phone}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="123 Main St"
                                    value={currentSupplier.address}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="New York"
                                        value={currentSupplier.city}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, city: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="USA"
                                        value={currentSupplier.country}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, country: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Create Supplier')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
