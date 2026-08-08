export function formatNpr(amount: number | null | undefined): string {
  const n = Number(amount) || 0;
  return `Rs. ${n.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
