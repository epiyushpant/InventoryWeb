'use client';

import React, { useId } from 'react';

type TrendChartProps = {
    values: number[];
    labels?: string[];
    color?: string;
    height?: number;
    variant?: 'area' | 'bars';
    /** Formats the y-axis tick + tooltip values. */
    format?: (value: number) => string;
};

const WIDTH = 640;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const TICKS = 4;

function niceMax(value: number) {
    if (value <= 0) return 4;
    const pow = Math.pow(10, Math.floor(Math.log10(value)));
    const scaled = value / pow;
    const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
    return step * pow;
}

export default function TrendChart({
    values,
    labels,
    color = 'var(--tone-primary)',
    height = 220,
    variant = 'area',
    format = (v) => `${v}`,
}: TrendChartProps) {
    const gradientId = useId().replace(/:/g, '');

    if (!values || values.length === 0) {
        return <p className="text-muted-small">No data for this period.</p>;
    }

    const max = niceMax(Math.max(...values, 1));
    const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
    const plotH = height - PAD_TOP - PAD_BOTTOM;
    const x = (i: number) =>
        values.length > 1 ? PAD_LEFT + (i / (values.length - 1)) * plotW : PAD_LEFT + plotW / 2;
    const y = (v: number) => PAD_TOP + plotH - (v / max) * plotH;

    const gridLines = Array.from({ length: TICKS + 1 }, (_, i) => {
        const value = (max / TICKS) * i;
        return { value, yPos: y(value) };
    });

    const linePoints = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const slot = plotW / values.length;
    const barWidth = Math.max(8, slot * 0.45);

    return (
        <svg
            width="100%"
            viewBox={`0 0 ${WIDTH} ${height}`}
            role="img"
            className="trend-chart"
            style={{ display: 'block' }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {gridLines.map((g, i) => (
                <g key={i}>
                    <line
                        x1={PAD_LEFT}
                        y1={g.yPos}
                        x2={WIDTH - PAD_RIGHT}
                        y2={g.yPos}
                        stroke="var(--surface-border)"
                        strokeWidth="1"
                        strokeDasharray={i === 0 ? '0' : '3 4'}
                    />
                    <text x={PAD_LEFT - 8} y={g.yPos + 4} textAnchor="end" className="trend-chart__tick">
                        {format(Math.round(g.value))}
                    </text>
                </g>
            ))}

            {variant === 'bars'
                ? values.map((v, i) => {
                      const barX = x(i) - barWidth / 2;
                      const barY = y(v);
                      return (
                          <rect
                              key={i}
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={Math.max(1, PAD_TOP + plotH - barY)}
                              rx={4}
                              fill={color}
                              opacity={0.35 + 0.65 * (v / max)}
                          >
                              {labels?.[i] && <title>{`${labels[i]}: ${format(v)}`}</title>}
                          </rect>
                      );
                  })
                : (
                      <>
                          <path
                              d={`M ${PAD_LEFT},${PAD_TOP + plotH} L ${linePoints} L ${WIDTH - PAD_RIGHT},${PAD_TOP + plotH} Z`}
                              fill={`url(#${gradientId})`}
                          />
                          <polyline
                              fill="none"
                              stroke={color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={linePoints}
                          />
                          {values.map((v, i) => (
                              <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke={color} strokeWidth="2">
                                  {labels?.[i] && <title>{`${labels[i]}: ${format(v)}`}</title>}
                              </circle>
                          ))}
                      </>
                  )}

            {labels?.map((label, i) => (
                <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="trend-chart__label">
                    {label}
                </text>
            ))}
        </svg>
    );
}
