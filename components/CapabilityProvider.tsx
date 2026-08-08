'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tenantsApi } from '@/lib/api';
import { getAuthToken } from '@/lib/api';

type CapMap = Record<string, boolean>;

export type CapCategory = 'module' | 'feature' | 'form' | 'field' | 'report';

/**
 * One catalog row as the API returns it. `enabled` is the raw tick an admin sees in the tree;
 * `effective` is the same tick after the module/feature cascade.
 */
export type CapabilityItem = {
  key: string;
  label: string;
  category: CapCategory;
  parent?: string | null;
  forms?: string[] | null;
  requires?: string[] | null;
  enabled: boolean;
  effective: boolean;
};

type CapabilityContextValue = {
  loading: boolean;
  preset: string;
  tenantName: string;
  enabled: CapMap;
  allowed: CapMap;
  isEnabled: (key: string) => boolean;
  isAllowed: (key: string) => boolean;
  canUse: (key: string) => boolean;
  refresh: () => Promise<void>;
};

const CapabilityContext = createContext<CapabilityContextValue>({
  loading: true,
  preset: 'Full',
  tenantName: '',
  enabled: {},
  allowed: {},
  isEnabled: () => true,
  isAllowed: () => true,
  canUse: () => true,
  refresh: async () => {},
});

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('Full');
  const [tenantName, setTenantName] = useState('');
  const [enabled, setEnabled] = useState<CapMap>({});
  const [allowed, setAllowed] = useState<CapMap>({});

  const refresh = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await tenantsApi.getCapabilities();
      setPreset(data.preset || 'Full');
      setTenantName(data.name || '');
      setEnabled(data.enabled || {});
      setAllowed(data.allowed || {});
    } catch {
      setEnabled({});
      setAllowed({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (key: string) => {
      if (!(key in enabled)) return true; // unknown = allow
      return !!enabled[key];
    },
    [enabled]
  );

  const isAllowed = useCallback(
    (key: string) => {
      if (!(key in allowed)) return true; // unknown = allow
      return !!allowed[key];
    },
    [allowed]
  );

  /** The shop must own it and the caller's role must be granted it. */
  const canUse = useCallback((key: string) => isEnabled(key) && isAllowed(key), [isEnabled, isAllowed]);

  const value = useMemo(
    () => ({ loading, preset, tenantName, enabled, allowed, isEnabled, isAllowed, canUse, refresh }),
    [loading, preset, tenantName, enabled, allowed, isEnabled, isAllowed, canUse, refresh]
  );

  return <CapabilityContext.Provider value={value}>{children}</CapabilityContext.Provider>;
}

export function useCapabilities() {
  return useContext(CapabilityContext);
}

/** Nav href → required capability key. Admin-only screens are role-gated, never capability-gated. */
export const NAV_CAPABILITY: Record<string, string> = {
  '/categories': 'form.categories',
  '/locations': 'form.locations',
  '/suppliers': 'form.suppliers',
  '/customers': 'form.customers',
  '/products': 'form.products',
  '/unit-conversions': 'form.unitConversions',
  '/inventories': 'form.inventories',
  '/stock-movements': 'form.stockMovements',
  '/stock-adjustments': 'form.stockAdjustments',
  '/stock-transfers': 'form.stockTransfers',
  '/purchase-requisitions': 'form.purchaseRequisitions',
  '/purchase-orders': 'form.purchaseOrders',
  '/grns': 'form.grns',
  '/sales': 'form.sales',
  '/delivery-notes': 'form.deliveryNotes',
  '/sales-invoices': 'form.salesInvoices',
  '/reports': 'form.reports',
  '/users': 'form.users',
};

/** Route guarding — nav keys plus detail routes that have no sidebar link of their own. */
export const ROUTE_CAPABILITY: Record<string, string> = {
  ...NAV_CAPABILITY,
  '/purchase-order-details': 'form.purchaseOrders',
  '/sales-details': 'form.sales',
};

/** Screens that are role-gated only, so an admin can never lock themselves out. */
export const ADMIN_ONLY_ROUTES = ['/admin', '/roles', '/users'];

export const REPORT_CAPABILITY: Record<string, string> = {
  'stock-summary': 'report.stock-summary',
  'low-stock': 'report.low-stock',
  'stock-ledger': 'report.stock-ledger',
  'purchase-history': 'report.purchase-history',
  'sales-history': 'report.sales-history',
  'vat-sales-register': 'report.vat-sales-register',
  'vat-purchase-register': 'report.vat-purchase-register',
  'fiscal-year-stock': 'report.fiscal-year-stock',
  'expiry-soon': 'report.expiry-soon',
};
