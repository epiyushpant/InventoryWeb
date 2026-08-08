'use client';

import React, { useId } from 'react';

type SparklineProps = {
    /** Series values, oldest first. */
    values: number[];
    labels?: string[];
    color?: string;
    height?: number;
    /** Render vertical bars instead of an area line. */
    variant?: 'area' | 'bars';
};

export default function Sparkline({
    values,
    labels,
    color = 'var(--primary)',
    height = 110,
    variant = 'area',
}: SparklineProps) {
    const gradientId = useId().replace(/:/g, '');

    if (!values || values.length === 0) {
        return <p className="text-muted-small">No data for this period.</p>;
    }

    const width = 400;
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : width;

    if (variant === 'bars') {
        const slot = width / values.length;
        const barWidth = Math.max(6, slot * 0.5);
        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img">
                {values.map((v, i) => {
                    const barHeight = Math.max(2, (v / max) * (height - 6));
                    return (
                        <rect
                            key={i}
                            x={i * slot + (slot - barWidth) / 2}
                            y={height - barHeight}
                            width={barWidth}
                            height={barHeight}
                            rx={3}
                            fill={color}
                            opacity={0.25 + (0.75 * v) / max}
                        >
                            {labels?.[i] && <title>{`${labels[i]}: ${v}`}</title>}
                        </rect>
                    );
                })}
            </svg>
        );
    }

    const points = values.map((v, i) => `${i * step},${height - (v / max) * (height - 8) - 4}`).join(' ');

    return (
        <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{ overflow: 'visible' }}
            role="img"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M 0,${height} L ${points} L ${width},${height} Z`} fill={`url(#${gradientId})`} />
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
            {values.map((v, i) => (
                <circle
                    key={i}
                    cx={i * step}
                    cy={height - (v / max) * (height - 8) - 4}
                    r="3.5"
                    fill="#fff"
                    stroke={color}
                    strokeWidth="2"
                >
                    {labels?.[i] && <title>{`${labels[i]}: ${v}`}</title>}
                </circle>
            ))}
        </svg>
    );
}
