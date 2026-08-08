'use client';

import React from 'react';

export type DonutSegment = { label: string; value: number; color: string };

type DonutChartProps = {
    segments: DonutSegment[];
    size?: number;
    thickness?: number;
    centerValue?: React.ReactNode;
    centerLabel?: React.ReactNode;
};

export default function DonutChart({
    segments,
    size = 176,
    thickness = 22,
    centerValue,
    centerLabel,
}: DonutChartProps) {
    const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="donut" style={{ width: size, height: size }}>
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
                    {total > 0 &&
                        segments.map((s, i) => {
                            const value = Math.max(0, s.value);
                            const dash = (value / total) * circumference;
                            const node = (
                                <circle
                                    key={i}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={s.color}
                                    strokeWidth={thickness}
                                    strokeDasharray={`${dash} ${circumference - dash}`}
                                    strokeDashoffset={-offset}
                                >
                                    <title>{`${s.label}: ${value}`}</title>
                                </circle>
                            );
                            offset += dash;
                            return node;
                        })}
                </g>
            </svg>
            {(centerValue || centerLabel) && (
                <div className="donut__center">
                    {centerValue && <span className="donut__value">{centerValue}</span>}
                    {centerLabel && <span className="donut__label">{centerLabel}</span>}
                </div>
            )}
        </div>
    );
}
