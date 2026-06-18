'use client';

import React, { useMemo, useState, useEffect } from 'react';

export interface Column<T> {
    header: string;
    render: (item: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: string | number;
}

export interface LookupTableProps<T> {
    title: string;
    subtitle: string;
    addButtonLabel?: string;
    onAdd?: () => void;
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    loading: boolean;
    error: string;
    loadingText?: string;
    emptyTitle?: string;
    emptyText?: string;
    editButtonLabel?: string;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    hideActions?: boolean;
    searchable?: boolean;
    searchFields?: (keyof T)[];
    searchPlaceholder?: string;
    filterFunction?: (item: T, term: string) => boolean;
    onFilteredDataChange?: (filteredData: T[]) => void;
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
    editButtonLabel = 'Edit',
    onEdit,
    onDelete,
    hideActions = false,
    searchable = true,
    searchFields,
    searchPlaceholder = 'Search…',
    filterFunction,
    onFilteredDataChange,
}: LookupTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const getTextFromNode = (node: React.ReactNode): string => {
        if (node === null || node === undefined || node === false) return '';
        if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
            return String(node);
        }
        if (Array.isArray(node)) {
            return node.map(getTextFromNode).join(' ');
        }
        if (React.isValidElement(node)) {
            return getTextFromNode(node.props.children);
        }
        return '';
    };

    const filteredData = useMemo(() => {
        if (!searchable || !normalizedSearch) return data;

        return data.filter((item) => {
            if (filterFunction) return filterFunction(item, normalizedSearch);

            const fields = searchFields ?? (Object.keys(item as object) as Array<keyof T>);
            const rawMatch = fields.some((field) => {
                const value = item[field];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(normalizedSearch);
            });

            if (rawMatch) return true;

            const columnText = columns
                .map((col) => getTextFromNode(col.render(item)))
                .join(' ')
                .toLowerCase();

            return columnText.includes(normalizedSearch);
        });
    }, [columns, data, filterFunction, normalizedSearch, searchFields, searchable]);

    useEffect(() => {
        if (onFilteredDataChange) {
            onFilteredDataChange(filteredData);
        }
    }, [filteredData, onFilteredDataChange]);

    const totalColumns = hideActions ? columns.length : columns.length + 1;

    return (
        <div className="animate-fade page-section">
            {(title || subtitle || (onAdd && addButtonLabel)) && (
                <header className="page-header">
                    <div>
                        {title && <h1 className="auth-title page-heading">{title}</h1>}
                        {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    </div>
                    {onAdd && addButtonLabel && (
                        <button
                            className="btn btn-primary btn-wide"
                            onClick={onAdd}
                        >
                            <span style={{ fontSize: '1.2rem' }}>+</span> {addButtonLabel}
                        </button>
                    )}
                </header>
            )}

            {searchable && (
                <div className="table-search">
                    <input
                        type="search"
                        className="search-input"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        aria-label="Search records"
                    />
                </div>
            )}

            {error && (
                <div className="glass alert-card error">
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span> {error}
                </div>
            )}

            <div className="glass table-card table-responsive">
                <table className="premium-table">
                    <thead>
                        <tr>
                            {columns.map((col, i) => (
                                <th
                                    key={col.header}
                                    style={{
                                        width: col.width ? (typeof col.width === 'number' ? `${col.width}px` : col.width) : undefined,
                                        textAlign: col.align || 'left',
                                        borderRadius: i === 0 ? (hideActions ? '20px 0 0 0' : '20px 0 0 0') : (i === columns.length - 1 && hideActions ? '0 20px 0 0' : undefined),
                                    }}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {!hideActions && <th style={{ textAlign: 'center', borderRadius: '0 20px 0 0', width: '200px', minWidth: '200px' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && data.length === 0 ? (
                            <tr><td colSpan={totalColumns} className="empty-state">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div className="animate-pulse" style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', opacity: 0.5 }}></div>
                                    {loadingText}
                                </div>
                            </td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={totalColumns} className="empty-state">
                                <p className="empty-title">No matching records found.</p>
                                <p>{searchTerm ? `Try another search term.` : emptyText}</p>
                            </td></tr>
                        ) : (
                            filteredData.map((item, idx) => (
                                <tr key={String(item[keyField]) || idx}>
                                    {columns.map((col) => (
                                        <td key={col.header} style={{ width: col.width ? (typeof col.width === 'number' ? `${col.width}px` : col.width) : undefined, textAlign: col.align || 'left' }}>{col.render(item)}</td>
                                    ))}
                                    {!hideActions && (
                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap', width: '200px', minWidth: '200px' }}>
                                            <div className="page-actions" style={{ justifyContent: 'center', flexWrap: 'nowrap' }}>
                                                {onEdit && (
                                                    <button
                                                        className="btn btn-secondary btn-small"
                                                        onClick={() => onEdit(item)}
                                                    >
                                                        {editButtonLabel}
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        className="btn btn-secondary btn-small"
                                                        style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                                                        onClick={() => onDelete(item)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
