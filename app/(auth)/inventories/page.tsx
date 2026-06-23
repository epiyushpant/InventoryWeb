'use client';

import { useEffect, useState } from 'react';
import { inventoriesApi, productsApi, locationsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface Inventory {
    inventoryID: number;
    productID: number;
    quantityOnHand: number;
    reservedQuantity: number;
    availableQuantity: number;
    locationID: number;
    lastUpdated: string;
}

interface Product {
    productID: number;
    productName: string;
    sku?: string;
}

interface Location {
    locationID: number;
    warehouseName: string;
    city: string;
    country: string;
}

export default function InventoriesPage() {
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentInventory, setCurrentInventory] = useState<Partial<Inventory>>({ 
        productID: 0, 
        quantityOnHand: 0, 
        reservedQuantity: 0,
        availableQuantity: 0,
        locationID: 0 
    });
    const [showModal, setShowModal] = useState(false);
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [inventoriesData, productsData, locationsData] = await Promise.all([
                inventoriesApi.getAll(),
                productsApi.getAll(),
                locationsApi.getAll()
            ]);
            setInventories(inventoriesData || []);
            setProducts(productsData || []);
            setLocations(locationsData || []);

            const initialLoc = locationsData?.length > 0 ? locationsData[0].locationID : 0;
            const initialProd = productsData?.length > 0 ? productsData[0].productID : 0;

            if (currentInventory.productID === 0) {
                setCurrentInventory(prev => ({ ...prev, productID: initialProd, locationID: initialLoc }));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadInventories = async () => {
        try {
            const data = await inventoriesApi.getAll();
            setInventories(data);
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
                ...currentInventory,
                lastUpdated: new Date().toISOString()
            };

            if (isEditing && currentInventory.inventoryID) {
                await inventoriesApi.update(currentInventory.inventoryID, payload);
            } else {
                await inventoriesApi.create(payload);
            }
            setShowModal(false);
            setCurrentInventory({ 
                productID: products.length > 0 ? products[0].productID : 0, 
                quantityOnHand: 0, 
                reservedQuantity: 0,
                availableQuantity: 0,
                locationID: locations.length > 0 ? locations[0].locationID : 0 
            });
            setIsEditing(false);
            await loadInventories();
        } catch (err: any) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (inventory: Inventory) => {
        setCurrentInventory(inventory);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (item: Inventory) => {
        if (!confirm('Are you sure you want to delete this inventory record?')) return;
        try {
            await inventoriesApi.delete(item.inventoryID);
            await loadInventories();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getProduct = (id: number) => products.find(p => p.productID === id);
    const getLocationName = (id?: number) => {
        if (!id) return 'Not Specified';
        const loc = locations.find(l => l.locationID === id);
        return loc ? `${loc.warehouseName} (${loc.city})` : 'Unknown';
    };

    const columns: Column<Inventory>[] = [
        {
            header: 'Product',
            render: (item) => {
                const product = getProduct(item.productID);
                return (
                    <div>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                            {product?.productName || 'Unknown Product'}
                        </p>
                        {product?.sku && (
                            <code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>SKU: {product.sku}</code>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Location',
            render: (item) => (
                <span style={{ fontSize: '0.9rem', color: item.locationID ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {getLocationName(item.locationID)}
                </span>
            ),
        },
        {
            header: 'Stock Quantities',
            render: (item) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', minWidth: '300px' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>On Hand</p>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{item.quantityOnHand}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Reserved</p>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>{item.reservedQuantity}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Available</p>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: item.availableQuantity > 0 ? 'var(--secondary)' : 'var(--error)', margin: 0 }}>{item.availableQuantity}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Last Updated',
            render: (item) => (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'Never'}
                </span>
            ),
        },
    ];

    return (
        <>
            <LookupTable<Inventory>
                title="Inventory Lookup"
                subtitle="Track and manage your inventory assets based on active products."
                addButtonLabel="Add Inventory Record"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentInventory({ 
                        productID: products.length > 0 ? products[0].productID : 0, 
                        quantityOnHand: 0, 
                        reservedQuantity: 0,
                        availableQuantity: 0,
                        locationID: locations.length > 0 ? locations[0].locationID : 0 
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={inventories}
                keyField="inventoryID"
                loading={loading}
                error={error}
                loadingText="Loading Inventory..."
                emptyTitle="No Inventory Found"
                emptyText="Add your first inventory record to begin tracking."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Inventory' : 'New Inventory Record'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Update stock levels and location for products.</p>
                        </div>

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select
                                    className="form-input"
                                    required
                                    value={currentInventory.productID || 0}
                                    onChange={(e) => setCurrentInventory({ ...currentInventory, productID: parseInt(e.target.value) })}
                                    style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                >
                                    <option value={0} disabled>Select a Product</option>
                                    {products.map(p => (
                                        <option key={p.productID} value={p.productID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
                                            {p.productName} {p.sku ? `(${p.sku})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">On Hand</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        required
                                        value={currentInventory.quantityOnHand ?? 0}
                                        onChange={(e) => setCurrentInventory({ ...currentInventory, quantityOnHand: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reserved</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        required
                                        value={currentInventory.reservedQuantity ?? 0}
                                        onChange={(e) => setCurrentInventory({ ...currentInventory, reservedQuantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Available</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        required
                                        value={currentInventory.availableQuantity ?? 0}
                                        onChange={(e) => setCurrentInventory({ ...currentInventory, availableQuantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location / Warehouse</label>
                                <select
                                    className="form-input"
                                    required
                                    value={currentInventory.locationID || 0}
                                    onChange={(e) => setCurrentInventory({ ...currentInventory, locationID: parseInt(e.target.value) })}
                                    style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                >
                                    <option value={0} disabled>Select a Warehouse</option>
                                    {locations.map(l => (
                                        <option key={l.locationID} value={l.locationID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
                                            {l.warehouseName} ({l.city})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <FormErrors errors={validationErrors} />
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Details' : 'Save Record')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
