'use client';

import React from 'react';

export interface Column<T> {
    header: string;
    render: (item: T) => React.ReactNode;
}

export interface LookupTableProps<T> {
    title: string;
    subtitle: string;
    addButtonLabel: string;
    onAdd: () => void;
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    loading: boolean;
    error: string;
    loadingText?: string;
    emptyTitle?: string;
    emptyText?: string;
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
}

export default function LookupTable<T>({
    title,
    subtitle,
    addButtonLabel,
    onAdd,
    columns,
    data,
    keyField,
    loading,
    error,
    loadingText = 'Loading...',
    emptyTitle = 'No Records Found',
    emptyText = 'Create your first record to get started.',
    onEdit,
    onDelete,
}: LookupTableProps<T>) {
    const totalColumns = columns.length + 1; // +1 for Actions

    return (
        <div className="animate-fade" style={{ paddingTop: '1rem' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '3rem',
                padding: '0 1rem'
            }}>
                <div>
                    <h1 className="auth-title" style={{ fontSize: '3rem', margin: 0 }}>{title}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        {subtitle}
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ height: 'fit-content', padding: '1rem 2rem' }}
                    onClick={onAdd}
                >
                    <span style={{ fontSize: '1.2rem' }}>+</span> {addButtonLabel}
                </button>
            </header>

            {error && (
                <div className="glass" style={{
                    margin: '0 1rem 2rem',
                    padding: '1.25rem',
                    color: 'var(--error)',
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.05)'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span> {error}
                </div>
            )}

            <div className="glass" style={{ borderRadius: '28px', overflow: 'hidden', margin: '0 1rem', padding: '0.5rem' }}>
                <table className="premium-table">
                    <thead>
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={col.header}
                                    style={i === 0 ? { borderRadius: '20px 0 0 0' } : undefined}
                                >
                                    {col.header}
                                </th>
                            ))}
                            <th style={{ textAlign: 'right', borderRadius: '0 20px 0 0' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && data.length === 0 ? (
                            <tr><td colSpan={totalColumns} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div className="animate-pulse" style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', opacity: 0.5 }}></div>
                                    {loadingText}
                                </div>
                            </td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={totalColumns} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{emptyTitle}</p>
                                {emptyText}
                            </td></tr>
                        ) : (
                            data.map((item) => (
                                <tr key={String(item[keyField])}>
                                    {columns.map((col) => (
                                        <td key={col.header}>{col.render(item)}</td>
                                    ))}
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.6rem 1.25rem', borderRadius: '10px' }}
                                                onClick={() => onEdit(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                                                onClick={() => onDelete(item)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
