'use client';

import React from 'react';
import Link from 'next/link';
import Sparkline from './Sparkline';

export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_COLOR: Record<StatTone, string> = {
    primary: 'var(--tone-primary)',
    success: 'var(--tone-success)',
    warning: 'var(--tone-warning)',
    danger: 'var(--tone-danger)',
    info: 'var(--tone-info)',
    neutral: 'var(--text-muted)',
};

type StatCardProps = {
    label: string;
    value: React.ReactNode;
    unit?: string;
    hint?: React.ReactNode;
    alert?: React.ReactNode;
    icon?: React.ReactNode;
    tone?: StatTone;
    accentValue?: boolean;
    footer?: React.ReactNode;
    href?: string;
    linkLabel?: string;
    /** Optional mini trend rendered under the value. */
    spark?: number[];
    sparkVariant?: 'area' | 'bars';
};

export default function StatCard({
    label,
    value,
    unit,
    hint,
    alert,
    icon,
    tone = 'primary',
    accentValue = false,
    footer,
    href,
    linkLabel = 'View details',
    spark,
    sparkVariant = 'area',
}: StatCardProps) {
    return (
        <div className="stat-card" style={{ ['--stat-accent' as string]: TONE_COLOR[tone] }}>
            <div className="stat-card__top">
                <p className="stat-card__label">{label}</p>
                {icon && <span className="stat-card__icon">{icon}</span>}
            </div>

            <p className={`stat-card__value${accentValue ? ' stat-card__value--accent' : ''}`}>
                {value}
                {unit && <span className="stat-card__unit">{unit}</span>}
            </p>

            {spark && spark.length > 1 && (
                <div className="stat-card__spark">
                    <Sparkline
                        values={spark}
                        color={TONE_COLOR[tone]}
                        height={38}
                        variant={sparkVariant}
                        showDots={false}
                    />
                </div>
            )}

            {(alert || hint) && (
                <p className="stat-card__hint">
                    {alert && <span className="alert-text" style={{ display: 'block' }}>{alert}</span>}
                    {hint}
                </p>
            )}

            {(footer || href) && (
                <div className="stat-card__foot">
                    {footer}
                    {href && !footer && (
                        <Link href={href} className="link-primary" style={{ fontSize: '0.8rem' }}>
                            {linkLabel} →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
