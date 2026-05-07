'use client';

import { useEffect, useState } from 'react';
import { inventoriesApi, productsApi, locationsApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface Inventory {
    inventoryID: number;
    productID: number;
    quantityInStock: number;
    locationID?: number;
    lastUpdated?: string;
}

interface Product {
    productID: number;
    productName: string;
    sku?: string;
}

interface Location {
    locationID: number;
    name: string;
    type: string;
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
        quantityInStock: 0, 
        locationID: 0 
    });
    const [showModal, setShowModal] = useState(false);

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

            let initialLoc = locationsData?.length > 0 ? locationsData[0].locationID : 0;
            let initialProd = productsData?.length > 0 ? productsData[0].productID : 0;

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
                quantityInStock: 0, 
                locationID: locations.length > 0 ? locations[0].locationID : 0 
            });
            setIsEditing(false);
            await loadInventories();
        } catch (err: any) {
            setError(err.message);
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
        return loc ? loc.name : 'Unknown';
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
            header: 'Quantity In Stock',
            render: (item) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: item.quantityInStock > 10 ? 'var(--secondary)' : 'var(--error)'
                    }}>
                        {item.quantityInStock}
                    </span>
                    <div style={{
                        height: '6px',
                        width: '60px',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(item.quantityInStock, 100)}%`,
                            background: item.quantityInStock > 10 ? 'var(--secondary)' : 'var(--error)',
                            boxShadow: `0 0 8px ${item.quantityInStock > 10 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                        }}></div>
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
                        quantityInStock: 0, 
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
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Inventory' : 'New Inventory Record'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Update stock levels and location for products.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity In Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        placeholder="0"
                                        required
                                        value={currentInventory.quantityInStock === undefined ? '' : currentInventory.quantityInStock}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCurrentInventory({ 
                                                ...currentInventory, 
                                                quantityInStock: val === '' ? 0 : parseInt(val) 
                                            });
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentInventory.locationID || 0}
                                        onChange={(e) => setCurrentInventory({ ...currentInventory, locationID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Location</option>
                                        {locations.map(l => (
                                            <option key={l.locationID} value={l.locationID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
                                                {l.name} ({l.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
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
