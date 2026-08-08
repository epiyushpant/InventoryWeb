'use client';

import React, { useMemo, useState, useEffect } from 'react';

export interface Column<T> {
    header: string;
    render: (item: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: string | number;
    /** Tabular-nums styling for figures. */
    numeric?: boolean;
    /** Set false to opt out of header sorting. */
    sortable?: boolean;
    /** Explicit sort key; falls back to the rendered text. */
    sortValue?: (item: T) => string | number | null | undefined;
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
    extraHeaderActions?: React.ReactNode;
    /** Controls rendered between the record count and the search box. */
    toolbarContent?: React.ReactNode;
    selectable?: boolean;
    selectedItems?: T[];
    onSelectionChange?: (selectedItems: T[]) => void;
    /** Rows per page; 0 shows every row (useful for printing). */
    pageSize?: number;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 0];

const toComparable = (value: unknown): string | number => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value;
    const text = String(value).trim();
    const numeric = text.replace(/[^0-9.\-]/g, '');
    if (numeric !== '' && numeric !== '-' && /\d/.test(text) && !/[a-zA-Z]{2,}/.test(text)) {
        const parsed = Number(numeric);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return text.toLowerCase();
};

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
    loadingText = 'Loading…',
    emptyTitle = 'No records found',
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
    extraHeaderActions,
    toolbarContent,
    selectable = false,
    selectedItems,
    onSelectionChange,
    pageSize = 25,
}: LookupTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [internalSelectedItems, setInternalSelectedItems] = useState<T[]>([]);
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [compact, setCompact] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize);
    const [page, setPage] = useState(1);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const showActions = !hideActions && (!!onEdit || !!onDelete);

    const selected = selectedItems ?? internalSelectedItems;
    const selectedKeys = useMemo(() => new Set(selected.map((item) => item[keyField])), [selected, keyField]);

    const getTextFromNode = (node: React.ReactNode): string => {
        if (node === null || node === undefined || node === false) return '';
        if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
            return String(node);
        }
        if (Array.isArray(node)) {
            return node.map(getTextFromNode).join(' ');
        }
        if (React.isValidElement(node)) {
            return getTextFromNode((node.props as { children?: React.ReactNode }).children);
        }
        return '';
    };

    const filteredData = useMemo(() => {
        const matched = !searchable || !normalizedSearch
            ? data
            : data.filter((item) => {
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

        if (!sortBy) return matched;
        const column = columns.find((col) => col.header === sortBy);
        if (!column) return matched;

        const direction = sortDir === 'asc' ? 1 : -1;
        return [...matched].sort((a, b) => {
            const left = toComparable(column.sortValue ? column.sortValue(a) : getTextFromNode(column.render(a)));
            const right = toComparable(column.sortValue ? column.sortValue(b) : getTextFromNode(column.render(b)));
            if (typeof left === 'number' && typeof right === 'number') return (left - right) * direction;
            return String(left).localeCompare(String(right), undefined, { numeric: true }) * direction;
        });
    }, [columns, data, filterFunction, normalizedSearch, searchFields, searchable, sortBy, sortDir]);

    useEffect(() => {
        onFilteredDataChange?.(filteredData);
    }, [filteredData, onFilteredDataChange]);

    useEffect(() => {
        setPage(1);
    }, [normalizedSearch, rowsPerPage, data.length]);

    const totalPages = rowsPerPage > 0 ? Math.max(1, Math.ceil(filteredData.length / rowsPerPage)) : 1;
    const currentPage = Math.min(page, totalPages);
    const visibleRows = rowsPerPage > 0
        ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
        : filteredData;

    const handleSelect = (item: T, checked: boolean) => {
        const next = checked
            ? [...selected, item]
            : selected.filter((i) => i[keyField] !== item[keyField]);
        if (selectedItems === undefined) setInternalSelectedItems(next);
        onSelectionChange?.(next);
    };

    const handleSelectAll = (checked: boolean) => {
        const next = checked ? [...filteredData] : [];
        if (selectedItems === undefined) setInternalSelectedItems(next);
        onSelectionChange?.(next);
    };

    const handleSort = (col: Column<T>) => {
        if (col.sortable === false) return;
        if (sortBy !== col.header) {
            setSortBy(col.header);
            setSortDir('asc');
        } else if (sortDir === 'asc') {
            setSortDir('desc');
        } else {
            setSortBy(null);
            setSortDir('asc');
        }
    };

    const totalColumns = columns.length + (showActions ? 1 : 0) + (selectable ? 1 : 0);
    const allSelected = filteredData.length > 0 && selected.length === filteredData.length;

    const cellWidth = (col: Column<T>) =>
        col.width ? (typeof col.width === 'number' ? `${col.width}px` : col.width) : undefined;

    return (
        <div className="animate-fade page-section">
            {(title || subtitle || (onAdd && addButtonLabel) || extraHeaderActions) && (
                <header className="page-header">
                    <div>
                        {title && <h1 className="auth-title page-heading">{title}</h1>}
                        {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    </div>
                    <div className="page-actions">
                        {extraHeaderActions}
                        {onAdd && addButtonLabel && (
                            <button type="button" className="btn btn-primary btn-wide" onClick={onAdd}>
                                + {addButtonLabel}
                            </button>
                        )}
                    </div>
                </header>
            )}

            {(searchable || toolbarContent || data.length > 0) && (
                <div className="table-toolbar">
                    <span className="table-meta">
                        {loading && data.length === 0
                            ? 'Loading…'
                            : `${filteredData.length}${searchTerm ? ` of ${data.length}` : ''} record${filteredData.length === 1 ? '' : 's'}`}
                    </span>
                    <div className="page-actions">
                        {toolbarContent}
                        <button
                            type="button"
                            className="icon-toggle no-print"
                            onClick={() => setCompact((prev) => !prev)}
                            title="Toggle row density"
                        >
                            {compact ? 'Comfortable' : 'Compact'}
                        </button>
                        {searchable && (
                            <input
                                type="search"
                                className="search-input"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                aria-label="Search records"
                            />
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="glass alert-card error" role="alert">
                    {error}
                </div>
            )}

            <div className="glass table-card table-responsive">
                <table className={`premium-table${compact ? ' premium-table--compact' : ''}`}>
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="table-actions-col">
                                    <input
                                        type="checkbox"
                                        className="checkbox-input"
                                        checked={allSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        aria-label="Select all"
                                    />
                                </th>
                            )}
                            {columns.map((col) => {
                                const isSorted = sortBy === col.header;
                                const sortable = col.sortable !== false;
                                return (
                                    <th
                                        key={col.header}
                                        className={`${sortable ? 'th-sortable' : ''}${col.numeric ? ' is-numeric' : ''}`.trim()}
                                        style={{ width: cellWidth(col), textAlign: col.align || 'left' }}
                                        onClick={sortable ? () => handleSort(col) : undefined}
                                        aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                                    >
                                        <span className="th-sort-inner">
                                            {col.header}
                                            {sortable && col.header && (
                                                <span className={`sort-caret${isSorted ? ' sort-caret--active' : ''}`}>
                                                    {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                                                </span>
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                            {showActions && <th className="table-actions-col">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && data.length === 0 ? (
                            <tr>
                                <td colSpan={totalColumns} className="empty-state">
                                    <div className="animate-pulse" style={{ width: 36, height: 36, margin: '0 auto 0.75rem', background: 'var(--primary)', borderRadius: '50%', opacity: 0.45 }} />
                                    {loadingText}
                                </td>
                            </tr>
                        ) : visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={totalColumns} className="empty-state">
                                    <p className="empty-title">
                                        {searchTerm ? 'No matching records' : emptyTitle}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        {searchTerm ? 'Try another search term.' : emptyText}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((item, idx) => (
                                <tr
                                    key={String(item[keyField]) || idx}
                                    className={selectedKeys.has(item[keyField]) ? 'row-selected' : undefined}
                                >
                                    {selectable && (
                                        <td className="table-actions-col">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={selectedKeys.has(item[keyField])}
                                                onChange={(e) => handleSelect(item, e.target.checked)}
                                                aria-label="Select row"
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td
                                            key={col.header}
                                            className={col.numeric ? 'is-numeric' : undefined}
                                            style={{ width: cellWidth(col), textAlign: col.align || 'left' }}
                                        >
                                            {col.render(item)}
                                        </td>
                                    ))}
                                    {showActions && (
                                        <td className="table-actions-col">
                                            <div className="table-actions">
                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn-small"
                                                        onClick={() => onEdit(item)}
                                                    >
                                                        {editButtonLabel}
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn-small btn-danger"
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

                {filteredData.length > 0 && (
                    <div className="table-pagination no-print">
                        <span>
                            {rowsPerPage > 0
                                ? `Showing ${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, filteredData.length)} of ${filteredData.length}`
                                : `Showing all ${filteredData.length}`}
                        </span>
                        <div className="pager-buttons">
                            <select
                                className="pager-btn"
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                aria-label="Rows per page"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size === 0 ? 'All rows' : `${size} / page`}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="pager-btn"
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage <= 1 || rowsPerPage === 0}
                            >
                                ‹
                            </button>
                            <span className="pager-btn pager-btn--current">{currentPage}</span>
                            <span>of {totalPages}</span>
                            <button
                                type="button"
                                className="pager-btn"
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage >= totalPages || rowsPerPage === 0}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
