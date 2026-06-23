import React from 'react';

interface FormErrorsProps {
    errors: string[];
}

export default function FormErrors({ errors }: FormErrorsProps) {
    if (!errors || errors.length === 0) return null;

    return (
        <div className="alert-card error animate-fade" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>⚠️</span>
                <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 600 }}>Please correct the following errors:</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', opacity: 0.9 }}>
                        {errors.map((err, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{err}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
