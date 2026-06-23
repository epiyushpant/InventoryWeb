'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

const BUSINESS_TEMPLATES: Record<string, string[]> = {
    'Restaurant / Cafe': ['Food', 'Beverages', 'Spices', 'Ingredients', 'Utensils', 'Packaging', 'Dairy Products', 'Meat & Poultry', 'Seafood', 'Bakery & Desserts'],
    'Hardware / Tools': ['Tools', 'Plumbing', 'Electrical', 'Paints', 'Construction Materials', 'Safety Gear', 'Fasteners', 'Adhesives & Sealants', 'Sanitary Ware', 'Timber & Wood'],
    'Mobile Accessories': ['Chargers', 'Cases & Covers', 'Screen Protectors', 'Earphones', 'Cables', 'Power Banks', 'Memory Cards', 'Stands & Holders', 'Bluetooth Speakers', 'Smartwatches'],
    'Import / Export': ['Electronics', 'Clothing', 'Machineries', 'Raw Materials', 'Cosmetics', 'Vehicles', 'Metals', 'Chemicals', 'Textiles', 'Agricultural Products'],
    'Grocery / Kirana': ['Rice & Grains', 'Pulses', 'Oils', 'Snacks', 'Toiletries', 'Dairy', 'Spices', 'Beverages', 'Cleaning Supplies', 'Canned Goods'],
    'Clothing / Boutique': ['Men\'s Wear', 'Women\'s Wear', 'Kids\' Wear', 'Footwear', 'Accessories', 'Activewear', 'Innerwear', 'Winterwear', 'Traditional Wear', 'Bags & Wallets'],
    'Pharmacy / Medical Store': ['Medicines', 'Surgical Items', 'Supplements', 'First Aid', 'Personal Care', 'Baby Care', 'Medical Devices', 'Ayurvedic', 'Veterinary Products', 'Hygiene Products'],
    'Stationery / Books': ['Books', 'Notebooks', 'Writing Instruments', 'Office Supplies', 'Art Supplies', 'Paper Products', 'School Supplies', 'Diaries & Planners', 'Calculators', 'Files & Folders'],
    'Electronics & Appliances': ['Televisions', 'Refrigerators', 'Washing Machines', 'Kitchen Appliances', 'Cooling & Heating', 'Audio Systems', 'Computers & Laptops', 'Cameras', 'Personal Care Appliances', 'Gaming Consoles'],
    'Furniture': ['Beds & Mattresses', 'Sofas & Seating', 'Tables', 'Storage & Wardrobes', 'Office Furniture', 'Decor', 'Dining Furniture', 'Outdoor Furniture', 'Kids Furniture', 'Shelving'],
    'Auto Parts / Garage': ['Engine Parts', 'Tyres & Wheels', 'Lubricants & Oils', 'Batteries', 'Car Accessories', 'Bike Parts', 'Brake Systems', 'Filters', 'Suspension', 'Electrical Parts'],
    'Cosmetics / Beauty Shop': ['Makeup', 'Skincare', 'Haircare', 'Fragrances', 'Beauty Tools', 'Nail Care', 'Bath & Body', 'Men\'s Grooming', 'Sunscreens', 'Gift Sets']
};

interface Category {
    categoryID: number;
    categoryName: string;
    description?: string;
    parentCategoryID?: number;
    parentCategory?: Category;
    isActive: boolean;
    createdDate: string;
}

const columns: Column<Category>[] = [
    {
        header: 'Category Name',
        render: (cat) => (
            <div>
                <p className="form-title" style={{ fontSize: '1rem', fontWeight: 600 }}>{cat.categoryName}</p>
                {cat.parentCategory && (
                    <p className="text-muted-small" style={{ opacity: 0.8 }}>
                        Parent: {cat.parentCategory.categoryName}
                    </p>
                )}
            </div>
        ),
    },
    {
        header: 'Description',
        render: (cat) => (
            <p className="text-muted-small" style={{ margin: 0 }}>
                {cat.description || <span style={{ opacity: 0.3 }}>No description.</span>}
            </p>
        ),
    },
    {
        header: 'Status',
        render: (cat) => (
            <span className={`badge-pill ${cat.isActive ? 'active' : 'inactive'}`}>
                {cat.isActive ? 'Active' : 'Inactive'}
            </span>
        ),
    },
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ 
        categoryName: '', 
        description: '',
        parentCategoryID: undefined,
        isActive: true
    });
    const [showModal, setShowModal] = useState(false);

    const [selectedCategoriesList, setSelectedCategoriesList] = useState<Category[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
    const [selectedCategoriesToImport, setSelectedCategoriesToImport] = useState<string[]>([]);
    const [excludedCategories, setExcludedCategories] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

    useEffect(() => {
        const cats = new Set<string>();
        selectedBusinesses.forEach(biz => {
            BUSINESS_TEMPLATES[biz]?.forEach(c => cats.add(c));
        });
        setSelectedCategoriesToImport(Array.from(cats));
    }, [selectedBusinesses]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoriesApi.getAll();
            setCategories(data);
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
            if (isEditing && currentCategory.categoryID) {
                await categoriesApi.update(currentCategory.categoryID, currentCategory);
            } else {
                await categoriesApi.create(currentCategory);
            }
            setShowModal(false);
            setCurrentCategory({ 
                categoryName: '', 
                description: '',
                parentCategoryID: undefined,
                isActive: true
            });
            setIsEditing(false);
            await loadCategories();
        } catch (err: any) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category: Category) => {
        setCurrentCategory(category);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (cat: Category) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await categoriesApi.delete(cat.categoryID);
            await loadCategories();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleMultiDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedCategoriesList.length} categories?`)) return;
        try {
            setLoading(true);
            for (const cat of selectedCategoriesList) {
                await categoriesApi.delete(cat.categoryID);
            }
            setSelectedCategoriesList([]);
            await loadCategories();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImportTemplates = async () => {
        const categoriesToImport = selectedCategoriesToImport.filter(c => !excludedCategories.has(c));
        if (categoriesToImport.length === 0) return;
        setIsImporting(true);
        setError('');
        try {
            for (const catName of categoriesToImport) {
                const exists = categories.some(c => c.categoryName.toLowerCase() === catName.toLowerCase());
                if (!exists) {
                    await categoriesApi.create({ categoryName: catName, isActive: true, description: `Imported for ${selectedBusinesses.join(', ')}` });
                }
            }
            setShowTemplateModal(false);
            setSelectedBusinesses([]);
            setExcludedCategories(new Set());
            await loadCategories();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <>
            <LookupTable<Category>
                title="Category Lookup"
                subtitle="Refine your inventory structure with precision."
                addButtonLabel="Add New Category"
                selectable={true}
                selectedItems={selectedCategoriesList}
                onSelectionChange={setSelectedCategoriesList}
                extraHeaderActions={
                    <>
                        {selectedCategoriesList.length > 0 && (
                            <button
                                className="btn btn-secondary"
                                style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                                onClick={handleMultiDelete}
                            >
                                Delete Selected ({selectedCategoriesList.length})
                            </button>
                        )}
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setSelectedBusinesses([]);
                                setExcludedCategories(new Set());
                                setShowTemplateModal(true);
                            }}
                        >
                            Load Templates
                        </button>
                    </>
                }
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentCategory({ 
                        categoryName: '', 
                        description: '',
                        parentCategoryID: undefined,
                        isActive: true
                    });
                    setShowModal(true);
                }}
                columns={columns}
                data={categories}
                keyField="categoryID"
                loading={loading}
                error={error}
                loadingText="Loading Categories..."
                emptyTitle="No Categories Found"
                emptyText="Create your first category to get started."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card">
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title modal-title">{isEditing ? 'Edit Category' : 'New Category'}</h2>
                            <p className="modal-description">Configure the classification for your inventory assets.</p>
                        </div>

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Category Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Electronics"
                                        required
                                        value={currentCategory.categoryName}
                                        onChange={(e) => setCurrentCategory({ ...currentCategory, categoryName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Parent Category (Optional)</label>
                                    <select
                                        className="form-input"
                                        value={currentCategory.parentCategoryID || ''}
                                        onChange={(e) => setCurrentCategory({ ...currentCategory, parentCategoryID: e.target.value ? parseInt(e.target.value) : undefined })}
                                    >
                                        <option value="">None (Top Level)</option>
                                        {categories.filter(c => c.categoryID !== currentCategory.categoryID).map(c => (
                                            <option key={c.categoryID} value={c.categoryID}>{c.categoryName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Describe this category..."
                                    value={currentCategory.description}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                                />
                            </div>
                            <div className="form-row-inline">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="checkbox-input"
                                    checked={currentCategory.isActive}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0 }}>Active Category</label>
                            </div>
                            
                            <FormErrors errors={validationErrors} />

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Create Category')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTemplateModal && (
                <div className="modal-backdrop">
                    <div className="auth-card glass animate-fade modal-card" style={{ maxWidth: '600px' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 className="auth-title modal-title">Load Templates</h2>
                            <p className="modal-description">Select your business types to automatically generate related categories.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>1. Select Business Types</label>
                            <div className="form-grid form-grid-2" style={{ gap: '0.75rem' }}>
                                {Object.keys(BUSINESS_TEMPLATES).map(biz => (
                                    <div key={biz} className="form-row-inline" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <input
                                            type="checkbox"
                                            id={`biz-${biz.replace(/[^a-zA-Z]/g, '')}`}
                                            className="checkbox-input"
                                            checked={selectedBusinesses.includes(biz)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedBusinesses(prev => [...prev, biz]);
                                                } else {
                                                    setSelectedBusinesses(prev => prev.filter(b => b !== biz));
                                                }
                                            }}
                                        />
                                        <label htmlFor={`biz-${biz.replace(/[^a-zA-Z]/g, '')}`} className="form-label" style={{ marginBottom: 0, cursor: 'pointer', flex: 1, userSelect: 'none' }}>{biz}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedBusinesses.length > 0 && (
                            <div className="form-group" style={{ marginTop: '2rem' }}>
                                <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>2. Categories to Import (Click to toggle)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    {selectedCategoriesToImport.length > 0 ? selectedCategoriesToImport.map(cat => {
                                        const isExcluded = excludedCategories.has(cat);
                                        return (
                                            <span 
                                                key={cat} 
                                                className={`badge-pill ${isExcluded ? 'inactive' : 'active'}`} 
                                                style={{ fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', opacity: isExcluded ? 0.5 : 1, textDecoration: isExcluded ? 'line-through' : 'none' }}
                                                onClick={() => {
                                                    setExcludedCategories(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(cat)) next.delete(cat);
                                                        else next.add(cat);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {cat} {isExcluded ? '❌' : '✓'}
                                            </span>
                                        );
                                    }) : <span className="text-muted-small">No categories found.</span>}
                                </div>
                            </div>
                        )}

                        <div className="form-actions" style={{ marginTop: '2.5rem' }}>
                            <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary btn-block" disabled={isImporting || selectedCategoriesToImport.filter(c => !excludedCategories.has(c)).length === 0} onClick={handleImportTemplates}>
                                {isImporting ? 'Importing...' : `Import ${selectedCategoriesToImport.filter(c => !excludedCategories.has(c)).length} Categories`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
