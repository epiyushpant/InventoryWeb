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
    taxVatNumber?: string;
    paymentTerms?: string;
    isActive: boolean;
}

const columns: Column<Supplier>[] = [
    {
        header: 'Supplier Name',
        render: (sup) => (
            <div>
                <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{sup.supplierName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Tax ID: {sup.taxVatNumber || 'N/A'}</p>
            </div>
        ),
    },
    {
        header: 'Contact',
        render: (sup) => (
            <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{sup.contactPerson || '-'}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{sup.phone}</p>
            </div>
        ),
    },
    {
        header: 'Payment Terms',
        render: (sup) => <span style={{ fontSize: '0.9rem' }}>{sup.paymentTerms || <span style={{ opacity: 0.3 }}>-</span>}</span>,
    },
    {
        header: 'Location',
        render: (sup) => <span style={{ fontSize: '0.9rem' }}>{sup.city}, {sup.country}</span>,
    },
    {
        header: 'Status',
        render: (sup) => (
            <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '100px',
                background: sup.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: sup.isActive ? 'var(--secondary)' : 'var(--error)',
                fontWeight: 700,
                border: sup.isActive ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                {sup.isActive ? 'Active' : 'Inactive'}
            </span>
        ),
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
        country: '',
        taxVatNumber: '',
        paymentTerms: '',
        isActive: true
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
            setCurrentSupplier({ 
                supplierName: '', 
                contactPerson: '', 
                email: '', 
                phone: '', 
                address: '', 
                city: '', 
                country: '',
                taxVatNumber: '',
                paymentTerms: '',
                isActive: true
            });
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
                    setCurrentSupplier({ 
                supplierName: '', 
                contactPerson: '', 
                email: '', 
                phone: '', 
                address: '', 
                city: '', 
                country: '',
                taxVatNumber: '',
                paymentTerms: '',
                isActive: true
            });
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Tax / VAT Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. VAT123456789"
                                        value={currentSupplier.taxVatNumber}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, taxVatNumber: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment Terms</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Net 30"
                                        value={currentSupplier.paymentTerms}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, paymentTerms: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    style={{ width: '20px', height: '20px' }}
                                    checked={currentSupplier.isActive}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0 }}>Active Supplier</label>
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
