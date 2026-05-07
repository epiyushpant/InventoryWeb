'use client';

import { useEffect, useState } from 'react';
import { inventoriesApi } from '../api';

interface LookupItem {
    id: number;
    name: string;
}

interface InventoryLookupProps {
    value?: number;
    onChange: (id: number) => void;
    label?: string;
    placeholder?: string;
}

export default function InventoryLookup({ value, onChange, label, placeholder }: InventoryLookupProps) {
    const [items, setItems] = useState<LookupItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLookup = async () => {
            try {
                const data = await inventoriesApi.getLookup();
                setItems(data);
            } catch (err) {
                console.error('Lookup failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLookup();
    }, []);

    return (
        <div className="form-group">
            {label && <label className="form-label">{label}</label>}
            <select
                className="form-input"
                style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.03)' }}
                value={value || ''}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={loading}
            >
                <option value="" disabled>{placeholder || 'Select an asset...'}</option>
                {items.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
