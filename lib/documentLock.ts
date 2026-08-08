/** Wave B — document status locks (mirrors api DocumentLock). */

export type DocumentType =
  | 'PurchaseOrder'
  | 'Sale'
  | 'PurchaseRequisition'
  | 'StockTransfer'
  | 'GRN'
  | 'DeliveryNote'
  | 'SalesInvoice';

function norm(status?: string | null) {
  return (status ?? '').trim();
}

function isOneOf(status: string, allowed: string[]) {
  return allowed.some(a => a.toLowerCase() === status.toLowerCase());
}

export function isDocumentEditable(docType: DocumentType, status?: string | null): boolean {
  const s = norm(status);
  switch (docType) {
    case 'PurchaseOrder':
      return isOneOf(s, ['Draft', 'Pending']);
    case 'Sale':
      return isOneOf(s, ['Draft', 'Pending', 'Confirmed']);
    case 'PurchaseRequisition':
      return isOneOf(s, ['Pending']);
    case 'StockTransfer':
      return isOneOf(s, ['Pending', 'In Transit']);
    case 'GRN':
    case 'DeliveryNote':
    case 'SalesInvoice':
      return false;
    default:
      return true;
  }
}

export function isPaymentStatusEditable(status?: string | null): boolean {
  return isOneOf(norm(status), ['Due', 'Partial', 'Paid']);
}

export function lockReason(docType: DocumentType, status?: string | null): string {
  if (docType === 'GRN' || docType === 'DeliveryNote') {
    return 'Posted record — view only. Create a new document for corrections.';
  }
  if (docType === 'SalesInvoice') {
    return 'Invoice totals are locked. Payment status can still be updated.';
  }
  return `Locked (status: ${status || '—'}). View only.`;
}
