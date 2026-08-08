'use client';

import { formatNpr } from '@/lib/format';

type MoneyCellProps = {
  amount: number | null | undefined;
  strong?: boolean;
  muted?: boolean;
  className?: string;
};

/** Consistent NPR display for table cells and summaries. */
export default function MoneyCell({ amount, strong, muted, className = '' }: MoneyCellProps) {
  const text = formatNpr(amount);
  if (strong) {
    return (
      <strong className={`money-cell money-cell--strong ${className}`.trim()}>{text}</strong>
    );
  }
  return (
    <span
      className={`money-cell ${muted ? 'money-cell--muted' : ''} ${className}`.trim()}
    >
      {text}
    </span>
  );
}
