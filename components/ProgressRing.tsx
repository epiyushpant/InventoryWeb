'use client';

import React from 'react';

type ProgressRingProps = {
    /** 0 - 100 */
    percent: number;
    label?: React.ReactNode;
    caption?: React.ReactNode;
    size?: number;
    thickness?: number;
    color?: string;
};

export default function ProgressRing({
    percent,
    label,
    caption,
    size = 92,
    thickness = 9,
    color = 'var(--tone-primary)',
}: ProgressRingProps) {
    const clamped = Math.max(0, Math.min(100, percent));
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const dash = (clamped / 100) * circumference;

    return (
        <div className="ring">
            <div className="ring__chart" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
                    <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="var(--surface-subtle)"
                            strokeWidth={thickness}
                        />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth={thickness}
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                        />
                    </g>
                </svg>
                <span className="ring__percent">{Math.round(clamped)}%</span>
            </div>
            {label && <span className="ring__label">{label}</span>}
            {caption && <span className="ring__caption">{caption}</span>}
        </div>
    );
}
