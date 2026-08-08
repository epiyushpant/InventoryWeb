'use client';

import { useCapabilities } from '@/components/CapabilityProvider';

/**
 * Show a field when the shop has it enabled and the caller's role is granted it.
 * Compliance fields (PAN/VAT) stay enforced in the API regardless.
 */
export function useFieldCapability() {
  const { canUse, isEnabled, loading } = useCapabilities();

  const showField = (fieldKey: string, gateKey?: string) => {
    if (loading) return true;
    if (gateKey && !canUse(gateKey)) return false;
    return canUse(fieldKey);
  };

  return { showField, isEnabled, canUse, loading };
}
