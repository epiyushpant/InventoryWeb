'use client';

import { useEffect, useState } from 'react';
import { locationsApi } from '@/lib/api';
import { formatAddress } from '@/lib/address';
import LookupTable, { Column } from '@/components/LookupTable';
import AddressSelector from '@/components/AddressSelector';
import { useFormValidation } from '@/hooks/useFormValidation';
import FormErrors from '@/components/FormErrors';

interface Location {
    locationID: number;
    warehouseName: string;
    address?: string;
    city?: string;
    country?: string;
    managerName?: string;
    contactNo?: string;
    isActive: boolean;
    type: string;
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Partial<Location>>({
        warehouseName: '',
        type: 'Warehouse',
        isActive: true
    });
    const [showModal, setShowModal] = useState(false);
    const { validationErrors, validateAndSubmit, handleApiError } = useFormValidation();

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        try {
            setLoading(true);
            const data = await locationsApi.getAll();
            setLocations(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isEditing && currentLocation.locationID) {
                await locationsApi.update(currentLocation.locationID, currentLocation);
            } else {
                await locationsApi.create(currentLocation);
            }
            setShowModal(false);
            setCurrentLocation({ 
                warehouseName: '', 
                type: 'Warehouse',
                isActive: true,
                address: '',
                city: '',
                country: '',
                managerName: '',
                contactNo: ''
            });
            setIsEditing(false);
            await loadLocations();
        } catch (err: any) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (loc: Location) => {
        setCurrentLocation(loc);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (loc: Location) => {
        if (!confirm('Are you sure you want to delete this location?')) return;
        try {
            await locationsApi.delete(loc.locationID);
            await loadLocations();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const columns: Column<Location>[] = [
        {
            header: 'Location Code',
            align: 'left',
            render: (l) => (
                <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>LOC-{l.locationID}</code>
            )
        },
        {
            header: 'Location',
            align: 'left',
            render: (l) => (
                <div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{l.warehouseName}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        {formatAddress(l.address, l.city, l.country) || 'No address specified'}
                    </p>
                </div>
            ),
        },
        {
            header: 'Manager',
            align: 'left',
            render: (l) => (
                <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{l.managerName || 'N/A'}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{l.contactNo || '-'}</p>
                </div>
            ),
        },
        {
            header: 'Type',
            align: 'center',
            render: (l) => (
                <span style={{ 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    backgroundColor: l.type === 'Warehouse' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                    color: l.type === 'Warehouse' ? '#38bdf8' : '#a855f7',
                }}>
                    {l.type}
                </span>
            ),
        },
        {
            header: 'Status',
            align: 'center',
            render: (l) => (
                <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '100px',
                    background: l.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: l.isActive ? 'var(--secondary)' : 'var(--error)',
                    fontWeight: 700,
                    border: l.isActive ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    {l.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        }
    ];

    return (
        <>
            <LookupTable<Location>
                title="Location Directory"
                subtitle="Manage warehouses and storage sites."
                addButtonLabel="Add Location"
                onAdd={() => {
                    setIsEditing(false);
                    setCurrentLocation({ warehouseName: '', type: 'Warehouse', isActive: true });
                    setShowModal(true);
                }}
                columns={columns}
                data={locations}
                keyField="locationID"
                loading={loading}
                error={error}
                loadingText="Loading Locations..."
                emptyTitle="No Locations Found"
                emptyText="Add an inventory location to get started."
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-backdrop">
                    <div className="glass animate-fade modal-card">
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 className="auth-title" style={{ fontSize: '2rem', margin: 0 }}>{isEditing ? 'Edit Location' : 'Add Location'}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Define a new warehouse or storefront.</p>
                        </div>

                        <form onSubmit={(e) => validateAndSubmit(e, handleSubmit)} noValidate>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Warehouse Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        placeholder="e.g. Central Hub"
                                        value={currentLocation.warehouseName}
                                        onChange={(e) => setCurrentLocation({ ...currentLocation, warehouseName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={currentLocation.type}
                                        onChange={(e) => setCurrentLocation({ ...currentLocation, type: e.target.value })}
                                    >
                                        <option value="Warehouse">Warehouse</option>
                                        <option value="Storefront">Storefront</option>
                                    </select>
                                </div>
                            </div>

                            <AddressSelector
                                country={currentLocation.country}
                                city={currentLocation.city}
                                address={currentLocation.address}
                                onChange={(updates) => setCurrentLocation({
                                    ...currentLocation,
                                    country: updates.country,
                                    city: updates.city,
                                    address: updates.address,
                                })}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Manager Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Responsible person"
                                        value={currentLocation.managerName}
                                        onChange={(e) => setCurrentLocation({ ...currentLocation, managerName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact No</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="+977"
                                        value={currentLocation.contactNo}
                                        onChange={(e) => setCurrentLocation({ ...currentLocation, contactNo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row-inline form-group" style={{ marginTop: '1rem' }}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    style={{ width: '20px', height: '20px' }}
                                    checked={currentLocation.isActive}
                                    onChange={(e) => setCurrentLocation({ ...currentLocation, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0 }}>Active Warehouse</label>
                            </div>

                            <FormErrors errors={validationErrors} />
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Location'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
