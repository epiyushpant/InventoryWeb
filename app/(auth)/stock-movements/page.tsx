'use client';

import { useEffect, useState } from 'react';
import { stockMovementsApi, productsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface StockMovement {
    movementID: number;
    productID: number;
    movementType: string;
    quantity: number;
    quantityChange?: number;
    movementDate: string;
    reference?: string;
}

interface Product {
    productID: number;
    productName: string;
}

export default function StockMovementsPage() {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentMovement, setCurrentMovement] = useState<Partial<StockMovement>>({
        productID: 0,
        movementType: 'IN',
        quantity: 1,
        movementDate: new Date().toISOString().split('T')[0],
        reference: ''
    });
    const [showModal, setShowModal] = useState(false);
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [movementsData, productsData] = await Promise.all([
                stockMovementsApi.getAll(),
                productsApi.getAll()
            ]);
            setMovements(movementsData || []);
            setProducts(productsData || []);

            if (productsData?.length > 0 && currentMovement.productID === 0) {
                setCurrentMovement(prev => ({ ...prev, productID: productsData[0].productID }));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadMovements = async () => {
        try {
            const data = await stockMovementsApi.getAll();
            setMovements(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...currentMovement,
                quantityChange: currentMovement.quantity
            };
            if (isEditing && currentMovement.movementID) {
                await stockMovementsApi.update(currentMovement.movementID, payload);
            } else {
                await stockMovementsApi.create(payload);
            }
            setShowModal(false);
            setCurrentMovement({
                productID: products.length > 0 ? products[0].productID : 0,
                movementType: 'IN',
                quantity: 1,
                movementDate: new Date().toISOString().split('T')[0],
                reference: ''
            });
            setIsEditing(false);
            await loadMovements();
        } catch (err: any) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (movement: StockMovement) => {
        const editMovement = { 
            ...movement,
            quantity: movement.quantity ?? movement.quantityChange ?? 1
        };
        if (editMovement.movementDate && editMovement.movementDate.includes('T')) {
            editMovement.movementDate = editMovement.movementDate.split('T')[0];
        } else if (!editMovement.movementDate) {
            editMovement.movementDate = new Date().toISOString().split('T')[0];
        }
        setCurrentMovement(editMovement);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (movement: StockMovement) => {
        if (!confirm('Are you sure you want to delete this stock movement?')) return;
        try {
            await stockMovementsApi.delete(movement.movementID);
            await loadMovements();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getProductName = (id: number) => products.find(p => p.productID === id)?.productName || 'Unknown';

    const columns: Column<StockMovement>[] = [
        {
            header: 'Mvt ID',
            render: (m) => (
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>MVT-{m.movementID}</code>
            ),
        },
        {
            header: 'Product',
            render: (m) => (
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {getProductName(m.productID)}
                </span>
            ),
        },
        {
            header: 'Type',
            render: (m) => {
                const isIn = m.movementType?.toUpperCase() === 'IN';
                return (
                    <span style={{ 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        backgroundColor: isIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isIn ? 'var(--secondary)' : 'var(--error)',
                        display: 'inline-block'
                    }}>
                        {m.movementType?.toUpperCase()}
                    </span>
                );
            },
        },
        {
            header: 'Quantity',
            render: (m) => (
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {m.quantity ?? m.quantityChange}
                </span>
            ),
        },
        {
            header: 'Date',
            render: (m) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {m.movementDate ? new Date(m.movementDate).toLocaleDateString() : '-'}
                </span>
            ),
        },
        {
            header: 'Reference',
            render: (m) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {m.reference || '-'}
                </span>
            ),
        },
    ];

    return (
        <>
            <LookupTable<StockMovement>
                title="Stock Movements"
                subtitle="Track inventory changes (in/out)."
                addButtonLabel="Record Movement"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentMovement({
                        productID: products.length > 0 ? products[0].productID : 0,
                        movementType: 'IN',
                        quantity: 1,
                        movementDate: new Date().toISOString().split('T')[0],
                        reference: ''
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={movements}
                keyField="movementID"
                loading={loading}
                error={error}
                loadingText="Loading Movements..."
                emptyTitle="No Movements Found"
                emptyText="Record your first stock movement."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="glass animate-fade modal-card">
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Movement' : 'Record Movement'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Log a stock addition or deduction.</p>
                        </div>

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Product</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentMovement.productID}
                                        onChange={(e) => setCurrentMovement({ ...currentMovement, productID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Product</option>
                                        {products.map(p => (
                                            <option key={p.productID} value={p.productID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>{p.productName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Movement Type</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentMovement.movementType}
                                        onChange={(e) => setCurrentMovement({ ...currentMovement, movementType: e.target.value })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value="IN" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>IN (Addition)</option>
                                        <option value="OUT" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>OUT (Deduction)</option>
                                    </select>
                                </div>
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
                                        value={currentMovement.quantity === undefined ? '' : currentMovement.quantity}
                                        onChange={(e) => setCurrentMovement({ ...currentMovement, quantity: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Movement Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={currentMovement.movementDate as string}
                                        onChange={(e) => setCurrentMovement({ ...currentMovement, movementDate: e.target.value })}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Reference (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. PO-123 or SALE-456"
                                    value={currentMovement.reference}
                                    onChange={(e) => setCurrentMovement({ ...currentMovement, reference: e.target.value })}
                                />
                            </div>

                            <FormErrors errors={validationErrors} />
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Details' : 'Record Movement')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
