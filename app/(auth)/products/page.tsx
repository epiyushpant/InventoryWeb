'use client';

import { useEffect, useState } from 'react';
import { productsApi, categoriesApi, suppliersApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface Product {
    productID: number;
    productName: string;
    categoryID: number;
    supplierID: number;
    sku?: string;
    description?: string;
    unitOfMeasure?: string;
    costPrice: number;
    unitPrice: number; // Selling Price
    reorderLevel?: number;
    isActive: boolean;
}

interface Category {
    categoryID: number;
    categoryName: string;
}

interface Supplier {
    supplierID: number;
    supplierName: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
        productName: '',
        categoryID: 0,
        supplierID: 0,
        sku: '',
        description: '',
        unitOfMeasure: 'PCS',
        costPrice: 0,
        unitPrice: 0,
        reorderLevel: 0,
        isActive: true
    });
    const [showModal, setShowModal] = useState(false);
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [productsData, categoriesData, suppliersData] = await Promise.all([
                productsApi.getAll(),
                categoriesApi.getAll(),
                suppliersApi.getAll()
            ]);
            setProducts(productsData || []);
            setCategories(categoriesData || []);
            setSuppliers(suppliersData || []);

            if (categoriesData?.length > 0 && currentProduct.categoryID === 0) {
                setCurrentProduct(prev => ({ ...prev, categoryID: categoriesData[0].categoryID }));
            }
            if (suppliersData?.length > 0 && currentProduct.supplierID === 0) {
                setCurrentProduct(prev => ({ ...prev, supplierID: suppliersData[0].supplierID }));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await productsApi.getAll();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isEditing && currentProduct.productID) {
                await productsApi.update(currentProduct.productID, currentProduct);
            } else {
                await productsApi.create(currentProduct);
            }
            setShowModal(false);
            setCurrentProduct({
                productName: '',
                categoryID: categories.length > 0 ? categories[0].categoryID : 0,
                supplierID: suppliers.length > 0 ? suppliers[0].supplierID : 0,
                sku: '',
                description: '',
                unitOfMeasure: 'PCS',
                costPrice: 0,
                unitPrice: 0,
                reorderLevel: 0,
                isActive: true
            });
            setIsEditing(false);
            await loadProducts();
        } catch (err: any) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setCurrentProduct(product);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (product: Product) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await productsApi.delete(product.productID);
            await loadProducts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getCategoryName = (id: number) => categories.find(c => c.categoryID === id)?.categoryName || 'Unknown';
    const getSupplierName = (id: number) => suppliers.find(s => s.supplierID === id)?.supplierName || 'Unknown';

    const columns: Column<Product>[] = [
        {
            header: 'Product Name',
            render: (p) => (
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{p.productName}</p>
            ),
        },
        {
            header: 'SKU',
            render: (p) => (
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>{p.sku || '-'}</code>
            ),
        },
        {
            header: 'Category',
            render: (p) => (
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {getCategoryName(p.categoryID)}
                </span>
            ),
        },
        {
            header: 'Supplier',
            render: (p) => (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {getSupplierName(p.supplierID)}
                </span>
            ),
        },
        {
            header: 'Unit / UOM',
            render: (p) => (
                <span style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-main)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    {p.unitOfMeasure || 'PCS'}
                </span>
            ),
        },
        {
            header: 'Pricing',
            render: (p) => (
                <div>
                    <p style={{ fontWeight: 600, color: 'var(--secondary)', margin: 0 }}>
                        Sell: Rs. {p.unitPrice?.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        Cost: Rs. {p.costPrice?.toFixed(2)}
                    </p>
                </div>
            ),
        },
        {
            header: 'Inventory',
            render: (p) => (
                <div>
                    <p style={{ fontWeight: 600, margin: 0, color: p.reorderLevel && p.reorderLevel > 0 ? 'var(--text-main)' : 'var(--error)' }}>
                        Min: {p.reorderLevel || 0}
                    </p>
                </div>
            ),
        },
        {
            header: 'Status',
            render: (p) => (
                <span style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    backgroundColor: p.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: p.isActive ? 'var(--secondary)' : 'var(--error)',
                    display: 'inline-block'
                }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    return (
        <>
            <LookupTable<Product>
                title="Product Catalog"
                subtitle="Manage product offerings, categories, and supplier linkages."
                addButtonLabel="Add New Product"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentProduct({
                        productName: '',
                        categoryID: categories.length > 0 ? categories[0].categoryID : 0,
                        supplierID: suppliers.length > 0 ? suppliers[0].supplierID : 0,
                        sku: '',
                        description: '',
                        unitOfMeasure: 'PCS',
                        costPrice: 0,
                        unitPrice: 0,
                        reorderLevel: 0,
                        isActive: true
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={products}
                keyField="productID"
                loading={loading}
                error={error}
                loadingText="Loading Products..."
                emptyTitle="No Products Found"
                emptyText="Create your first product to get started."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure product details, category, and supplier matching.</p>
                        </div>

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Mechanical Keyboard"
                                        required
                                        value={currentProduct.productName}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, productName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">SKU</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. KBD-001"
                                        value={currentProduct.sku}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Product description..."
                                    style={{ resize: 'none' }}
                                    value={currentProduct.description}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                />
                            </div>

                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentProduct.categoryID}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, categoryID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Category</option>
                                        {categories.map(c => (
                                            <option key={c.categoryID} value={c.categoryID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>{c.categoryName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Supplier</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentProduct.supplierID}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, supplierID: parseInt(e.target.value) })}
                                        style={{ appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--primary) 50%), linear-gradient(135deg, var(--primary) 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                                    >
                                        <option value={0} disabled>Select a Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.supplierID} value={s.supplierID} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>{s.supplierName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid form-grid-3">
                                <div className="form-group">
                                    <label className="form-label">UOM</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentProduct.unitOfMeasure}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, unitOfMeasure: e.target.value })}
                                    >
                                        <option value="PCS">PCS</option>
                                        <option value="KG">KG</option>
                                        <option value="LTR">LTR</option>
                                        <option value="BOX">BOX</option>
                                        <option value="PKT">PKT</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cost Price (Rs.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        placeholder="0.00"
                                        required
                                        value={currentProduct.costPrice}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, costPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Selling Price (Rs.)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        placeholder="0.00"
                                        required
                                        value={currentProduct.unitPrice}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        placeholder="10"
                                        required
                                        value={currentProduct.reorderLevel === undefined ? '' : currentProduct.reorderLevel}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, reorderLevel: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={currentProduct.isActive !== false}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, isActive: e.target.checked })}
                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="isActive" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Is Active</label>
                                </div>
                            </div>
                            
                            <FormErrors errors={validationErrors} />

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Details' : 'Create Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
