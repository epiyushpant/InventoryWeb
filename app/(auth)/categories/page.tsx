'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api';
import LookupTable, { Column } from '@/components/LookupTable';

interface Category {
    categoryID: number;
    categoryName: string;
    description?: string;
}

const columns: Column<Category>[] = [
    {
        header: 'Category Name',
        render: (cat) => (
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{cat.categoryName}</p>
        ),
    },
    {
        header: 'Description',
        render: (cat) => (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                {cat.description || <span style={{ opacity: 0.3 }}>No description provided.</span>}
            </p>
        ),
    },
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ categoryName: '', description: '' });
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
            setCurrentCategory({ categoryName: '', description: '' });
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
                    setCurrentCategory({ categoryName: '', description: '' });
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
                    <div className="auth-card glass animate-fade" style={{ maxWidth: '600px', padding: '3.5rem' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Category' : 'New Category'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Configure the classification for your inventory assets.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
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
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    placeholder="Describe this category..."
                                    style={{ resize: 'none' }}
                                    value={currentCategory.description}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} disabled={loading}>
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
