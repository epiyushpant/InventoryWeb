'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

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
            setError(err.message);
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

    return (
        <>
            <LookupTable<Category>
                title="Category Lookup"
                subtitle="Refine your inventory structure with precision."
                addButtonLabel="Add New Category"
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

                        <form onSubmit={handleSubmit}>
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
        </>
    );
}
