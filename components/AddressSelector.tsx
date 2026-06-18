import React, { useEffect, useRef, useState } from 'react';
import { addressesApi } from '../lib/api';

interface Country {
    countryID: number;
    countryName: string;
    isoCode: string;
}

interface Province {
    provinceID: number;
    provinceName: string;
}

interface District {
    districtID: number;
    districtName: string;
}

interface Municipality {
    municipalityID: number;
    municipalityName: string;
    type: string;
}

interface AddressSelectorProps {
    country?: string;
    city?: string;
    address?: string;
    onChange: (updates: { country: string; city: string; address: string }) => void;
}

/**
 * Parses a Nepal address string saved as "Province Name, District Name, Street"
 * and returns { provinceName, districtName, street }.
 */
function parseNepalAddress(address: string) {
    if (!address) return { provinceName: '', districtName: '', street: '' };
    const parts = address.split(',').map((p) => p.trim());
    if (parts.length >= 2 && parts[0].toLowerCase().includes('province')) {
        return {
            provinceName: parts[0],
            districtName: parts[1] ?? '',
            street: parts.slice(2).join(', '),
        };
    }
    return { provinceName: '', districtName: '', street: address };
}

export default function AddressSelector({
    country = '',
    city = '',
    address = '',
    onChange,
}: AddressSelectorProps) {
    const [countries, setCountries] = useState<Country[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

    const [selectedCountry, setSelectedCountry] = useState(country);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
    const [selectedMunicipality, setSelectedMunicipality] = useState(city);
    const [streetAddress, setStreetAddress] = useState('');

    // True while we are processing a user interaction — prevents the prop-sync
    // effect from resetting internal state after our own onChange fires.
    const isInternalChange = useRef(false);

    // Whether the edit-mode auto-resolve chain has already run.
    const resolvedFromProps = useRef(false);

    // Pending values to carry across async resolve effects.
    const pendingDistrict = useRef('');
    const pendingMunicipality = useRef('');
    const pendingStreet = useRef('');

    // ─── Load countries once ───────────────────────────────────────────────────
    useEffect(() => {
        addressesApi
            .getCountries()
            .then(setCountries)
            .catch((err) => console.error('Error fetching countries:', err));
    }, []);

    // ─── Sync when parent props change (e.g. opening a different record) ───────
    // Skip if the change was triggered by our own onChange to avoid a reset loop.
    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }

        // A genuinely external prop change — reset everything and re-resolve.
        resolvedFromProps.current = false;
        setSelectedCountry(country);
        setSelectedMunicipality(city);
        setSelectedProvinceId('');
        setSelectedDistrictId('');

        if (country !== 'Nepal') {
            setProvinces([]);
            setDistricts([]);
            setMunicipalities([]);
            setStreetAddress(address || '');
        } else {
            const { street } = parseNepalAddress(address);
            setStreetAddress(street);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [country, city, address]);

    // ─── Fetch provinces when country is Nepal ─────────────────────────────────
    useEffect(() => {
        if (selectedCountry === 'Nepal') {
            addressesApi
                .getProvinces()
                .then(setProvinces)
                .catch((err) => console.error('Error fetching provinces:', err));
        } else {
            setProvinces([]);
            setDistricts([]);
            setMunicipalities([]);
        }
    }, [selectedCountry]);

    // ─── Auto-resolve province from saved name (edit mode) ────────────────────
    useEffect(() => {
        if (resolvedFromProps.current) return;
        if (selectedCountry !== 'Nepal') return;
        if (provinces.length === 0) return;

        const { provinceName, districtName, street } = parseNepalAddress(address);
        if (!provinceName) { resolvedFromProps.current = true; return; }

        const matched = provinces.find(
            (p) => p.provinceName.toLowerCase() === provinceName.toLowerCase()
        );
        if (matched) {
            setSelectedProvinceId(matched.provinceID);
            pendingDistrict.current = districtName;
            pendingMunicipality.current = city;
            pendingStreet.current = street;
        } else {
            resolvedFromProps.current = true;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provinces]);

    // ─── Fetch districts when province changes ─────────────────────────────────
    useEffect(() => {
        if (selectedProvinceId) {
            addressesApi
                .getDistricts(selectedProvinceId)
                .then(setDistricts)
                .catch((err) => console.error('Error fetching districts:', err));
        } else {
            setDistricts([]);
            setMunicipalities([]);
        }
    }, [selectedProvinceId]);

    // ─── Auto-resolve district from saved name (edit mode) ────────────────────
    useEffect(() => {
        if (resolvedFromProps.current) return;
        if (districts.length === 0) return;
        if (!pendingDistrict.current) return;

        const matched = districts.find(
            (d) => d.districtName.toLowerCase() === pendingDistrict.current.toLowerCase()
        );
        if (matched) {
            setSelectedDistrictId(matched.districtID);
        } else {
            resolvedFromProps.current = true;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [districts]);

    // ─── Fetch municipalities when district changes ────────────────────────────
    useEffect(() => {
        if (selectedDistrictId) {
            addressesApi
                .getMunicipalities(selectedDistrictId)
                .then(setMunicipalities)
                .catch((err) => console.error('Error fetching municipalities:', err));
        } else {
            setMunicipalities([]);
        }
    }, [selectedDistrictId]);

    // ─── Auto-resolve municipality from saved name (edit mode) ────────────────
    useEffect(() => {
        if (resolvedFromProps.current) return;
        if (municipalities.length === 0) return;

        if (pendingMunicipality.current) {
            const matched = municipalities.find(
                (m) => m.municipalityName.toLowerCase() === pendingMunicipality.current.toLowerCase()
            );
            if (matched) setSelectedMunicipality(matched.municipalityName);
        }
        if (pendingStreet.current) setStreetAddress(pendingStreet.current);
        resolvedFromProps.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [municipalities]);

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const getProvinceName = () =>
        provinces.find((p) => p.provinceID === selectedProvinceId)?.provinceName || '';
    const getDistrictName = () =>
        districts.find((d) => d.districtID === selectedDistrictId)?.districtName || '';

    // ─── User interaction handlers ─────────────────────────────────────────────
    const handleCountryChange = (val: string) => {
        isInternalChange.current = true;
        resolvedFromProps.current = true;
        setSelectedCountry(val);
        setSelectedProvinceId('');
        setSelectedDistrictId('');
        setSelectedMunicipality('');
        setStreetAddress('');
        onChange({ country: val, city: '', address: '' });
    };

    const handleProvinceChange = (provinceId: number) => {
        isInternalChange.current = true;
        resolvedFromProps.current = true;
        setSelectedProvinceId(provinceId);
        setSelectedDistrictId('');
        setSelectedMunicipality('');
        const provName = provinces.find((p) => p.provinceID === provinceId)?.provinceName || '';
        onChange({ country: 'Nepal', city: '', address: provName });
    };

    const handleDistrictChange = (districtId: number) => {
        isInternalChange.current = true;
        setSelectedDistrictId(districtId);
        setSelectedMunicipality('');
        const distName = districts.find((d) => d.districtID === districtId)?.districtName || '';
        onChange({ country: 'Nepal', city: '', address: `${getProvinceName()}, ${distName}` });
    };

    const handleMunicipalityChange = (municipalityName: string) => {
        isInternalChange.current = true;
        setSelectedMunicipality(municipalityName);
        onChange({
            country: 'Nepal',
            city: municipalityName,
            address: `${getProvinceName()}, ${getDistrictName()}${streetAddress ? `, ${streetAddress}` : ''}`,
        });
    };

    const handleStreetChange = (val: string) => {
        isInternalChange.current = true;
        setStreetAddress(val);
        if (selectedCountry === 'Nepal') {
            onChange({
                country: 'Nepal',
                city: selectedMunicipality,
                address: `${getProvinceName()}, ${getDistrictName()}${val ? `, ${val}` : ''}`,
            });
        } else {
            onChange({ country: selectedCountry, city, address: val });
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Country, Province, District, Municipality in 4-column row */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {/* Country */}
                <div className="form-group">
                    <label className="form-label">Country</label>
                    <select
                        className="form-input"
                        value={selectedCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                    >
                        <option value="">Select Country</option>
                        {countries.map((c) => (
                            <option key={c.countryID} value={c.countryName}>
                                {c.countryName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Province (Nepal) or City (other) */}
                {selectedCountry !== 'Nepal' ? (
                    <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. New York"
                            value={city || ''}
                            onChange={(e) => {
                                isInternalChange.current = true;
                                onChange({ country: selectedCountry, city: e.target.value, address });
                            }}
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <label className="form-label">Province</label>
                        <select
                            className="form-input"
                            value={selectedProvinceId}
                            onChange={(e) => handleProvinceChange(Number(e.target.value))}
                        >
                            <option value="">Select Province</option>
                            {provinces.map((p) => (
                                <option key={p.provinceID} value={p.provinceID}>
                                    {p.provinceName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* District (Nepal only) */}
                {selectedCountry === 'Nepal' && (
                    <div className="form-group">
                        <label className="form-label">District</label>
                        <select
                            className="form-input"
                            value={selectedDistrictId}
                            disabled={!selectedProvinceId}
                            onChange={(e) => handleDistrictChange(Number(e.target.value))}
                        >
                            <option value="">Select District</option>
                            {districts.map((d) => (
                                <option key={d.districtID} value={d.districtID}>
                                    {d.districtName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Municipality / VDC (Nepal only) */}
                {selectedCountry === 'Nepal' && (
                    <div className="form-group">
                        <label className="form-label">Municipality / VDC</label>
                        <select
                            className="form-input"
                            value={selectedMunicipality}
                            disabled={!selectedDistrictId}
                            onChange={(e) => handleMunicipalityChange(e.target.value)}
                        >
                            <option value="">Select Municipality</option>
                            {municipalities.map((m) => (
                                <option key={m.municipalityID} value={m.municipalityName}>
                                    {m.municipalityName} ({m.type})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Street Address in 2 rows */}
            <div className="form-group">
                <label className="form-label">Street Address</label>
                <textarea
                    className="form-input"
                    placeholder="e.g. Ward No. 4&#10;123 Main Street, Near Temple"
                    value={streetAddress}
                    onChange={(e) => handleStreetChange(e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical', minHeight: '4.5rem' }}
                />
            </div>
        </div>
    );
}
