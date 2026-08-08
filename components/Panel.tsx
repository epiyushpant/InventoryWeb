'use client';

import React from 'react';

type PanelProps = {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    /** Remove body padding, e.g. when the body is a full-bleed table. */
    flush?: boolean;
    className?: string;
};

export default function Panel({ title, subtitle, actions, children, flush, className = '' }: PanelProps) {
    return (
        <section className={`panel ${className}`.trim()}>
            <div className="panel__header">
                <div>
                    <h3 className="panel__title">{title}</h3>
                    {subtitle && <p className="panel__subtitle">{subtitle}</p>}
                </div>
                {actions && <div className="page-actions">{actions}</div>}
            </div>
            <div className={`panel__body${flush ? ' panel__body--flush' : ''}`}>{children}</div>
        </section>
    );
}
